const SESSIONS_COLLECTION_ID = 'dd07e718-03fb-46e0-b759-042f6654659a';
const SESSION_VAR_MOBILE = '28912e29-cc22-4f99-94f5-e24dad1659c3';
const SESSION_VAR_LANDLINE = '25bbbb04-dd94-47eb-b380-9c6d9c48e717';

function getExistingSessionId(data) {
    const type = data?.type;
    const variableId = type === 'landline' ? SESSION_VAR_LANDLINE : SESSION_VAR_MOBILE;
    const value = wwLib.wwVariable.getValue(variableId);
    return typeof value === 'string' && value.startsWith('rec') ? value : '';
}

export default {
    /*=============================================m_ÔÔ_m=============================================\
        Collection API
    \================================================================================================*/
    /*=============================================m_ÔÔ_m=============================================\
        Airtable API
    \================================================================================================*/
    async createRecord({ collectionId, data }, wwUtils) {
        let response = null;
        wwUtils?.log('info', `Creating a record for _wwCollection(${collectionId})`, {
            preview: data,
            type: 'request',
        });

        /* wwFront:start */
        if (collectionId === SESSIONS_COLLECTION_ID) {
            response = await axios.post(`${window.location.origin}/ww/session/ensure`, {
                sessionId: getExistingSessionId(data),
                type: data?.type || 'mobile',
                is_auth: !!data?.is_auth,
            });
        } else {
            response = await axios.post(
                `${window.location.origin}/ww/cms_data_sets/${collectionId}/airtable/record`,
                { data }
            );
        }
        /* wwFront:end */

        const record = response.data.data;
        const collection = wwLib.$store.getters['data/getCollections'][collectionId];
        if (!collection) return null;
        const collectionData = Array.isArray(collection.data) ? [...collection.data] : [];
        const existingIndex = collectionData.findIndex(item => item && item.id === record.id);
        if (existingIndex === -1) {
            wwLib.$store.dispatch('data/setCollection', {
                ...collection,
                total: (collection.total || 0) + 1,
                data: [...collectionData, record],
            });
        } else {
            collectionData.splice(existingIndex, 1, record);
            wwLib.$store.dispatch('data/setCollection', {
                ...collection,
                data: collectionData,
            });
        }

        return record;
    },
    async updateRecord({ collectionId, recordId, data }, wwUtils) {
        let response = null;
        wwUtils?.log('info', `Updating record ${recordId} for _wwCollection(${collectionId})`, {
            preview: data,
            type: 'request',
        });
        /* wwFront:start */
        response = await axios.patch(
            `${window.location.origin}/ww/cms_data_sets/${collectionId}/airtable/record/${recordId}`,
            { data }
        );
        /* wwFront:end */

        const record = response.data.data;
        const collection = _.cloneDeep(wwLib.$store.getters['data/getCollections'][collectionId]);
        if (!collection) return null;
        const collectionData = Array.isArray(collection.data) ? collection.data : [];
        const recordIndex = collectionData.findIndex(item => item && item.id === recordId);
        collectionData.splice(recordIndex, 1, record);
        wwLib.$store.dispatch('data/setCollection', { ...collection, data: collectionData });

        return record;
    },
    async deleteRecord({ collectionId, recordId }, wwUtils) {
        if (!recordId) {
            throw new Error(`Missing Airtable recordId for collection ${collectionId}`);
        }

        let response = null;
        wwUtils?.log('info', `Deleting record ${recordId} for _wwCollection(${collectionId})`, { type: 'request' });
        /* wwFront:start */
        response = await axios.delete(
            `${window.location.origin}/ww/cms_data_sets/${collectionId}/airtable/record/${recordId}`
        );
        /* wwFront:end */

        const record = response.data.data;
        const collection = _.cloneDeep(wwLib.$store.getters['data/getCollections'][collectionId]);
        if (!collection) return null;
        const collectionData = Array.isArray(collection.data) ? collection.data : [];
        const recordIndex = collectionData.findIndex(item => item && item.id === recordId);
        collectionData.splice(recordIndex, 1);
        wwLib.$store.dispatch('data/setCollection', {
            ...collection,
            total: collection.total - 1,
            data: collectionData,
        });

        return record;
    },
    async syncRecord({ collectionId, recordId }, wwUtils) {
        wwUtils?.log('info', `Syncing record ${recordId} for _wwCollection(${collectionId})`, { type: 'request' });
        const response = await axios.get(
            `${window.location.origin}/ww/cms_data_sets/${collectionId}/airtable/record/${recordId}`
        );
        const record = response.data.data;

        const collection = _.cloneDeep(wwLib.$store.getters['data/getCollections'][collectionId]);
        if (!collection) return null;
        const collectionData = Array.isArray(collection.data) ? collection.data : [];
        const recordIndex = collectionData.findIndex(item => item && item.id === recordId);
        if (recordIndex === -1) {
            collectionData.push(record);
            wwLib.$store.dispatch('data/setCollection', {
                ...collection,
                total: collection.total + 1,
                data: collectionData,
            });
        } else {
            collectionData.splice(recordIndex, 1, record);
            wwLib.$store.dispatch('data/setCollection', { ...collection, data: collectionData });
        }

        return record;
    },
};
