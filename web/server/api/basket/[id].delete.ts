export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const session = await requireSession(getQuery(event).sessionId)
  const id = getRouterParam(event, 'id') || ''
  if (!isSessionId(id)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid basket id is required' })
  }

  const record = await getRecord('basket', id).catch((error: { statusCode?: number }) => {
    if (error?.statusCode === 404 || error?.statusCode === 403) return null
    throw error
  })
  if (!record || !linkedIds(record.session_id).includes(session.id)) {
    throw createError({ statusCode: 404, statusMessage: 'Basket item not found' })
  }

  await deleteRecord('basket', id)
  return { id }
})
