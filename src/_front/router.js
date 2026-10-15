import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';

import wwPage from './views/wwPage.vue';

import {
    initializeData,
    initializePlugins,
    initializeIntegrationInstances,
    onPageUnload,
} from '@/_common/helpers/data';
import { convertPathToRouterFormat } from '@/_common/helpers/urlParametersParsing';
import { getRuntimeEnvironment } from '@/helpers/frontEnv.js';
import { useBackAuthStore } from '@/pinia/backAuth.js';
/* wwFront:start */
import { isStaticRenderingActive } from '@/_front/rendering/staticRenderingContext';
/* wwFront:end */

/**
 * @typedef {import('vue-router').Router} Router
 * @typedef {import('vue-router').RouteRecordRaw} RouteRecordRaw
 * @typedef {import('vue-router').RouterOptions} RouterOptions
 * @typedef {import('vue-router').RouterScrollBehavior} RouterScrollBehavior
 */

/**
 * @typedef {Object} Lang
 * @property {string} lang
 * @property {boolean} [default]
 * @property {boolean} [isDefaultPath]
 */

/**
 * @typedef {Object} PageSecurity
 * @property {'authenticated' | string} [accessRule]
 * @property {string[]} [accessRoles]
 * @property {'AND' | 'OR'} [accessRolesCondition]
 */

/**
 * @typedef {Object} Page
 * @property {string} id
 * @property {Record<string, string> & { default: string }} paths
 * @property {string[]} langs
 * @property {PageSecurity} [security]
 * @property {{ userGroup: string }[]} [pageUserGroups]
 */

/**
 * @typedef {Object} DesignInfo
 * @property {string} homePageId
 * @property {Page[]} pages
 * @property {Lang[]} langs
 * @property {unknown} [auth]
 * @property {{ href?: string }} [baseTag]
 */

/** @type {Router} */
let router;
/** @type {RouteRecordRaw[]} */
const routes = [];

/** @type {RouterScrollBehavior} */
const scrollBehavior = to => {
    if (to.hash) {
        return {
            el: to.hash,
            behavior: 'smooth',
        };
    } else {
        return { top: 0 };
    }
};

 
/* wwFront:start */
import pluginsSettings from '../../plugins-settings.json';

