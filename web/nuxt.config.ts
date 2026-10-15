// https://nuxt.com/docs/api/configuration/nuxt-config
const devApiOrigin = process.env.NUXT_DEV_API_ORIGIN

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  vite: {
    server: {
      proxy: devApiOrigin
        ? {
            '/api': { target: devApiOrigin, changeOrigin: true },
            '/ww': { target: devApiOrigin, changeOrigin: true }
          }
        : undefined
    }
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'bn-color-mode'
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
