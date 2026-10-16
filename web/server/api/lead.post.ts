const LEAD_FIELDS = [
  'city',
  'name',
  'news',
  'type',
  'email',
  'total',
  'source',
  'address',
  'lastName',
  'metadata',
  'postCode',
  'products',
  'firstName',
  'conditions',
  'businessReg',
  'businessName',
  'businessType',
  'contactNumber'
] as const

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const body = await readBody<Record<string, unknown>>(event)
  const session = await requireSession(body?.sessionId)
  const fields: Record<string, unknown> = { session: [session.id] }
  for (const key of LEAD_FIELDS) {
    if (body?.[key] != null) fields[key] = body[key]
  }
  if (fields.type !== 'mobile' && fields.type !== 'landline') fields.type = 'mobile'
  const record = await createRecord('leads', fields)
  return { id: record.id }
})