window.wwg_designInfo = {"id":"9fb21d2f-82fd-4ea2-93ac-b7a3de357abf","homePageId":"2d7c1cdf-523b-482f-acb1-275a95ab4875","authPluginId":null,"baseTag":null,"defaultTheme":"light","langs":[{"lang":"en","default":true}],"background":{},"workflows":[],"back":{"isServerSetup":{"staging":false,"production":false}},"auth":null,"pages":[{"id":"2d7c1cdf-523b-482f-acb1-275a95ab4875","linkId":"2d7c1cdf-523b-482f-acb1-275a95ab4875","name":"Home","folder":null,"paths":{"en":"home","default":"home"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"9fcafc8f-b6c8-43b0-b8b8-d8132b7ec0fc","sectionTitle":"Nav bar","linkId":"fa3ef135-82cb-4a0c-9f11-ac4817df4e6d"},{"uid":"b5a19f9a-735a-4c90-800c-2581c86f69ad","sectionTitle":"Hero","linkId":"21621768-1e54-463b-b52b-db8e0ea8e849"},{"uid":"fc139213-b8df-4063-929d-c608d7725667","sectionTitle":"Features","linkId":"573f22b9-44ce-442d-a80a-0c11cc68a681"},{"uid":"ea7964ab-15e7-4c43-b903-a7f28a1534df","sectionTitle":"Footer","linkId":"61558744-d81e-46b5-9499-03e718fc0d6e"}],"pageUserGroups":[],"title":{"en":"Phone numbers that mean business | British Numbers"},"meta":{"desc":{"en":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},"keywords":{"en":"mobile numbers, telephone numbers, virtual numbers"},"socialDesc":{},"socialTitle":{},"structuredData":{"en":""}},"metaImage":"images/new-logo-BN_-_trans_-_3.png?_wwcv=37","security":{}},{"id":"a0e31930-eb0f-41ae-8948-2147f6f900e3","linkId":"a0e31930-eb0f-41ae-8948-2147f6f900e3","name":"Mobile Numbers","folder":null,"paths":{"en":"mobile-numbers","default":"mobile-numbers"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"9fcafc8f-b6c8-43b0-b8b8-d8132b7ec0fc","sectionTitle":"Nav bar","linkId":"fa3ef135-82cb-4a0c-9f11-ac4817df4e6d"},{"uid":"99496c2c-a80d-49f5-bc8b-09b7043063fc","sectionTitle":"Hero","linkId":"51b731de-abbd-40c9-8684-1c7c41c4cc52"},{"uid":"112186a6-035f-4470-a231-998a1b1c7134","sectionTitle":"Section","linkId":"9158a96e-d62b-48c5-8a25-2c9fc6daaa7e"},{"uid":"1d3907dc-2786-412f-b93b-5aa001683173","sectionTitle":"loadMobileNumbers","linkId":"b3b8f69f-7730-4d62-9990-2d9f61128d94"},{"uid":"044617da-4b2f-489e-84a7-742adf44429f","sectionTitle":"Review Order","linkId":"52b0a288-9008-45be-911f-f1c8c15b1d71"},{"uid":"ea7964ab-15e7-4c43-b903-a7f28a1534df","sectionTitle":"Footer","linkId":"61558744-d81e-46b5-9499-03e718fc0d6e"},{"uid":"8df1226c-581c-4942-9b49-b2e2096ad0bc","sectionTitle":"basketModal","linkId":"722c4d35-6148-465a-902f-8f7c463ae148"},{"uid":"89bd13be-cc20-4b35-af5f-b14d83e312e7","sectionTitle":"companiesModal","linkId":"bf885424-abd1-4fc2-abc0-ddf3a00294a8"}],"pageUserGroups":[],"title":{"en":"The Largest Database of Gold Mobile Numbers for Sale"},"meta":{"desc":{"en":"Discover the largest database of premium gold mobile numbers for sale. Elevate your personal or business identity with exclusive, easy-to-remember mobile numbers"},"keywords":{"en":"gold numbers, vip numbers,buy mobile numbers"},"socialDesc":{"en":"Discover the largest database of premium gold mobile numbers for sale. Elevate your personal or business identity with exclusive, easy-to-remember mobile numbers"},"socialTitle":{"en":"The Largest Database of Gold Mobile Numbers for Sale"},"structuredData":{}},"metaImage":"images/new-logo-BN_-_trans_-_3.png?_wwcv=37","security":{}},{"id":"670dd0cf-cea5-4988-9534-fff817ddf4d1","linkId":"670dd0cf-cea5-4988-9534-fff817ddf4d1","name":"Special Numbers","folder":null,"paths":{"en":"special-numbers","default":"special-numbers"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"89bd13be-cc20-4b35-af5f-b14d83e312e7","sectionTitle":"companiesModal","linkId":"89bd13be-cc20-4b35-af5f-b14d83e312e7"},{"uid":"9fcafc8f-b6c8-43b0-b8b8-d8132b7ec0fc","sectionTitle":"Nav bar","linkId":"fa3ef135-82cb-4a0c-9f11-ac4817df4e6d"},{"uid":"fa414a09-337b-4c39-934e-c1aa6cbdf495","sectionTitle":"Hero","linkId":"8d69ff07-6552-408c-9545-c2fc6ba385df"},{"uid":"b585174a-cda4-4418-b122-9c028e3456ae","sectionTitle":"Section","linkId":"036bddd4-5b58-463f-a08a-2f1cf1634ca4"},{"uid":"bbad4331-fbc4-4b86-abe5-8a433f90438c","sectionTitle":"loadMobileNumbers","linkId":"1cde698f-78d3-423c-925c-ab4a1bd5f8ff"},{"uid":"be50b88c-6758-47c6-b530-f3ebf061bc0f","sectionTitle":"Review Order","linkId":"7df6f567-5e83-401d-9839-ce919542d907"},{"uid":"ea7964ab-15e7-4c43-b903-a7f28a1534df","sectionTitle":"Footer","linkId":"61558744-d81e-46b5-9499-03e718fc0d6e"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":"","security":{}},{"id":"86944a75-4bb4-4de6-a0a3-f910d6ef56ac","linkId":"86944a75-4bb4-4de6-a0a3-f910d6ef56ac","name":"Telephone Numbers","folder":null,"paths":{"en":"telephone-numbers","default":"telephone-numbers"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"9fcafc8f-b6c8-43b0-b8b8-d8132b7ec0fc","sectionTitle":"Nav bar","linkId":"fa3ef135-82cb-4a0c-9f11-ac4817df4e6d"},{"uid":"edb30a37-625e-4fce-9a53-a7e5c8050523","sectionTitle":"Hero","linkId":"eeb4006a-a2de-436a-af65-4c97c4c7d7c2"},{"uid":"3c4dc090-4f93-43d4-9328-fbbaabb131d7","sectionTitle":"Number Type","linkId":"6539b507-86f6-46e0-a0ec-dbd6e3a10a24"},{"uid":"5f3f5ec8-d2ad-4fef-9f8c-539ee181bb0f","sectionTitle":"Pricing","linkId":"ef25c2c8-f924-4760-bff7-f7e30be8d859"},{"uid":"08512593-1f0b-4ad7-8bed-cb90637e639d","sectionTitle":"Phone Numbers","linkId":"b6899e1d-1abe-4f42-a609-a9e1879472c1"},{"uid":"8e2bb540-f3ec-4e5b-b14a-ff216be85321","sectionTitle":"Review Order","linkId":"4778a1b9-fa00-43ad-a95e-24f612f40889"},{"uid":"ea7964ab-15e7-4c43-b903-a7f28a1534df","sectionTitle":"Footer","linkId":"61558744-d81e-46b5-9499-03e718fc0d6e"},{"uid":"220c9000-2fe5-4f9e-ad63-2ef2471a8fe7","sectionTitle":"companiesModal","linkId":"78354eca-89e4-4893-9080-e5468f566e90"},{"uid":"031d0ecc-4323-4347-ba4c-46a6cf4e6a00","sectionTitle":"loadNumbeers","linkId":"90d67a37-d882-40a5-a952-db591a64f138"},{"uid":"875fea3e-9a4d-40d2-a9f3-b36116a912f4","sectionTitle":"basketModal","linkId":"f46be0ce-df7f-4339-9666-519b01c94bdc"}],"pageUserGroups":[],"title":{"en":"Give Your Business Superpowers with a Virtual Telephone Number | British Numbers","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{"en":"Elevate your business with a virtual telephone number from British Numbers. Streamline communication, expand your reach, and empower your brand with our versatile solutions."},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":"images/new-logo-BN_-_trans_-_3.png?_wwcv=37","security":{}},{"id":"b36ef4ad-624d-4523-95ef-65f486bb574e","linkId":"b36ef4ad-624d-4523-95ef-65f486bb574e","name":"Checkout","folder":null,"paths":{"en":"checkout","default":"checkout"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"9fcafc8f-b6c8-43b0-b8b8-d8132b7ec0fc","sectionTitle":"Nav bar","linkId":"fa3ef135-82cb-4a0c-9f11-ac4817df4e6d"},{"uid":"59dca0a2-746c-4575-9635-9240aa9f76c1","sectionTitle":"Checkout","linkId":"6a3e48bd-ecda-48c9-9256-1f79e84a666f"},{"uid":"ea7964ab-15e7-4c43-b903-a7f28a1534df","sectionTitle":"Footer","linkId":"61558744-d81e-46b5-9499-03e718fc0d6e"}],"pageUserGroups":[],"title":{"en":"Checkout completed successfully | British Numbers"},"meta":{"desc":{"en":"Please check your email for further information."},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":"images/new-logo-BN_-_trans_-_3.png?_wwcv=37","security":{}}],"plugins":[{"id":"f9ef41c3-1c53-4857-855b-f2f6a40b7186","name":"Supabase","namespace":"supabase"},{"id":"29809245-a5ea-4687-af79-952998abab22","name":"Airtable","namespace":"airtable"},{"id":"2bd1c688-31c5-443e-ae25-59aa5b6431fb","name":"REST API","namespace":"restApi"}]};
window.wwg_cacheVersion = 37;
window.wwg_pluginsSettings = pluginsSettings;
window.wwg_disableManifest = false;

