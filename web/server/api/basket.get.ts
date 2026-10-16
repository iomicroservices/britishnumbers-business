export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const query = getQuery(event)
  const session = await requireSession(query.sessionId)
  return { data: await listBasket(session.id) }
})
