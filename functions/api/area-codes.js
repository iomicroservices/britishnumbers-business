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

const PAGE_SIZE = 100;

function mapRows(body) {
    return (Array.isArray(body) ? body : []).map(row => ({
        name: String(row.name || row.code || ''),
        code: String(row.code || ''),
        featured: Boolean(row.featured),
    })).filter(row => row.code);
}

async function fetchAreaPage(baseUrl, key, from) {
    const upstream = new URL(`${baseUrl}/rest/v1/areacodes`);
    upstream.searchParams.set('select', 'name,code,featured');
    upstream.searchParams.set('order', 'name.asc');

    const response = await fetch(upstream.toString(), {
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
            Range: `${from}-${from + PAGE_SIZE - 1}`,
            Prefer: 'count=exact',
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
        const message = body?.message || body?.error || text || `Area code request failed (${response.status})`;
        const error = new Error(typeof message === 'string' ? message : 'Area code request failed');
        error.status = response.status;
        throw error;
    }

    const range = response.headers.get('content-range') || '';
    const total = range.includes('/') ? Number(range.split('/')[1]) : null;
    return {
        rows: mapRows(body),
        total: Number.isFinite(total) ? total : null,
    };
}

async function handleAreaCodes(env) {
    const { url, key } = getSupabase(env);
    const rows = [];
    let from = 0;
    let total = null;

    while (from < 5000) {
        const page = await fetchAreaPage(url, key, from);
        rows.push(...page.rows);
        total = page.total;
        if (!page.rows.length || page.rows.length < PAGE_SIZE || (total != null && from + PAGE_SIZE >= total)) break;
        from += PAGE_SIZE;
    }

    return json(rows.filter(row => row.code !== '0207'));
}

export async function onRequestGet(context) {
    try {
        return await handleAreaCodes(context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}
