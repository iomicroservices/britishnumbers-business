import { createRecord, errorResponse, json, resolveTableOrThrow } from '../../../../_lib/airtable.js';

export async function onRequestPost(context) {
    try {
        const collectionId = String(context.params.collectionId || '');
        const tableId = resolveTableOrThrow(collectionId);

        const body = await context.request.json();
        const record = await createRecord(context.env, tableId, body.data || {});

        return json({ data: record });
    } catch (error) {
        return errorResponse(error);
    }
}
