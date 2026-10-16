const TAMAR_AVAILABLE_URL = 'https://api.tamar.co.uk/list/available';

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });
}

function getApiKey(env) {
    const key = env.TAMAR_API_KEY;
    if (!key) {
        throw new Error('TAMAR_API_KEY is not configured');
    }
    return key;
}

function basicAuthHeader(apiKey) {
    // Basic auth: API key as username, empty password (or full user:pass if provided)
    const credentials = apiKey.includes(':') ? apiKey : `${apiKey}:`;
    return `Basic ${btoa(credentials)}`;
}

function transformTamarMap(data) {
    // Tamar: { "01144371000": "600", ... } → [{ number, price }, ...]
    if (Array.isArray(data)) {
        return data;
    }
    if (!data || typeof data !== 'object') {
        return [];
    }
    return Object.entries(data).map(([number, price]) => ({
        number,
        price: Number(price),
    }));
}

const GRADE_BANDS = {
    Bronze: [0, 1],
    Silver: [1, 100],
    Gold: [100, 300],
    Platinum: [300, 500000],
};

const PAGE_SIZE = 100;
const CACHE_MS = 5 * 60 * 1000;
const areaCache = new Map();

function readPositiveInt(value, fallback) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function readRequest(request) {
    const incoming = new URL(request.url);
    let areaCode = incoming.searchParams.get('areaCode') || '';
    let grade = incoming.searchParams.get('grade') || '';
    let page = incoming.searchParams.get('page');

    if (request.method === 'POST') {
        try {
            const body = await request.json();
            if (body?.areaCode != null && body.areaCode !== '') areaCode = String(body.areaCode);
            if (body?.grade != null && body.grade !== '') grade = String(body.grade);
            if (body?.page != null && body.page !== '') page = body.page;
        } catch {
            // ignore invalid JSON
        }
    }

    return {
        areaCode: String(areaCode || '').trim(),
        grade: GRADE_BANDS[grade] ? grade : '',
        page: page == null || page === '' ? null : readPositiveInt(page, 1),
    };
}

function filterGrade(rows, grade) {
    const band = GRADE_BANDS[grade];
    const filtered = band
        ? rows.filter(row => Number(row.price) >= band[0] && Number(row.price) < band[1])
        : rows.slice();
    filtered.sort((a, b) => Number(a.price) - Number(b.price) || String(a.number).localeCompare(String(b.number)));
    return filtered;
}

function connectionFee(price) {
    return Math.round(Number(price) * 1.8);
}

async function loadArea(areaCode, apiKey) {
    const cached = areaCache.get(areaCode);
    if (cached && cached.expires > Date.now()) return cached.rows;

    const upstream = `${TAMAR_AVAILABLE_URL}/${encodeURIComponent(areaCode)}`;
    const response = await fetch(upstream, {
        method: 'GET',
        headers: {
            Authorization: basicAuthHeader(apiKey),
            Accept: 'application/json',
        },
    });

    const text = await response.text();
    let body = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = null;
    }

    if (!response.ok) {
        const error = new Error(body?.error || body || text || `Tamar request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    const rows = transformTamarMap(body);
    areaCache.set(areaCode, { expires: Date.now() + CACHE_MS, rows });
    return rows;
}

async function handleLandline(request, env) {
    const apiKey = getApiKey(env);
    const { areaCode, grade, page } = await readRequest(request);

    if (!areaCode) {
        return json(page == null ? [] : { data: [], page: 1, pageSize: PAGE_SIZE, total: 0 });
    }

    const rows = await loadArea(areaCode, apiKey);

    // Requests without a page stay a raw array so the live WeWeb page can keep filtering itself.
    if (page == null) return json(rows);

    const filtered = filterGrade(rows, grade);
    const start = (page - 1) * PAGE_SIZE;
    return json({
        data: filtered.slice(start, start + PAGE_SIZE).map(row => ({
            number: row.number,
            price: connectionFee(row.price),
        })),
        page,
        pageSize: PAGE_SIZE,
        total: filtered.length,
    });
}

function errorResponse(error) {
    const status = Number(error?.status) || 500;
    return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, status);
}

export async function onRequestGet(context) {
    try {
        return await handleLandline(context.request, context.env);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function onRequestPost(context) {
    try {
        return await handleLandline(context.request, context.env);
    } catch (error) {
        return errorResponse(error);
    }
}
