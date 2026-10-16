const AIRTABLE_BASE_ID = 'appqfQkbM4rHSVsLQ'

const TABLES = {
  basket: 'tblZRBjzu1NvpenqM',
  sessions: 'tblht0arUwtWyILb6',
  companies: 'tblSGYkDGW7RT8AtP',
  leads: 'tblE3aWvlKoEReGqF'
} as const

const DEFAULT_SESSION_TTL_DAYS = 7

export interface AirtableRecord {
  id: string
  createdTime?: string
  [key: string]: unknown
}

function secrets() {
  const config = useRuntimeConfig()
  return {
    token: String(config.airtableToken || ''),
    ttlDays: String(config.sessionTtlDays || DEFAULT_SESSION_TTL_DAYS)
  }
}

function ttlMs() {
  const days = Number.parseInt(secrets().ttlDays, 10)
  const safeDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_SESSION_TTL_DAYS
  return safeDays * 24 * 60 * 60 * 1000
}

export function isSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('rec')
}

function flattenRecord(record: { id: string, createdTime?: string, fields?: Record<string, unknown> }): AirtableRecord {
  return {
    id: record.id,
    ...(record.createdTime ? { createdTime: record.createdTime } : {}),
    ...(record.fields || {})
  }
}

function isExpired(createdTime: unknown) {
  if (typeof createdTime !== 'string' || !createdTime) return false
  const created = Date.parse(createdTime)
  if (!Number.isFinite(created)) return false
  return Date.now() - created > ttlMs()
}

async function airtableFetch(path: string, init: RequestInit = {}) {
  const token = secrets().token
  if (!token) {
    throw createError({ statusCode: 500, statusMessage: 'AIRTABLE_TOKEN is not configured' })
  }

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  })

  const text = await response.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? JSON.stringify(body.error)
      : `Airtable request failed (${response.status})`
    throw createError({
      statusCode: response.status,
      statusMessage: message
    })
  }

  return body
}

export async function getRecord(table: keyof typeof TABLES, recordId: string) {
  const record = await airtableFetch(`/${TABLES[table]}/${recordId}`) as {
    id: string
    createdTime?: string
    fields?: Record<string, unknown>
  }
  return flattenRecord(record)
}

async function getRecordOrNull(table: keyof typeof TABLES, recordId: string) {
  try {
    return await getRecord(table, recordId)
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 404 || status === 403) return null
    throw error
  }
}

export async function createRecord(table: keyof typeof TABLES, fields: Record<string, unknown>) {
  const body = await airtableFetch(`/${TABLES[table]}`, {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true })
  }) as { id: string, createdTime?: string, fields?: Record<string, unknown> }
  return flattenRecord(body)
}

export async function deleteRecord(table: keyof typeof TABLES, recordId: string) {
  await airtableFetch(`/${TABLES[table]}/${recordId}`, { method: 'DELETE' })
}

export function linkedIds(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string') return [value]
  return []
}

export async function requireSession(sessionId: unknown) {
  if (!isSessionId(sessionId)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid sessionId is required' })
  }
  const existing = await getRecordOrNull('sessions', sessionId)
  if (!existing || isExpired(existing.createdTime)) {
    throw createError({ statusCode: 410, statusMessage: 'Session expired' })
  }
  return existing
}

export async function ensureSession(input: { sessionId?: unknown, type?: unknown }) {
  const type = input.type === 'landline' ? 'landline' : 'mobile'
  if (isSessionId(input.sessionId)) {
    const existing = await getRecordOrNull('sessions', input.sessionId)
    if (existing && !isExpired(existing.createdTime)) return existing
  }
  return createRecord('sessions', { type, is_auth: false })
}

export async function listBasket(sessionId: string) {
  const params = new URLSearchParams()
  params.set('pageSize', '100')
  params.set('filterByFormula', `FIND('${sessionId.replace(/'/g, '\\\'')}', ARRAYJOIN({session_id}))`)

  const collected: AirtableRecord[] = []
  let cursor = ''

  while (collected.length < 100) {
    if (cursor) params.set('offset', cursor)
    const page = await airtableFetch(`/${TABLES.basket}?${params.toString()}`) as {
      records?: { id: string, createdTime?: string, fields?: Record<string, unknown> }[]
      offset?: string
    }
    const records = (page.records || []).map(flattenRecord)
    collected.push(...records)
    if (!page.offset || page.offset === cursor || records.length === 0) break
    cursor = page.offset
  }

  return collected.slice(0, 100)
}
