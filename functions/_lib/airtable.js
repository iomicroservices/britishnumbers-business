export const AIRTABLE_BASE_ID = 'appqfQkbM4rHSVsLQ';

/** WeWeb collection id → Airtable table id */
export const COLLECTION_TABLE_MAP = {
    'f307c3b2-c35c-4fda-8eeb-8519409853ea': 'tblZRBjzu1NvpenqM', // basket_items
    'dd07e718-03fb-46e0-b759-042f6654659a': 'tblht0arUwtWyILb6', // sessions
    '454772e5-f61a-421e-854c-0ef92be1df3e': 'tblSGYkDGW7RT8AtP', // companies → company_selected
    '8dc4beaa-819b-48b0-95ed-6a6d92e9156b': 'tblE3aWvlKoEReGqF', // leads
};

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

export function flattenRecord(record) {
    return {
        id: record.id,
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

    // Airtable uses opaque cursor offsets; for WeWeb-style numeric offset we
    // walk pages until we can slice the requested window.
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
