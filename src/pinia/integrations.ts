import { defineStore } from 'pinia';
import { ref, shallowReactive } from 'vue';

/** Kept empty — WeWeb connection integrations are unused in this self-hosted app. */
export const NATIVE_INTEGRATIONS: string[] = [];
export const CODE_EXPOSED_INTEGRATIONS: string[] = [];

type Connection = { id: string; name: string; integration: string; config: unknown };

export const useIntegrationsStore = defineStore('integrations', () => {
    const installed = ref<string[]>([...NATIVE_INTEGRATIONS]);
    const connections = ref<Record<string, Connection>>({});
    const instances = shallowReactive<Record<string, unknown>>({});

    async function initializeConnectionInstance(_connectionId: string) {
        // no-op: no integration packages registered
    }

    async function initializeInstances() {
        // no-op
    }

    function getCodeBindings() {
        return {};
    }

    function getCodeExposedConnections() {
        return [] as Connection[];
    }

    return {
        installed,
        connections,
        getInstance(id: string) {
            return instances[id] || null;
        },
        getCodeBindings,
        getCodeExposedConnections,
        getConnection(connectionId: string, _env: string | null = null) {
            if (!connectionId) return null;
            return connections.value[connectionId] || null;
        },
        initializeInstances,
        initializeConnectionInstance,
        addIntegration(integration: string) {
            if (!integration) return;
            if (!installed.value.includes(integration)) {
                installed.value.push(integration);
            }
        },
        removeIntegration(integration: string) {
            const index = installed.value.indexOf(integration);
            if (index !== -1) {
                installed.value.splice(index, 1);
            }
            if (instances[integration]) {
                delete instances[integration];
            }
        },
        addConnection(connection: Connection) {
            if (!connection?.id) return;
            connections.value[connection.id] = connection;
        },
    };
});
