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
    const url = env.MAKE_CHECKOUT_WEBHOOK_URL;
    if (!url) {
        throw new Error('MAKE_CHECKOUT_WEBHOOK_URL is not configured');
    }
    return url;
}

/** Frontend workflows open context.workflow[...].result.data */
function looksLikeUrl(value) {
    return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function normalizeCheckoutBody(body) {
    if (looksLikeUrl(body)) {
        return { data: body.trim() };
    }
    if (body && typeof body === 'object' && !Array.isArray(body) && looksLikeUrl(body.data)) {
        return body;
    }
    if (body && typeof body === 'object' && !Array.isArray(body) && looksLikeUrl(body.url) && !body.data) {
        return { ...body, data: body.url.trim() };
    }
    return body;
}

async function handleCheckout(request, env) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    const webhook = getWebhookUrl(env);
    const contentType = request.headers.get('content-type') || 'application/json';
    const bodyText = await request.text();

    const response = await fetch(webhook, {
        method: 'POST',
        headers: {
            'content-type': contentType,
            Accept: 'application/json, text/plain, */*',
        },
        body: bodyText || undefined,
    });

    const text = (await response.text()).trim();
    const upstreamType = response.headers.get('content-type') || '';

    if (upstreamType.includes('application/json')) {
        let body = null;
        try {
            body = text ? JSON.parse(text) : null;
        } catch {
            body = looksLikeUrl(text) ? { data: text } : { error: text || 'Invalid upstream response' };
        }
        return json(normalizeCheckoutBody(body), response.status);
    }

    if (!response.ok) {
        return json({ error: text || `Make checkout request failed (${response.status})` }, response.status);
    }

    // Make often returns a bare checkout URL (or "Accepted") as plain text
    try {
        const parsed = text ? JSON.parse(text) : { ok: true };
        return json(normalizeCheckoutBody(parsed), response.status);
    } catch {
        if (looksLikeUrl(text)) {
            return json({ data: text }, response.status);
        }
        return json({ ok: true, message: text || 'Accepted' }, response.status);
    }
}

export async function onRequestPost(context) {
    try {
        return await handleCheckout(context.request, context.env);
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'Unexpected proxy error' }, 500);
    }
}

export async function onRequestGet() {
    return json({ error: 'Method not allowed' }, 405);
}
