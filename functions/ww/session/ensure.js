import { ensureSession, errorResponse, json } from '../../_lib/airtable.js';

export async function onRequestPost(context) {
    try {
        let body = {};
        try {
            body = await context.request.json();
        } catch {
            body = {};
        }

        const sessionId =
            typeof body.sessionId === 'string' && body.sessionId
                ? body.sessionId
                : typeof body.data?.sessionId === 'string'
                  ? body.data.sessionId
                  : '';

        const type = body.type ?? body.data?.type ?? 'mobile';
        const is_auth = body.is_auth ?? body.data?.is_auth ?? false;

        const record = await ensureSession(context.env, {
            sessionId: sessionId || undefined,
            type,
            is_auth,
        });

        return json({ data: record });
    } catch (error) {
        return errorResponse(error);
    }
}
