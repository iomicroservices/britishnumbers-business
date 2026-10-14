export default {
    editor: {
        settings: [
            {
                label: 'Configuration',
                icon: 'advanced',
                edit: () => import('./src/components/Configuration/SettingsEdit.vue'),
                summary: () => import('./src/components/Configuration/SettingsSummary.vue'),
                getIsValid(settings) {
                    return !!settings.privateData.apiKey;
                },
            },
            {
                label: 'Secured prompts',
                icon: 'auth',
                edit: () => import('./src/components/SecuredPrompts/SettingsEdit.vue'),
                summary: () => import('./src/components/SecuredPrompts/SettingsSummary.vue'),
                getIsValid(settings) {
                    return (settings.privateData.securedPrompts || []).every(item => item.title && item.content);
                },
            },
        ],
    },
    actions: [
        {
            name: 'Create chat completion',
            code: 'createChatCompletion',
            isAsync: true,
        },
        {
            name: 'Create image',
            code: 'createImage',
            isAsync: true,
        },
        {
            name: 'Create completion (Legacy)',
            code: 'createCompletion',
            isAsync: true,
        },
        // {
        //     name: 'Create edit',
        //     code: 'createEdit',
        //     isAsync: true,
        //        // },
    ],
};