/** @type {Lang} */
const defaultLang = window.wwg_designInfo.langs.find(({ default: isDefault }) => isDefault) || {
    lang: 'en',
    default: true,
};
const isServerRendering = import.meta.env.SSR;

/**
 * @param {Page} page
 * @param {Lang} lang
 * @param {string} [forcedPath]
 */
const registerRoute = (page, lang, forcedPath) => {
    const langSlug = !lang.default || lang.isDefaultPath ? `/${lang.lang}` : '';
    let path =
        forcedPath ||
        (page.id === window.wwg_designInfo.homePageId ? '/' : `/${page.paths[lang.lang] || page.paths.default}`);

    path = convertPathToRouterFormat(path);

    routes.push({
        path: langSlug + path,
        component: wwPage,
        name: `page-${page.id}-${lang.lang}`,
        meta: {
            pageId: page.id,
            lang,
            isPrivate: !!page.pageUserGroups?.length,
        },
        async beforeEnter(to, from) {
            if (to.name === from.name) return;
            //Set page lang
            wwLib.wwLang.defaultLang = defaultLang.lang;
            wwLib.$store.dispatch('front/setLang', lang.lang);

            if (!isStaticRenderingActive()) {
                const canContinue = await initializePageRuntime(page, to);
                if (!canContinue) return null;
            }

            try {
                const { default: registerPageComponents } = await import(`@/pages/${page.id.split('_')[0]}.js`);
                await registerPageComponents(window.vm);
                await wwLib.wwWebsiteData.fetchPage(page.id);

                //Scroll to section or on top after page change
                if (isStaticRenderingActive()) {
                    return;
                } else if (to.hash) {
                    const targetElement = document.getElementById(to.hash.replace('#', ''));
                    if (targetElement) targetElement.scrollIntoView();
                } else {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                }

                return;
            } catch (err) {
                wwLib.$store.dispatch('front/showPageLoadProgress', false);
                if (isStaticRenderingActive()) throw err;

                if (err.redirectUrl) {
                    return { path: err.redirectUrl || '404' };
                } else {
                    //Any other error: go to target page using window.location
                    window.location = to.fullPath;
                }
            }
        },
    });
};

