import assert from 'node:assert/strict';
import {
    COLLECTION_TABLE_MAP,
    flattenRecord,
    getTableId,
    toAirtableFields,
} from './airtable.js';

assert.equal(getTableId('dd07e718-03fb-46e0-b759-042f6654659a'), 'tblht0arUwtWyILb6');
assert.equal(getTableId('454772e5-f61a-421e-854c-0ef92be1df3e'), 'tblSGYkDGW7RT8AtP');
assert.equal(getTableId('missing'), null);
assert.equal(Object.keys(COLLECTION_TABLE_MAP).length, 4);

assert.deepEqual(flattenRecord({ id: 'rec1', fields: { type: 'mobile', is_auth: false } }), {
    id: 'rec1',
    type: 'mobile',
    is_auth: false,
});

assert.deepEqual(toAirtableFields({ id: 'rec1', createdTime: 'x', type: 'mobile' }), {
    type: 'mobile',
});

console.log('airtable lib checks passed');
