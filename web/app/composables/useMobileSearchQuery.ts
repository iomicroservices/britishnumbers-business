import type { LocationQuery } from 'vue-router'

export type MobileSearchMode = 'number' | 'multi' | 'prefix' | 'last_six'

export interface MobileSearchParams {
  q: string
  mode: MobileSearchMode
  min?: number
  max?: number
}

const MODES = new Set<MobileSearchMode>(['number', 'multi', 'prefix', 'last_six'])

function one(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

function parsePrice(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

export function readMobileSearch(query: LocationQuery): MobileSearchParams {
  const modeRaw = one(query.mode)
  const mode = MODES.has(modeRaw as MobileSearchMode) ? modeRaw as MobileSearchMode : 'number'
  const q = one(query.q).replace(/[^A-Za-z0-9,]/g, '') || '07'
  return {
    q,
    mode,
    min: parsePrice(one(query.min)),
    max: parsePrice(one(query.max))
  }
}

export function mobileSearchQuery(params: MobileSearchParams) {
  const query: Record<string, string> = {}
  const custom = params.mode !== 'number' || params.min != null || params.max != null || params.q !== '07'
  if (!custom) return query
  if (params.q) query.q = params.q
  if (params.mode !== 'number') query.mode = params.mode
  if (params.min != null) query.min = String(params.min)
  if (params.max != null) query.max = String(params.max)
  return query
}

export function sameMobileSearch(left: Record<string, string>, right: Record<string, string>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (left[key] !== right[key]) return false
  }
  return true
}

export function useMobileSearchQuery() {
  const route = useRoute()

  const preserved = computed(() => {
    if (!route.path.startsWith('/mobile-numbers')) return {}
    return mobileSearchQuery(readMobileSearch(route.query))
  })

  function withSearch(path: string) {
    return { path, query: preserved.value }
  }

  const shopLink = computed(() => withSearch('/mobile-numbers'))

  return { preserved, withSearch, shopLink }
}
