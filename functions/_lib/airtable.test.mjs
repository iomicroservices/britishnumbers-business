import assert from 'node:assert/strict';
import {
    COLLECTION_IDS,
    COLLECTION_TABLE_MAP,
    assertCreatePayloadAllowed,
    assertFetchAllowed,
    buildSessionScopedFilter,
    flattenRecord,
    getTableId,
    isExpired,
    toAirtableFields,
    AirtableProxyError,
} from './airtable.js';

assert.equal(getTableId(COLLECTION_IDS.SESSIONS), 'tblht0arUwtWyILb6');
assert.equal(Object.keys(COLLECTION_TABLE_MAP).length, 4);

assert.deepEqual(flattenRecord({ id: 'rec1', createdTime: '2020-01-01T00:00:00.000Z', fields: { type: 'mobile' } }), {
    id: 'rec1',
    createdTime: '2020-01-01T00:00:00.000Z',
    type: 'mobile',
});

assert.deepEqual(toAirtableFields({ id: 'rec1', createdTime: 'x', type: 'mobile' }), {
    type: 'mobile',
});

assert.equal(
    buildSessionScopedFilter(COLLECTION_IDS.BASKET_ITEMS, 'recABC'),
    "FIND('recABC', ARRAYJOIN({session_id}))"
);
assert.equal(buildSessionScopedFilter(COLLECTION_IDS.LEADS, 'recABC'), "FIND('recABC', ARRAYJOIN({session}))");

assert.throws(() => assertFetchAllowed(COLLECTION_IDS.SESSIONS, 'recABC'), AirtableProxyError);
assert.throws(() => assertFetchAllowed(COLLECTION_IDS.BASKET_ITEMS, ''), AirtableProxyError);
assert.doesNotThrow(() => assertFetchAllowed(COLLECTION_IDS.BASKET_ITEMS, 'recABC'));

assert.throws(() => assertCreatePayloadAllowed(COLLECTION_IDS.SESSIONS, { type: 'mobile' }), AirtableProxyError);
assert.throws(() => assertCreatePayloadAllowed(COLLECTION_IDS.BASKET_ITEMS, { number: '07' }), AirtableProxyError);
assert.doesNotThrow(() =>
    assertCreatePayloadAllowed(COLLECTION_IDS.BASKET_ITEMS, { number: '07', session_id: ['recABC'] })
);

assert.equal(isExpired('2000-01-01T00:00:00.000Z', { SESSION_TTL_DAYS: '7' }), true);
assert.equal(isExpired(new Date().toISOString(), { SESSION_TTL_DAYS: '7' }), false);

console.log('airtable lib checks passed');
