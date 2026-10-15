import {
    assertCreatePayloadAllowed,
    createRecord,
    errorResponse,
    json,
    resolveTableOrThrow,
} from '../../../../_lib/airtable.js';

export async function onRequestPost(context) {
    try {
        const collectionId = String(context.params.collectionId || '');
        const tableId = resolveTableOrThrow(collectionId);

        const body = await context.request.json();
        const data = body.data || {};
        assertCreatePayloadAllowed(collectionId, data);

        const record = await createRecord(context.env, tableId, data);
        return json({ data: record });
    } catch (error) {
        return errorResponse(error);
    }
}
