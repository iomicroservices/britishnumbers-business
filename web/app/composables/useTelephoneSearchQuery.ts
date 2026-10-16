import type { LocationQuery } from 'vue-router'
import type { LandlineGrade, LandlinePlanId, NumberKind } from './useLandlineShop'

export interface TelephoneSearchParams {
  kind: NumberKind
  area: string
  grade: LandlineGrade
  plan: LandlinePlanId | null
}

const KINDS = new Set<NumberKind>(['0102', '0333', '0800'])
const GRADES = new Set<LandlineGrade>(['All', 'Bronze', 'Silver', 'Gold', 'Platinum'])
const PLAN_FROM_QUERY: Record<string, LandlinePlanId> = {
  payg: '3',
  '3': '3',
  individual: '11',
  '11': '11',
  business: '14',
  '14': '14'
}
const PLAN_TO_QUERY: Record<LandlinePlanId, string> = {
  '3': 'payg',
  '11': 'individual',
  '14': 'business'
}

function one(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

export function readTelephoneSearch(query: LocationQuery): TelephoneSearchParams {
  const kindRaw = one(query.type)
  const gradeRaw = one(query.grade)
  const gradeKey = gradeRaw ? gradeRaw.charAt(0).toUpperCase() + gradeRaw.slice(1).toLowerCase() : ''
  const area = one(query.area).replace(/\D/g, '')
  return {
    kind: KINDS.has(kindRaw as NumberKind) ? kindRaw as NumberKind : '0333',
    area: area || '0208',
    grade: GRADES.has(gradeKey as LandlineGrade) ? gradeKey as LandlineGrade : 'All',
    plan: PLAN_FROM_QUERY[one(query.plan).toLowerCase()] ?? null
  }
}

export function telephoneSearchQuery(params: TelephoneSearchParams) {
  const query: Record<string, string> = {}
  if (params.kind !== '0333') query.type = params.kind
  if (params.area && params.area !== '0208') query.area = params.area
  if (params.grade !== 'All') query.grade = params.grade
  if (params.plan) query.plan = PLAN_TO_QUERY[params.plan]
  return query
}

export function sameTelephoneSearch(left: Record<string, string>, right: Record<string, string>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (left[key] !== right[key]) return false
  }
  return true
}

export function useTelephoneSearchQuery() {
  const route = useRoute()

  const preserved = computed(() => {
    if (!route.path.startsWith('/telephone-numbers')) return {}
    return telephoneSearchQuery(readTelephoneSearch(route.query))
  })

  function withSearch(path: string, plan?: LandlinePlanId | null) {
    const query = { ...preserved.value }
    if (plan) query.plan = PLAN_TO_QUERY[plan]
    else if (plan === null) delete query.plan
    return { path, query }
  }

  const shopLink = computed(() => withSearch('/telephone-numbers'))

  return { preserved, withSearch, shopLink }
}