for (const page of window.wwg_designInfo.pages) {
    for (const lang of window.wwg_designInfo.langs) {
        if (!page.langs.includes(lang.lang)) continue;
        registerRoute(page, lang);
    }
}

const page404 = window.wwg_designInfo.pages.find(page => page.paths.default === '404');
if (page404) {
    for (const lang of window.wwg_designInfo.langs) {
        // Create routes /:lang/:pathMatch(.*)* etc for all langs of the 404 page
        if (!page404.langs.includes(lang.lang)) continue;
        registerRoute(
            page404,
            {
                default: false,
                lang: lang.lang,
            },
            '/:pathMatch(.*)*'
        );
    }
    // Create route /:pathMatch(.*)* using default project lang
    registerRoute(page404, { default: true, isDefaultPath: false, lang: defaultLang.lang }, '/:pathMatch(.*)*');
} else {
    routes.push({
        path: '/:pathMatch(.*)*',
        redirect: null,
        async beforeEnter() {
            window.location.href = '/404';
        },
    });
}

const isProd = getRuntimeEnvironment() === 'production';

async function initializePageRuntime(page, route) {
    const backAuthStore = useBackAuthStore(wwLib.$pinia);
    if (!wwLib.wwAuth.plugin && !backAuthStore.projectAuth && window.wwg_designInfo.auth) {
        backAuthStore.setProjectAuth(window.wwg_designInfo.auth);
    }

    await initializePlugins();
    await initializeIntegrationInstances();

    if (!wwLib.wwAuth.plugin) {
        await backAuthStore.refresh();
        const projectAuth = backAuthStore.projectAuth || {};

        if (page.security?.accessRule !== 'authenticated') return true;
        if (!backAuthStore.isAuthenticated) {
            window.location.href = `${wwLib.wwPageHelper.getPagePath(
                projectAuth.unauthenticatedPageId
            )}?_source=${route.path}`;
            return false;
        }
        if (!page.security.accessRoles?.length) return true;

        const hasAccess =
            page.security.accessRolesCondition === 'AND'
                ? backAuthStore.matchAllRoles(page.security.accessRoles)
                : backAuthStore.matchAnyRoles(page.security.accessRoles);
        if (hasAccess) return true;

        window.location.href = `${wwLib.wwPageHelper.getPagePath(
            projectAuth.unauthorizedPageId
        )}?_source=${route.path}`;
        return false;
    }

    if (!page.pageUserGroups?.length) return true;
    await wwLib.wwAuth.init();

    if (!wwLib.wwAuth.getIsAuthenticated()) {
        window.location.href = `${wwLib.wwPageHelper.getPagePath(
            wwLib.wwAuth.getUnauthenticatedPageId()
        )}?_source=${route.path}`;
        return false;
    }

    if (
        page.pageUserGroups.length > 1 &&
        !wwLib.wwAuth.matchUserGroups(page.pageUserGroups.map(({ userGroup }) => userGroup))
    ) {
        window.location.href = `${wwLib.wwPageHelper.getPagePath(
            wwLib.wwAuth.getUnauthorizedPageId()
        )}?_source=${route.path}`;
        return false;
    }

    return true;
}

