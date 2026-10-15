const COMPANIES_HOUSE_SEARCH_URL = 'https://api.company-information.service.gov.uk/search/companies';

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
    const key = env.COMPANIES_HOUSE_API_KEY;
    if (!key) {
        throw new Error('COMPANIES_HOUSE_API_KEY is not configured');
    }
    return key;
}

function basicAuthHeader(apiKey) {
    // Companies House: API key as username, empty password
    const token = btoa(`${apiKey}:`);
    return `Basic ${token}`;
}

async function handleSearch(request, env) {
    const url = new URL(request.url);
    let q = url.searchParams.get('q') || '';

    if (!q && request.method === 'POST') {
        try {
            const body = await request.json();
            q = body?.q || body?.queries?.q || '';
        } catch {
            // ignore invalid JSON
        }
    }

    q = String(q || '').trim();
    if (!q) {
        return json({ items: [], total_results: 0, kind: 'search#companies' });
    }

    const apiKey = getApiKey(env);
    const upstream = new URL(COMPANIES_HOUSE_SEARCH_URL);
    upstream.searchParams.set('q', q);

    // Forward optional Companies House paging params when present
    for (const key of ['items_per_page', 'start_index']) {
        const value = url.searchParams.get(key);
        if (value) upstream.searchParams.set(key, value);
    }

    const response = await fetch(upstream.toString(), {
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
        body = { error: text || 'Invalid upstream response' };
    }

    if (!response.ok) {
        return json(
            {
                error: body?.error || body || `Companies House request failed (${response.status})`,
            },
            response.status
        );
    }

    return json(body);
}

export async function onRequestGet(context) {
    try {
        return await handleSearch(context.request, context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}

export async function onRequestPost(context) {
    try {
        return await handleSearch(context.request, context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}
