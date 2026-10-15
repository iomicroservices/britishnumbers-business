import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useIntegrationsStore } from './integrations';

describe('useIntegrationsStore (stub)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts with no native integrations or connections', () => {
        const store = useIntegrationsStore();
        expect(store.installed).toEqual([]);
        expect(store.connections).toEqual({});
        expect(store.getCodeBindings()).toEqual({});
        expect(store.getCodeExposedConnections()).toEqual([]);
        expect(store.getInstance('any')).toBeNull();
        expect(store.getConnection('any')).toBeNull();
    });

    it('initializeInstances is a no-op', async () => {
        const store = useIntegrationsStore();
        await expect(store.initializeInstances()).resolves.toBeUndefined();
        await expect(store.initializeConnectionInstance('x')).resolves.toBeUndefined();
    });
});
