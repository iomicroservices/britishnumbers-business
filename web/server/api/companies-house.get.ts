const COMPANIES_HOUSE_SEARCH_URL = 'https://api.company-information.service.gov.uk/search/companies'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const query = getQuery(event)
  const q = String(query.q || '').trim()
  if (!q) return { items: [], total_results: 0, kind: 'search#companies' }

  const apiKey = String(useRuntimeConfig().companiesHouseApiKey || '')
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'COMPANIES_HOUSE_API_KEY is not configured' })
  }

  const upstream = new URL(COMPANIES_HOUSE_SEARCH_URL)
  upstream.searchParams.set('q', q)
  for (const key of ['items_per_page', 'start_index']) {
    const value = query[key]
    if (typeof value === 'string' && value) upstream.searchParams.set(key, value)
  }

  const response = await fetch(upstream, {
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:`)}`,
      Accept: 'application/json'
    }
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : `Companies House request failed (${response.status})`
    throw createError({ statusCode: response.status, statusMessage: message })
  }
  return body
})
