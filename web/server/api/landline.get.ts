const TAMAR_AVAILABLE_URL = 'https://api.tamar.co.uk/list/available'
const PAGE_SIZE = 90
const CACHE_MS = 5 * 60 * 1000

const GRADE_BANDS: Record<string, [number, number]> = {
  Bronze: [0, 1],
  Silver: [1, 100],
  Gold: [100, 300],
  Platinum: [300, 500000]
}

const areaCache = new Map<string, { expires: number, rows: { number: string, price: number }[] }>()

function readPositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function basicAuthHeader(apiKey: string) {
  const credentials = apiKey.includes(':') ? apiKey : `${apiKey}:`
  return `Basic ${btoa(credentials)}`
}

async function loadArea(areaCode: string, apiKey: string) {
  const cached = areaCache.get(areaCode)
  if (cached && cached.expires > Date.now()) return cached.rows

  const response = await fetch(`${TAMAR_AVAILABLE_URL}/${encodeURIComponent(areaCode)}`, {
    headers: {
      Authorization: basicAuthHeader(apiKey),
      Accept: 'application/json'
    }
  })
  const text = await response.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : text || `Tamar request failed (${response.status})`
    throw createError({ statusCode: response.status, statusMessage: message })
  }

  const rows = Array.isArray(body)
    ? body.flatMap((row) => {
        const record = row as { number?: unknown, price?: unknown }
        const number = String(record.number || '')
        if (!number) return []
        return [{ number, price: Number(record.price) }]
      })
    : body && typeof body === 'object'
      ? Object.entries(body as Record<string, unknown>).map(([number, price]) => ({ number, price: Number(price) }))
      : []
  areaCache.set(areaCode, { expires: Date.now() + CACHE_MS, rows })
  return rows
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const query = getQuery(event)
  const areaCode = String(query.areaCode || '').trim()
  const grade = GRADE_BANDS[String(query.grade)] ? String(query.grade) : ''
  const page = readPositiveInt(query.page, 1)

  if (!areaCode) return { data: [], page: 1, pageSize: PAGE_SIZE, total: 0 }

  const apiKey = String(useRuntimeConfig().tamarApiKey || '')
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'TAMAR_API_KEY is not configured' })
  }

  const band = grade ? GRADE_BANDS[grade] : null
  const filtered = (await loadArea(areaCode, apiKey))
    .filter(row => !band || (row.price >= band[0] && row.price < band[1]))
    .sort((a, b) => a.price - b.price || a.number.localeCompare(b.number))
  const start = (page - 1) * PAGE_SIZE

  return {
    data: filtered.slice(start, start + PAGE_SIZE).map(row => ({
      number: row.number,
      price: Math.round(row.price * 1.8)
    })),
    page,
    pageSize: PAGE_SIZE,
    total: filtered.length
  }
})
