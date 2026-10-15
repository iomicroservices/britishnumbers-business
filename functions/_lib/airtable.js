export const AIRTABLE_BASE_ID = 'appqfQkbM4rHSVsLQ';

export const COLLECTION_IDS = {
    BASKET_ITEMS: 'f307c3b2-c35c-4fda-8eeb-8519409853ea',
    SESSIONS: 'dd07e718-03fb-46e0-b759-042f6654659a',
    COMPANIES: '454772e5-f61a-421e-854c-0ef92be1df3e',
    LEADS: '8dc4beaa-819b-48b0-95ed-6a6d92e9156b',
};

/** WeWeb collection id → Airtable table id */
export const COLLECTION_TABLE_MAP = {
    [COLLECTION_IDS.BASKET_ITEMS]: 'tblZRBjzu1NvpenqM', // basket_items
    [COLLECTION_IDS.SESSIONS]: 'tblht0arUwtWyILb6', // sessions
    [COLLECTION_IDS.COMPANIES]: 'tblSGYkDGW7RT8AtP', // companies → company_selected
    [COLLECTION_IDS.LEADS]: 'tblE3aWvlKoEReGqF', // leads
};

const DEFAULT_SESSION_TTL_DAYS = 7;

export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });
}

export function getTableId(collectionId) {
    return COLLECTION_TABLE_MAP[collectionId] ?? null;
}

export function isSensitiveCollection(collectionId) {
    return Object.values(COLLECTION_IDS).includes(collectionId);
}

export function getSessionTtlMs(env) {
    const days = Number.parseInt(env.SESSION_TTL_DAYS || `${DEFAULT_SESSION_TTL_DAYS}`, 10);
    const safeDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_SESSION_TTL_DAYS;
    return safeDays * 24 * 60 * 60 * 1000;
}

export function isExpired(createdTime, env) {
    if (!createdTime) return false;
    const created = Date.parse(createdTime);
    if (!Number.isFinite(created)) return false;
    return Date.now() - created > getSessionTtlMs(env);
}

export function flattenRecord(record) {
    return {
        id: record.id,
        ...(record.createdTime ? { createdTime: record.createdTime } : {}),
        ...(record.fields || {}),
    };
}

export function toAirtableFields(data) {
    if (!data || typeof data !== 'object') return {};
    const fields = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || key === 'createdTime') continue;
        fields[key] = value;
    }
    return fields;
}

function getToken(env) {
    const token = env.AIRTABLE_TOKEN;
    if (!token) {
        throw new AirtableProxyError('AIRTABLE_TOKEN is not configured', 500);
    }
    return token;
}

export class AirtableProxyError extends Error {
    constructor(message, status = 500, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

async function airtableFetch(env, path, init = {}) {
    const token = getToken(env);
    const url = path.startsWith('http') ? path : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${path}`;

    const response = await fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });

    const text = await response.text();
    let body = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    if (!response.ok) {
        const message =
            typeof body === 'object' && body && 'error' in body
                ? JSON.stringify(body.error)
                : `Airtable request failed (${response.status})`;
        throw new AirtableProxyError(message, response.status, body);
    }

    return body;
}

export async function listRecords(env, tableId, options = {}) {
    const pageSize = Math.min(Math.max(options.limit || 100, 1), 100);
    const startOffset = Math.max(options.offset || 0, 0);

    const collected = [];
    let cursor;
    let scanned = 0;

    while (collected.length < pageSize) {
        const params = new URLSearchParams();
        params.set('pageSize', '100');
        if (cursor) params.set('offset', cursor);
        if (options.filterByFormula) params.set('filterByFormula', options.filterByFormula);

        const page = await airtableFetch(env, `/${tableId}?${params.toString()}`);
        const records = (page.records || []).map(flattenRecord);

        for (const record of records) {
            if (scanned >= startOffset) {
                collected.push(record);
                if (collected.length >= pageSize) break;
            }
            scanned += 1;
        }

        if (!page.offset || records.length === 0) break;
        cursor = page.offset;
    }

    const total = cursor ? scanned + 1 : scanned;

    return {
        data: collected,
        total: Math.max(total, startOffset + collected.length),
        offset: startOffset,
    };
}

export async function getRecord(env, tableId, recordId) {
    const record = await airtableFetch(env, `/${tableId}/${recordId}`);
    return flattenRecord(record);
}

export async function getRecordOrNull(env, tableId, recordId) {
    try {
        return await getRecord(env, tableId, recordId);
    } catch (error) {
        if (error instanceof AirtableProxyError && (error.status === 404 || error.status === 403)) {
            return null;
        }
        // Airtable often returns 404 as NOT_FOUND in body with status 404
        if (error instanceof AirtableProxyError && String(error.message).includes('NOT_FOUND')) {
            return null;
        }
        throw error;
    }
}

export async function createRecord(env, tableId, data) {
    const body = await airtableFetch(env, `/${tableId}`, {
        method: 'POST',
        body: JSON.stringify({ fields: toAirtableFields(data), typecast: true }),
    });
    return flattenRecord(body);
}

export async function updateRecord(env, tableId, recordId, data) {
    const body = await airtableFetch(env, `/${tableId}/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: toAirtableFields(data), typecast: true }),
    });
    return flattenRecord(body);
}

