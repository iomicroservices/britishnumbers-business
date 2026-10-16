function looksLikeUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim())
}

function normalizeCheckoutBody(body: unknown) {
  if (looksLikeUrl(body)) return { data: body.trim() }
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const record = body as { data?: unknown, url?: unknown }
    if (looksLikeUrl(record.data)) return body
    if (looksLikeUrl(record.url) && !record.data) return { ...record, data: String(record.url).trim() }
  }
  return body
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const webhook = String(useRuntimeConfig().makeCheckoutWebhookUrl || '')
  if (!webhook) {
    throw createError({ statusCode: 500, statusMessage: 'MAKE_CHECKOUT_WEBHOOK_URL is not configured' })
  }

  const bodyText = await readRawBody(event) || ''
  const response = await fetch(webhook, {
    method: 'POST',
    headers: {
      'content-type': getRequestHeader(event, 'content-type') || 'application/json',
      'Accept': 'application/json, text/plain, */*'
    },
    body: bodyText || undefined
  })
  const text = (await response.text()).trim()
  const upstreamType = response.headers.get('content-type') || ''

  if (upstreamType.includes('application/json')) {
    let body: unknown
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = looksLikeUrl(text) ? { data: text } : { error: text || 'Invalid upstream response' }
    }
    setResponseStatus(event, response.status)
    return normalizeCheckoutBody(body)
  }

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: text || `Make checkout request failed (${response.status})`
    })
  }

  try {
    return normalizeCheckoutBody(text ? JSON.parse(text) : { ok: true })
  } catch {
    if (looksLikeUrl(text)) return { data: text }
    return { ok: true, message: text || 'Accepted' }
  }
})
