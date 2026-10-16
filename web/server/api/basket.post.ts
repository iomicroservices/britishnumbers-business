interface BasketBody {
  sessionId?: unknown
  number?: unknown
  price?: unknown
  mrc?: unknown
  tariff?: unknown
  destination?: unknown
  number_type?: unknown
  switchboard?: unknown
  team_divert?: unknown
  call_whisper?: unknown
}

function asBool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const body = await readBody<BasketBody>(event)
  const session = await requireSession(body?.sessionId)
  const number = String(body?.number || '').trim()
  const price = Number(body?.price)
  if (!number || !Number.isFinite(price)) {
    throw createError({ statusCode: 400, statusMessage: 'A number and price are required' })
  }

  const record = await createRecord('basket', {
    mrc: Number(body?.mrc) || 0,
    price,
    number,
    tariff: String(body?.tariff || ''),
    include: true,
    session_id: [session.id],
    destination: String(body?.destination || ''),
    number_type: String(body?.number_type || ''),
    switchboard: asBool(body?.switchboard),
    team_divert: asBool(body?.team_divert),
    call_whisper: asBool(body?.call_whisper)
  })
  return { id: record.id }
})
