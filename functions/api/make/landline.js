function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });
}

function getWebhookUrl(env) {
    const url = env.MAKE_LANDLINE_WEBHOOK_URL;
    if (!url) {
        throw new Error('MAKE_LANDLINE_WEBHOOK_URL is not configured');
    }
    return url;
}

async function handleLandline(request, env) {
    const webhook = getWebhookUrl(env);
    const incoming = new URL(request.url);
    const upstream = new URL(webhook);

    for (const [key, value] of incoming.searchParams.entries()) {
        upstream.searchParams.set(key, value);
    }

    // Also accept POST body with areaCode / grade (defensive; collection uses GET)
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            for (const key of ['areaCode', 'grade']) {
                if (body?.[key] != null && body[key] !== '') {
                    upstream.searchParams.set(key, String(body[key]));
                }
            }
        } catch {
            // ignore invalid JSON
        }
    }

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

    // Make often returns plain text ("Accepted") — wrap non-JSON so axios always gets JSON
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
