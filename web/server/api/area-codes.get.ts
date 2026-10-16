const PAGE_SIZE = 100

interface AreaRow {
  name: string
  code: string
  featured: boolean
}

function mapRows(body: unknown): AreaRow[] {
  if (!Array.isArray(body)) return []
  return body.flatMap((row) => {
    const record = row as { name?: unknown, code?: unknown, featured?: unknown }
    const code = String(record.code || '')
    if (!code) return []
    return [{
      name: String(record.name || code),
      code,
      featured: Boolean(record.featured)
    }]
  })
}

export default defineEventHandler(async () => {
  const { supabaseUrl, supabaseAnonKey } = useRuntimeConfig()
  const baseUrl = String(supabaseUrl || '').replace(/\/$/, '')
  const key = String(supabaseAnonKey || '')
  if (!baseUrl || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Area codes are not configured' })
  }

  const rows: AreaRow[] = []
  let from = 0
  let total: number | null = null

  while (from < 5000) {
    const upstream = new URL(`${baseUrl}/rest/v1/areacodes`)
    upstream.searchParams.set('select', 'name,code,featured')
    upstream.searchParams.set('order', 'name.asc')
    const response = await fetch(upstream, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        Range: `${from}-${from + PAGE_SIZE - 1}`,
        Prefer: 'count=exact'
      }
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'message' in body
        ? String(body.message)
        : `Area code request failed (${response.status})`
      throw createError({ statusCode: response.status, statusMessage: message })
    }
    const page = mapRows(body)
    rows.push(...page)
    const range = response.headers.get('content-range') || ''
    const declared = range.includes('/') ? Number(range.split('/')[1]) : null
    total = Number.isFinite(declared) ? declared : null
    if (!page.length || page.length < PAGE_SIZE || (total != null && from + PAGE_SIZE >= total)) break
    from += PAGE_SIZE
  }

  return rows.filter(row => row.code !== '0207')
})
