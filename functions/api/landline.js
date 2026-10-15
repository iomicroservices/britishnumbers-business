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

async function readAreaCode(request) {
    const incoming = new URL(request.url);
    let areaCode = incoming.searchParams.get('areaCode') || '';

    if (request.method === 'POST') {
        try {
            const body = await request.json();
            if (body?.areaCode != null && body.areaCode !== '') {
                areaCode = String(body.areaCode);
            }
        } catch {
            // ignore invalid JSON
        }
    }

    return String(areaCode || '').trim();
}

async function handleLandline(request, env) {
    const apiKey = getApiKey(env);
    const areaCode = await readAreaCode(request);

    if (!areaCode) {
        return json([]);
    }

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
        return json(
            {
                error: body?.error || body || text || `Tamar request failed (${response.status})`,
            },
            response.status
        );
    }

    return json(transformTamarMap(body));
}

export async function onRequestGet(context) {
    try {
        return await handleLandline(context.request, context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}

export async function onRequestPost(context) {
    try {
        return await handleLandline(context.request, context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}