export async function deleteRecord(env, tableId, recordId) {
    await airtableFetch(env, `/${tableId}/${recordId}`, { method: 'DELETE' });
    return { id: recordId };
}

export function resolveTableOrThrow(collectionId) {
    const tableId = getTableId(collectionId);
    if (!tableId) {
        throw new AirtableProxyError(`Unknown Airtable collection: ${collectionId}`, 404);
    }
    return tableId;
}

export function getSessionLinkField(collectionId) {
    if (collectionId === COLLECTION_IDS.LEADS) return 'session';
    if (collectionId === COLLECTION_IDS.BASKET_ITEMS || collectionId === COLLECTION_IDS.COMPANIES) {
        return 'session_id';
    }
    return null;
}

export function escapeAirtableString(value) {
    return String(value).replace(/'/g, "\\'");
}

export function buildSessionScopedFilter(collectionId, sessionId) {
    const field = getSessionLinkField(collectionId);
    if (!field) {
        throw new AirtableProxyError(`Collection ${collectionId} does not support session-scoped fetch`, 400);
    }
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('rec')) {
        throw new AirtableProxyError('A valid sessionId is required', 400);
    }
    const safe = escapeAirtableString(sessionId);
    return `FIND('${safe}', ARRAYJOIN({${field}}))`;
}

export function extractSessionLink(data, collectionId) {
    const field = getSessionLinkField(collectionId);
    if (!field || !data || typeof data !== 'object') return null;
    const value = data[field];
    if (Array.isArray(value)) {
        const id = value.find(item => typeof item === 'string' && item.startsWith('rec'));
        return id || null;
    }
    if (typeof value === 'string' && value.startsWith('rec')) return value;
    return null;
}

export function assertCreatePayloadAllowed(collectionId, data) {
    if (collectionId === COLLECTION_IDS.SESSIONS) {
        throw new AirtableProxyError(
            'Direct session create is disabled. Use POST /ww/session/ensure',
            403
        );
    }

    const linkField = getSessionLinkField(collectionId);
    if (linkField && !extractSessionLink(data, collectionId)) {
        throw new AirtableProxyError(`Create requires a linked ${linkField} session id`, 400);
    }
}

export function assertFetchAllowed(collectionId, sessionId) {
    if (collectionId === COLLECTION_IDS.SESSIONS) {
        throw new AirtableProxyError('Listing sessions is disabled. Use GET by id or /ww/session/ensure', 403);
    }

    if (isSensitiveCollection(collectionId) && !sessionId) {
        throw new AirtableProxyError('sessionId is required to fetch this collection', 403);
    }
}

export async function ensureSession(env, { sessionId, type, is_auth }) {
    const tableId = COLLECTION_TABLE_MAP[COLLECTION_IDS.SESSIONS];

    if (sessionId) {
        const existing = await getRecordOrNull(env, tableId, sessionId);
        if (existing && !isExpired(existing.createdTime, env)) {
            return existing;
        }
    }

    return createRecord(env, tableId, {
        type: type || 'mobile',
        is_auth: !!is_auth,
    });
}

export function errorResponse(error) {
    if (error instanceof AirtableProxyError) {
        return json(
            {
                error: {
                    message: error.message,
                    details: error.details ?? null,
                },
                data: null,
            },
            error.status
        );
    }

    return json(
        {
            error: {
                message: error instanceof Error ? error.message : 'Unexpected proxy error',
            },
            data: null,
        },
        500
    );
}
