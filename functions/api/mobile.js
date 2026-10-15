const MEMORABLE_URL = 'https://api.britishnumbers.com/rest/v2/mobile/memorable';

const MATCH_COLUMNS = {
    number: 'number',
    prefix: 'prefix',
    last_six: 'last_six',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });
}

function getBritishNumbersKey(env) {
    const key = env.BRITISH_NUMBERS_API_KEY;
    if (!key) {
        throw new Error('BRITISH_NUMBERS_API_KEY is not configured');
    }
    return key;
}

function getSupabase(env) {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are not configured');
    }
    return { url: url.replace(/\/$/, ''), key };
}

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

function readPositiveInt(value, fallback) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseTotal(contentRange, rowCount) {
    const match = /\/(\d+)\s*$/.exec(contentRange || '');
    if (!match) return rowCount;
    return Number.parseInt(match[1], 10);
}

async function readQuery(request) {
    const url = new URL(request.url);
    let q = url.searchParams.get('q') || '';
    let match = url.searchParams.get('match') || 'number';
    let page = url.searchParams.get('page') || '';
    let pageSize = url.searchParams.get('pageSize') || '';

    if (request.method === 'POST') {
        try {
            const body = await request.json();
            q = body?.q || q;
            match = body?.match || match;
            page = body?.page ?? page;
            pageSize = body?.pageSize ?? pageSize;
        } catch {
            // ignore invalid JSON
        }
    }

    return {
        search: String(q || '').replace(/[^A-Za-z0-9,]/g, ''),
        match: MATCH_COLUMNS[match] ? match : 'number',
        page: readPositiveInt(page, 1),
        pageSize: Math.min(readPositiveInt(pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
    };
}

function mapRows(body) {
    const rows = Array.isArray(body) ? body : [];
    return rows.map(row => ({
        number: String(row.number ?? ''),
        price: Number(row.price ?? 0),
        prefix: row.prefix ?? '',
        last_six: row.last_six ?? '',
    }));
}

async function searchBritishNumbers(env, { search, match, page, pageSize }) {
    const offset = (page - 1) * pageSize;
    const upstream = new URL(MEMORABLE_URL);
    upstream.searchParams.set('search', search);
    upstream.searchParams.set('type', match);
    upstream.searchParams.set('match', 'fuzzy');
    upstream.searchParams.set('range', `${offset}-${offset + pageSize - 1}`);

    const response = await fetch(upstream.toString(), {
        headers: {
            Accept: 'application/json',
            'X-API-Key': getBritishNumbersKey(env),
        },
    });

    const text = await response.text();
    let body = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = null;
    }

    const contentRange = response.headers.get('content-range') || '';

    if (!response.ok && response.status !== 416) {
        const message =
            (body && (body.message || body.error)) ||
            text ||
            `Mobile number search failed (${response.status})`;
        return { ok: false, status: response.status, message };
    }

    const data = mapRows(body);
    return {
        ok: true,
        data,
        total: parseTotal(contentRange, data.length),
    };
}

async function searchSupabase(env, { search, match, page, pageSize }) {
    const { url, key } = getSupabase(env);
    const column = MATCH_COLUMNS[match];
    const offset = (page - 1) * pageSize;
    const upstream = new URL(`${url}/rest/v1/mobile_numbers`);
    upstream.searchParams.set('select', 'number,price,prefix,last_six');
    upstream.searchParams.set('available', 'eq.true');
    upstream.searchParams.set(column, `ilike.*${search}*`);
    upstream.searchParams.set('order', 'price.asc');

    const response = await fetch(upstream.toString(), {
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
            Prefer: 'count=exact',
            Range: `${offset}-${offset + pageSize - 1}`,
        },
    });

    const text = await response.text();
    let body = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = null;
    }

    const contentRange = response.headers.get('content-range') || '';

    if (!response.ok && response.status !== 416) {
        const message =
            (body && (body.message || body.error || body.hint)) ||
            text ||
            `Mobile number search failed (${response.status})`;
        return { ok: false, status: response.status, message };
    }

    const data = mapRows(body);
    return {
        ok: true,
        data,
        total: parseTotal(contentRange, data.length),
    };
}

async function handleSearch(request, env) {
    const query = await readQuery(request);
    if (query.search.length < 2) {
        return json({ data: [], page: query.page, pageSize: query.pageSize, total: 0, error: 'Enter at least 2 characters' }, 400);
    }

    const result = await searchBritishNumbers(env, query);
    if (!result.ok) {
        return json({ data: [], page: query.page, pageSize: query.pageSize, total: 0, error: result.message }, result.status);
    }

    return json({
        data: result.data,
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
    });
}

export async function onRequestGet(context) {
    try {
        return await handleSearch(context.request, context.env);
    } catch (error) {
        return json({ data: [], error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}

export async function onRequestPost(context) {
    return onRequestGet(context);
}
