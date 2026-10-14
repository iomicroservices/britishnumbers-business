import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import wewebCssLayerPlugin from './weweb-postcss-layer-plugin.cjs';
import path from 'path';
import fs from 'fs';
import { parseEnv } from 'node:util';
import handlebars from 'handlebars';
import { createSsrPageComponentLoadersPlugin } from './vitePlugins/ssrPageComponentLoaders.ts';

const pages = {"2d7c1cdf-523b-482f-acb1-275a95ab4875-en":{"outputDir":"./","lang":"en","title":"Phone numbers that mean business | British Numbers","cacheVersion":"37","meta":[{"name":"title","content":"Phone numbers that mean business | British Numbers"},{"name":"description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"name":"keywords","content":"mobile numbers, telephone numbers, virtual numbers"},{"name":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"itemprop":"name","content":"Phone numbers that mean business | British Numbers"},{"itemprop":"description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"itemprop":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"name":"twitter:card","content":"summary"},{"name":"twitter:title","content":"Phone numbers that mean business | British Numbers"},{"name":"twitter:description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"name":"twitter:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:title","content":"Phone numbers that mean business | British Numbers"},{"property":"og:description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"property":"og:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:site_name","content":"Phone numbers that mean business | British Numbers"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://business.britishnumbers.com/"},{"rel":"alternate","hreflang":"en","href":"https://business.britishnumbers.com/"}]},"a0e31930-eb0f-41ae-8948-2147f6f900e3-en":{"outputDir":"./mobile-numbers","lang":"en","title":"The Largest Database of Gold Mobile Numbers for Sale","cacheVersion":"37","meta":[{"name":"title","content":"The Largest Database of Gold Mobile Numbers for Sale"},{"name":"description","content":"Discover the largest database of premium gold mobile numbers for sale. Elevate your personal or business identity with exclusive, easy-to-remember mobile numbers"},{"name":"keywords","content":"gold numbers, vip numbers,buy mobile numbers"},{"name":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"itemprop":"name","content":"The Largest Database of Gold Mobile Numbers for Sale"},{"itemprop":"description","content":"Discover the largest database of premium gold mobile numbers for sale. Elevate your personal or business identity with exclusive, easy-to-remember mobile numbers"},{"itemprop":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"name":"twitter:card","content":"summary"},{"name":"twitter:title","content":"The Largest Database of Gold Mobile Numbers for Sale"},{"name":"twitter:description","content":"Discover the largest database of premium gold mobile numbers for sale. Elevate your personal or business identity with exclusive, easy-to-remember mobile numbers"},{"name":"twitter:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:title","content":"The Largest Database of Gold Mobile Numbers for Sale"},{"property":"og:description","content":"Discover the largest database of premium gold mobile numbers for sale. Elevate your personal or business identity with exclusive, easy-to-remember mobile numbers"},{"property":"og:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:site_name","content":"Phone numbers that mean business | British Numbers"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://business.britishnumbers.com/mobile-numbers/"},{"rel":"alternate","hreflang":"en","href":"https://business.britishnumbers.com/mobile-numbers/"}]},"670dd0cf-cea5-4988-9534-fff817ddf4d1-en":{"outputDir":"./special-numbers","lang":"en","title":"Phone numbers that mean business | British Numbers","cacheVersion":"37","meta":[{"name":"title","content":"Phone numbers that mean business | British Numbers"},{"name":"description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"name":"keywords","content":"mobile numbers, telephone numbers, virtual numbers"},{"name":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"itemprop":"name","content":"Phone numbers that mean business | British Numbers"},{"itemprop":"description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"itemprop":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"name":"twitter:card","content":"summary"},{"name":"twitter:title","content":"Phone numbers that mean business | British Numbers"},{"name":"twitter:description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"name":"twitter:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:title","content":"Phone numbers that mean business | British Numbers"},{"property":"og:description","content":"Boost your business identity with British Numbers. Explore our selection of premium mobile numbers, telephone numbers, and virtual numbers, tailored for professionals seeking a distinctive edge."},{"property":"og:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:site_name","content":"Phone numbers that mean business | British Numbers"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://business.britishnumbers.com/special-numbers/"},{"rel":"alternate","hreflang":"en","href":"https://business.britishnumbers.com/special-numbers/"}]},"86944a75-4bb4-4de6-a0a3-f910d6ef56ac-en":{"outputDir":"./telephone-numbers","lang":"en","title":"Give Your Business Superpowers with a Virtual Telephone Number | British Numbers","cacheVersion":"37","meta":[{"name":"title","content":"Give Your Business Superpowers with a Virtual Telephone Number | British Numbers"},{"name":"description","content":"Elevate your business with a virtual telephone number from British Numbers. Streamline communication, expand your reach, and empower your brand with our versatile solutions."},{"name":"keywords","content":"mobile numbers, telephone numbers, virtual numbers"},{"name":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"itemprop":"name","content":"Give Your Business Superpowers with a Virtual Telephone Number | British Numbers"},{"itemprop":"description","content":"Elevate your business with a virtual telephone number from British Numbers. Streamline communication, expand your reach, and empower your brand with our versatile solutions."},{"itemprop":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"name":"twitter:card","content":"summary"},{"name":"twitter:title","content":"Give Your Business Superpowers with a Virtual Telephone Number | British Numbers"},{"name":"twitter:description","content":"Elevate your business with a virtual telephone number from British Numbers. Streamline communication, expand your reach, and empower your brand with our versatile solutions."},{"name":"twitter:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:title","content":"Give Your Business Superpowers with a Virtual Telephone Number | British Numbers"},{"property":"og:description","content":"Elevate your business with a virtual telephone number from British Numbers. Streamline communication, expand your reach, and empower your brand with our versatile solutions."},{"property":"og:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:site_name","content":"Phone numbers that mean business | British Numbers"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://business.britishnumbers.com/telephone-numbers/"},{"rel":"alternate","hreflang":"en","href":"https://business.britishnumbers.com/telephone-numbers/"}]},"b36ef4ad-624d-4523-95ef-65f486bb574e-en":{"outputDir":"./checkout","lang":"en","title":"Checkout completed successfully | British Numbers","cacheVersion":"37","meta":[{"name":"title","content":"Checkout completed successfully | British Numbers"},{"name":"description","content":"Please check your email for further information."},{"name":"keywords","content":"mobile numbers, telephone numbers, virtual numbers"},{"name":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"itemprop":"name","content":"Checkout completed successfully | British Numbers"},{"itemprop":"description","content":"Please check your email for further information."},{"itemprop":"image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"name":"twitter:card","content":"summary"},{"name":"twitter:title","content":"Checkout completed successfully | British Numbers"},{"name":"twitter:description","content":"Please check your email for further information."},{"name":"twitter:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:title","content":"Checkout completed successfully | British Numbers"},{"property":"og:description","content":"Please check your email for further information."},{"property":"og:image","content":"/images/new-logo-BN_-_trans_-_3.png?_wwcv=37"},{"property":"og:site_name","content":"Phone numbers that mean business | British Numbers"},{"property":"og:type","content":"website"},{"name":"robots","content":"noindex, nofollow"}],"scripts":{"head":"\n","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://business.britishnumbers.com/checkout/"},{"rel":"alternate","hreflang":"en","href":"https://business.britishnumbers.com/checkout/"}]}};

function generatePageHtmlFiles() {
    const template = fs.readFileSync(path.resolve(__dirname, 'template.html'), 'utf-8');
    const compiledTemplate = handlebars.compile(template);

    for (const pageConfig of Object.values(pages)) {
        const html = compiledTemplate({
            title: pageConfig.title,
            lang: pageConfig.lang,
            meta: pageConfig.meta,
            structuredData: pageConfig.structuredData || null,
            scripts: {
                head: pageConfig.scripts.head,
                body: pageConfig.scripts.body,
            },
            alternateLinks: pageConfig.alternateLinks,
            cacheVersion: pageConfig.cacheVersion,
            baseTag: pageConfig.baseTag,
            encodedAssetBase: encodeURIComponent("/"),
        });

        if (!fs.existsSync(pageConfig.outputDir)) {
            fs.mkdirSync(pageConfig.outputDir, { recursive: true });
        }
        fs.writeFileSync(`${pageConfig.outputDir}/index.html`, html);
    }
}

const clientInputs = {};
for (const pageName in pages) {
    clientInputs[pageName] = path.resolve(__dirname, pages[pageName].outputDir, 'index.html');
}

function getFrontEnvironmentValues(root, mode) {
    const filePath = path.resolve(root, `.env.${mode}`);
    if (!fs.existsSync(filePath)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(parseEnv(fs.readFileSync(filePath, 'utf8'))).filter(([key]) => !key.startsWith('VITE_'))
    );
}

const onwarn = (entry, next) => {
    if (entry.loc?.file && /js$/.test(entry.loc.file) && /Use of eval in/.test(entry.message)) return;
    if (/Use of direct `eval`/.test(entry.message)) return;
    return next(entry);
};

export default defineConfig(({ mode, isSsrBuild }) => {
    if (!isSsrBuild) {
        generatePageHtmlFiles();
    }

    const build = {
        chunkSizeWarningLimit: 10000,
        ...(!isSsrBuild ? { manifest: '.ww-client-manifest.json' } : {}),
        rolldownOptions: {
            ...(!isSsrBuild ? { input: clientInputs } : {}),
            onwarn,
        },
    };

    if (isSsrBuild) {
        build.outDir = 'dist-ssr';
    }

    return {
        plugins: [createSsrPageComponentLoadersPlugin(), vue()],
        base: "/",
        define: {
            global: 'globalThis',
            __VUE_PROD_DEVTOOLS__: mode === 'development',
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__:
                mode === 'development' || !!process.env.WW_BACK_URL?.includes('weweb-preprod.io'),
            __WW_FRONT_ENV_VARIABLES__: JSON.stringify({
                staging: getFrontEnvironmentValues(__dirname, 'staging'),
                production: getFrontEnvironmentValues(__dirname, 'production'),
            }),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                },
            },
            postcss: {
                plugins: [wewebCssLayerPlugin({ include: [/[/\\]src[/\\]extensions[/\\]/, /[/\\]node_modules[/\\]/] }), autoprefixer],
            },
        },
        ssr: {
            noExternal: true,
        },
        server: {
            port: 8080,
        },
        build,
    };
});
