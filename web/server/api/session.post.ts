export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const body = await readBody<{ sessionId?: unknown, type?: unknown }>(event).catch((): { sessionId?: unknown, type?: unknown } => ({}))
  const session = await ensureSession({
    sessionId: body?.sessionId,
    type: body?.type
  })
  return { id: session.id }
})
