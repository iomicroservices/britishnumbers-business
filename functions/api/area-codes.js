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

async function handleAreaCodes(env) {
    const { url, key } = getSupabase(env);
    const upstream = new URL(`${url}/rest/v1/areacodes`);
    upstream.searchParams.set('select', 'name,code,featured');
    upstream.searchParams.set('order', 'name.asc');

    const response = await fetch(upstream.toString(), {
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
            Range: '0-999',
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
        return json({ error: message }, response.status);
    }

    const rows = (Array.isArray(body) ? body : []).map(row => ({
        name: String(row.name || row.code || ''),
        code: String(row.code || ''),
        featured: Boolean(row.featured),
    })).filter(row => row.code);

    return json(rows);
}

export async function onRequestGet(context) {
    try {
        return await handleAreaCodes(context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}
