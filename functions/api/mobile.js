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
        digits: String(q || '').replace(/\D/g, ''),
        match: MATCH_COLUMNS[match] ? match : 'number',
        page: readPositiveInt(page, 1),
        pageSize: Math.min(readPositiveInt(pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
    };
}

async function handleSearch(request, env) {
    const { digits, match, page, pageSize } = await readQuery(request);
    if (digits.length < 2) {
        return json({ data: [], page, pageSize, total: 0, error: 'Enter at least 2 digits' }, 400);
    }

    const { url, key } = getSupabase(env);
    const column = MATCH_COLUMNS[match];
    const offset = (page - 1) * pageSize;
    const upstream = new URL(`${url}/rest/v1/mobile_numbers`);
    upstream.searchParams.set('select', 'number,price,prefix,last_six');
    upstream.searchParams.set('available', 'eq.true');
    upstream.searchParams.set(column, `ilike.*${digits}*`);
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
        return json({ data: [], page, pageSize, total: 0, error: message }, response.status);
    }

    const rows = Array.isArray(body) ? body : [];
    return json({
        data: rows.map(row => ({
            number: String(row.number ?? ''),
            price: Number(row.price ?? 0),
            prefix: row.prefix ?? '',
            last_six: row.last_six ?? '',
        })),
        page,
        pageSize,
        total: parseTotal(contentRange, rows.length),
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
