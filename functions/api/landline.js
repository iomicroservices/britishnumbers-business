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

function resolveProvider(env) {
    const explicit = String(env.LANDLINE_PROVIDER || '')
        .trim()
        .toLowerCase();
    if (explicit === 'tamar' || explicit === 'make') {
        return explicit;
    }
    // Default: Tamar when key is present; otherwise keep Make until removed
    return env.TAMAR_API_KEY ? 'tamar' : 'make';
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

async function readAreaCodeAndGrade(request) {
    const incoming = new URL(request.url);
    let areaCode = incoming.searchParams.get('areaCode') || '';
    let grade = incoming.searchParams.get('grade') || '';

    if (request.method === 'POST') {
        try {
            const body = await request.json();
            if (body?.areaCode != null && body.areaCode !== '') {
                areaCode = String(body.areaCode);
            }
            if (body?.grade != null && body.grade !== '') {
                grade = String(body.grade);
            }
        } catch {
            // ignore invalid JSON
        }
    }

    return {
        areaCode: String(areaCode || '').trim(),
        grade: String(grade || '').trim(),
    };
}

async function handleTamar(areaCode, env) {
    const apiKey = env.TAMAR_API_KEY;
    if (!apiKey) {
        throw new Error('TAMAR_API_KEY is not configured');
    }
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

async function handleMake(areaCode, grade, env) {
    const webhook = env.MAKE_LANDLINE_WEBHOOK_URL;
    if (!webhook) {
        throw new Error('MAKE_LANDLINE_WEBHOOK_URL is not configured');
    }

    const upstream = new URL(webhook);
    if (areaCode) upstream.searchParams.set('areaCode', areaCode);
    if (grade) upstream.searchParams.set('grade', grade);

    const response = await fetch(upstream.toString(), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        let body = null;
        try {
            body = text ? JSON.parse(text) : null;
        } catch {
            body = { error: text || 'Invalid upstream response' };
        }
        return json(body, response.status);
    }

    if (!response.ok) {
        return json({ error: text || `Make landline request failed (${response.status})` }, response.status);
    }

    try {
        return json(text ? JSON.parse(text) : null, response.status);
    } catch {
        return new Response(text, {
            status: response.status,
            headers: {
                'content-type': contentType || 'text/plain; charset=utf-8',
                'cache-control': 'no-store',
            },
        });
    }
}

async function handleLandline(request, env) {
    const { areaCode, grade } = await readAreaCodeAndGrade(request);
    const provider = resolveProvider(env);

    if (provider === 'tamar') {
        return handleTamar(areaCode, env);
    }
    return handleMake(areaCode, grade, env);
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