/**
 * Initializes the current route's traditional runtime dependencies after Vue has
 * hydrated the static projection. Static rendering remains active until this resolves,
 * so client islands and dynamic bindings cannot run against a partial runtime.
 */
export async function initializeCurrentRouteRuntime() {
    const route = router.currentRoute.value;
    const page = window.wwg_designInfo.pages.find(candidate => candidate.id === route.meta.pageId);
    if (!page) throw new Error(`Unable to initialize runtime for route ${route.fullPath}: page is unavailable.`);

    const canContinue = await initializePageRuntime(page, route);
    if (!canContinue) return { status: 'redirected' };
    return { status: 'ready', route };
}

/**
 * Starts the data phase without delaying the mounted lifecycle, matching normal
 * navigation where collections and workflows may initialize after the first render.
 */
export function startCurrentRouteDataInitialization(route) {
    return initializeData(route);
}

function createFrontHistory(serverRendering) {
    if (serverRendering) return createMemoryHistory();

    if (isProd && window.wwg_designInfo.baseTag?.href) {
        let baseTag = window.wwg_designInfo.baseTag.href;
        if (!baseTag.startsWith('/')) {
            baseTag = '/' + baseTag;
        }
        if (!baseTag.endsWith('/')) {
            baseTag += '/';
        }
        return createWebHistory(baseTag);
    }

    return createWebHistory();
}

export function createFrontRouter({ serverRendering = false } = {}) {
    const frontRouter = createRouter({
        history: createFrontHistory(serverRendering),
        routes,
        scrollBehavior,
    });

    //Trigger on page unload
    let isFirstNavigation = true;
    frontRouter.beforeEach(async (to, from) => {
        if (to.name === from.name) return;
        if (!isFirstNavigation && !serverRendering) await onPageUnload();
        isFirstNavigation = false;
        wwLib.globalVariables._navigationId++;
        return;
    });

    //Init page
    frontRouter.afterEach((to, from, failure) => {
        wwLib.$store.dispatch('front/showPageLoadProgress', false);
        let fromPath = from.path;
        let toPath = to.path;
        if (!fromPath.endsWith('/')) fromPath = fromPath + '/';
        if (!toPath.endsWith('/')) toPath = toPath + '/';
        if (failure || (from.name && toPath === fromPath) || serverRendering || isStaticRenderingActive()) return;
        void initializeData(to);
    });

    return frontRouter;
}

router = createFrontRouter({ serverRendering: isServerRendering });
/* wwFront:end */

export default router;
