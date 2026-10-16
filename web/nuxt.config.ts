// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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

  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'bn-color-mode'
  },

  runtimeConfig: {
    airtableToken: rootEnv('AIRTABLE_TOKEN'),
    sessionTtlDays: rootEnv('SESSION_TTL_DAYS') || '7',
    companiesHouseApiKey: rootEnv('COMPANIES_HOUSE_API_KEY'),
    makeCheckoutWebhookUrl: rootEnv('MAKE_CHECKOUT_WEBHOOK_URL'),
    tamarApiKey: rootEnv('TAMAR_API_KEY'),
    supabaseUrl: rootEnv('SUPABASE_URL'),
    supabaseAnonKey: rootEnv('SUPABASE_ANON_KEY'),
    britishNumbersApiKey: rootEnv('BRITISH_NUMBERS_API_KEY')
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      { name: 'Poppins', provider: 'fontsource', weights: [400, 500, 600] }
    ]
  }
})
