export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const body = await readBody<{
    sessionId?: unknown
    name?: unknown
    address?: unknown
    registration?: unknown
  }>(event)
  const session = await requireSession(body?.sessionId)
  const record = await createRecord('companies', {
    name: String(body?.name || ''),
    address: String(body?.address || ''),
    registration: String(body?.registration || ''),
    session_id: [session.id]
  })
  return { id: record.id }
})
