import {
    assertFetchAllowed,
    buildSessionScopedFilter,
    COLLECTION_IDS,
    errorResponse,
    isSensitiveCollection,
    json,
    listRecords,
    resolveTableOrThrow,
} from '../../../_lib/airtable.js';

export async function onRequestPost(context) {
    try {
        const collectionId = String(context.params.collectionId || '');
        const tableId = resolveTableOrThrow(collectionId);

        const url = new URL(context.request.url);
        const limit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
        const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);

        let body = {};
        try {
            body = await context.request.json();
        } catch {
            body = {};
        }

        const sessionId =
            url.searchParams.get('sessionId') ||
            (typeof body.sessionId === 'string' && body.sessionId) ||
            (typeof body.variables?.sessionId === 'string' && body.variables.sessionId) ||
            '';

        assertFetchAllowed(collectionId, sessionId);

        let filterByFormula =
            (typeof body.filterByFormula === 'string' && body.filterByFormula) ||
            (typeof body.config?.filterByFormula === 'string' && body.config.filterByFormula) ||
            (typeof body.variables?.filterByFormula === 'string' && body.variables.filterByFormula) ||
            undefined;

        if (isSensitiveCollection(collectionId) && collectionId !== COLLECTION_IDS.SESSIONS) {
            // Always enforce server-side session scope; ignore client formulas for these tables.
            filterByFormula = buildSessionScopedFilter(collectionId, sessionId);
        }

        const result = await listRecords(context.env, tableId, {
            limit: Number.isFinite(limit) ? limit : 100,
            offset: Number.isFinite(offset) ? offset : 0,
            filterByFormula: filterByFormula || undefined,
        });

        return json({
            type: 'collection',
            data: result.data,
            total: result.total,
            offset: result.offset,
            error: null,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
