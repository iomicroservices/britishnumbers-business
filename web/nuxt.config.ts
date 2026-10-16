// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const devApiOrigin = process.env.NUXT_DEV_API_ORIGIN

function rootEnv(name: string) {
  if (process.env[name]) return process.env[name]
  const file = resolve(dirname(fileURLToPath(import.meta.url)), '../.env')
  if (!existsSync(file)) return ''
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find(row => row.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).trim().replace(/^"|"$/g, '') : ''
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  fonts: {
    families: [
      { name: 'Poppins', provider: 'fontsource', weights: [400, 500, 600] }
    ]
  },

  runtimeConfig: {
    supabaseUrl: rootEnv('SUPABASE_URL'),
    supabaseAnonKey: rootEnv('SUPABASE_ANON_KEY')
  },

  vite: {
    server: {
      proxy: devApiOrigin
        ? {
            '/api': {
              target: devApiOrigin,
              changeOrigin: true,
              bypass(req) {
                const path = req.url?.split('?')[0]
                if (path === '/api/area-codes') return req.url
              }
            },
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
