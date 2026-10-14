import {
    deleteRecord,
    errorResponse,
    getRecord,
    json,
    resolveTableOrThrow,
    updateRecord,
} from '../../../../../_lib/airtable.js';

export async function onRequestGet(context) {
    try {
        const collectionId = String(context.params.collectionId || '');
        const recordId = String(context.params.recordId || '');
        const tableId = resolveTableOrThrow(collectionId);
        const record = await getRecord(context.env, tableId, recordId);
        return json({ data: record });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function onRequestPatch(context) {
    try {
        const collectionId = String(context.params.collectionId || '');
        const recordId = String(context.params.recordId || '');
        const tableId = resolveTableOrThrow(collectionId);

        const body = await context.request.json();
        const record = await updateRecord(context.env, tableId, recordId, body.data || {});
        return json({ data: record });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function onRequestDelete(context) {
    try {
        const collectionId = String(context.params.collectionId || '');
        const recordId = String(context.params.recordId || '');
        const tableId = resolveTableOrThrow(collectionId);
        const record = await deleteRecord(context.env, tableId, recordId);
        return json({ data: record });
    } catch (error) {
        return errorResponse(error);
    }
}
