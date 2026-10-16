const MEMORABLE_URL = 'https://api.britishnumbers.com/rest/v2/mobile/memorable'

const MATCHES = new Set(['number', 'prefix', 'last_six'])

function readPositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readOptionalNumber(value: unknown) {
  if (value === '' || value == null) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseTotal(contentRange: string | null, rowCount: number) {
  const total = /\/(\d+)\s*$/.exec(contentRange || '')?.[1]
  if (!total) return rowCount
  return Number.parseInt(total, 10)
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const query = getQuery(event)
  const search = String(query.q || '').replace(/[^A-Za-z0-9,]/g, '')
  const match = MATCHES.has(String(query.match)) ? String(query.match) : 'number'
  const page = readPositiveInt(query.page, 1)
  const pageSize = Math.min(readPositiveInt(query.pageSize, 90), 100)
  const priceGte = readOptionalNumber(query.price_gte)
  const priceLte = readOptionalNumber(query.price_lte)
  const precision = query.precision === 'exact' ? 'exact' : 'fuzzy'

  if (search.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Enter at least 2 characters' })
  }

  const key = String(useRuntimeConfig().britishNumbersApiKey || '')
  if (!key) {
    throw createError({ statusCode: 500, statusMessage: 'BRITISH_NUMBERS_API_KEY is not configured' })
  }

  const offset = (page - 1) * pageSize
  const upstream = new URL(MEMORABLE_URL)
  upstream.searchParams.set('search', search)
  upstream.searchParams.set('type', match)
  upstream.searchParams.set('match', precision)
  upstream.searchParams.set('range', `${offset}-${offset + pageSize - 1}`)
  if (priceGte != null) upstream.searchParams.set('price_gte', String(priceGte))
  if (priceLte != null) upstream.searchParams.set('price_lte', String(priceLte))

  const response = await fetch(upstream, {
    headers: {
      'Accept': 'application/json',
      'X-API-Key': key
    }
  })
  const text = await response.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }

  if (!response.ok && response.status !== 416) {
    const message = body && typeof body === 'object'
      ? String((body as { message?: unknown, error?: unknown }).message || (body as { error?: unknown }).error || text)
      : text || `Mobile number search failed (${response.status})`
    throw createError({ statusCode: response.status, statusMessage: message })
  }

  const rows = Array.isArray(body) ? body : []
  const data = rows.map((row) => {
    const record = row as { number?: unknown, price?: unknown, prefix?: unknown, last_six?: unknown, delivery?: unknown }
    const delivery = Number(record.delivery)
    return {
      number: String(record.number ?? ''),
      price: Number(record.price ?? 0),
      prefix: record.prefix ?? '',
      last_six: record.last_six ?? '',
      ...(Number.isFinite(delivery) ? { delivery } : {})
    }
  })

  return {
    data,
    page,
    pageSize,
    total: parseTotal(response.headers.get('content-range'), data.length)
  }
})
