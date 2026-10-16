import type { CheckoutDetails, CompanyHit } from './useMobileShop'

export type LandlineGrade = 'All' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
export type LandlinePlanId = '3' | '11' | '14'
export type NumberKind = '0102' | '0333' | '0800'

export interface AreaCode {
  name: string
  code: string
  featured?: boolean
}

export interface LandlineNumber {
  number: string
  price: number
}

export interface LandlineBasketItem {
  id: string
  number: string
  price: number
  mrc: number
  tariff: string
  destination: string
  numberType: string
  switchboard: boolean
  team: boolean
  whisper: boolean
}

export interface LandlineAdd {
  number: string
  price: number
  plan: LandlinePlanId
  destination: string
  numberType: NumberKind
  switchboard: boolean
  team: boolean
  whisper: boolean
}

export const LANDLINE_PAGE_SIZE = 90

export const LANDLINE_PLANS: { id: LandlinePlanId, name: string, monthly: number }[] = [
  { id: '3', name: 'PAYG Plan', monthly: 3 },
  { id: '11', name: 'Individual Plan', monthly: 11 },
  { id: '14', name: 'Business Plan', monthly: 14 }
]

export const FALLBACK_AREA_CODES: AreaCode[] = [
  { name: 'London', code: '0203', featured: true },
  { name: 'London', code: '0208', featured: true },
  { name: 'Birmingham', code: '0121', featured: true },
  { name: 'Manchester', code: '0161', featured: true },
  { name: 'Glasgow', code: '0141' },
  { name: 'Edinburgh', code: '0131' },
  { name: 'Liverpool', code: '0151' },
  { name: 'Leeds', code: '0113' },
  { name: 'Sheffield', code: '0114' },
  { name: 'Nottingham', code: '0115' },
  { name: 'Leicester', code: '0116' },
  { name: 'Bristol', code: '0117' },
  { name: 'Reading', code: '0118' },
  { name: 'Newcastle', code: '0191' },
  { name: 'Cardiff', code: '029' },
  { name: 'Belfast', code: '028' },
  { name: 'Southampton', code: '023' },
  { name: 'Coventry', code: '024' },
  { name: 'Aberdeen', code: '01224' },
  { name: 'Cambridge', code: '01223' },
  { name: 'Oxford', code: '01865' },
  { name: 'Brighton', code: '01273' },
  { name: 'Bournemouth', code: '01202' },
  { name: 'Norwich', code: '01603' },
  { name: 'Plymouth', code: '01752' },
  { name: 'Swansea', code: '01792' },
  { name: 'York', code: '01904' },
  { name: 'Derby', code: '01332' },
  { name: 'Bradford', code: '01274' }
]

const GRADE_BANDS: Record<Exclude<LandlineGrade, 'All'>, [number, number]> = {
  Bronze: [0, 1],
  Silver: [1, 100],
  Gold: [100, 300],
  Platinum: [300, 500000]
}

const SESSION_KEY = 'bn-landline-session'

export function connectionLabel(price: number) {
  const amount = Number(price) || 0
  if (amount === 0) return 'Free'
  return `£${Math.round(amount).toLocaleString('en-GB')}`
}

export function planById(id: string) {
  return LANDLINE_PLANS.find(plan => plan.id === id)
}

export function featureCost(item: Pick<LandlineBasketItem, 'mrc' | 'switchboard' | 'team' | 'whisper'>) {
  if (Number(item.mrc) !== 3) return 0
  return (item.switchboard ? 6 : 0) + (item.team ? 3 : 0) + (item.whisper ? 3 : 0)
}

export function formatLandline(number: string, areaCode = '') {
  const digits = String(number || '').replace(/\D/g, '')
  if (!digits) return number
  if (digits.startsWith('0800') || digits.startsWith('0333')) {
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(' ')
  }
  if (/^02[03489]/.test(digits)) {
    return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)].filter(Boolean).join(' ')
  }
  const area = areaCode.replace(/\D/g, '')
  if (area && digits.startsWith(area) && area.length >= 2 && area.length <= 5) {
    const rest = digits.slice(area.length)
    const mid = Math.ceil(rest.length / 2)
    return [area, rest.slice(0, mid), rest.slice(mid)].filter(Boolean).join(' ')
  }
  return digits
}

function applyGrade(rows: LandlineNumber[], grade: LandlineGrade) {
  const band = grade === 'All' ? null : GRADE_BANDS[grade]
  const filtered = band
    ? rows.filter(row => row.price >= band[0] && row.price < band[1])
    : rows.slice()
  filtered.sort((a, b) => a.price - b.price || a.number.localeCompare(b.number))
  return filtered
}

function errorMessage(error: unknown) {
  const err = error as {
    data?: { error?: { message?: string } | string }
    message?: string
  }
  const data = err?.data?.error
  if (typeof data === 'string') return data
  if (data && typeof data === 'object' && data.message) return data.message
  return err?.message || 'Something went wrong'
}

function asBool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function useLandlineShop() {
  const sessionId = useState<string>('landline-session', () => '')
  const basket = useState<LandlineBasketItem[]>('landline-basket', () => [])
  const results = useState<LandlineNumber[]>('landline-results', () => [])
  const page = useState('landline-page', () => 1)
  const resultTotal = useState('landline-total', () => 0)
  const companies = useState<CompanyHit[]>('landline-companies', () => [])
  const areaCodes = useState<AreaCode[]>('landline-area-codes', () => [])
  const ready = useState('landline-ready', () => false)
  const searching = ref(false)
  const basketBusy = ref(false)
  const checkingOut = ref(false)
  const lookingUp = ref(false)
  const error = ref('')
  const catalogue = ref<LandlineNumber[] | null>(null)
  let requestId = 0

  const monthly = computed(() => basket.value.reduce((sum, item) => sum + Number(item.mrc || 0) + featureCost(item), 0))
  const connectionTotal = computed(() => basket.value.reduce((sum, item) => sum + Number(item.price || 0), 0))
  const total = computed(() => connectionTotal.value + monthly.value)

  function inBasket(number: string) {
    return basket.value.some(item => item.number === number)
  }

  function publish(rows: LandlineNumber[], grade: LandlineGrade, nextPage: number) {
    const filtered = applyGrade(rows, grade)
    results.value = filtered.slice(0, nextPage * LANDLINE_PAGE_SIZE)
    page.value = nextPage
    resultTotal.value = filtered.length
  }

  function clearSession() {
    sessionId.value = ''
    basket.value = []
    ready.value = false
    if (import.meta.client) localStorage.removeItem(SESSION_KEY)
  }

  async function ensureSession() {
    error.value = ''
    const stored = import.meta.client ? localStorage.getItem(SESSION_KEY) : ''
    try {
      const response = await $fetch<{ id?: string }>('/api/session', {
        method: 'POST',
        body: {
          sessionId: stored || undefined,
          type: 'landline'
        }
      })
      const id = response.id || ''
      if (!id) throw new Error('No session returned')
      sessionId.value = id
      if (import.meta.client) localStorage.setItem(SESSION_KEY, id)
      await loadBasket()
      ready.value = true
    } catch (err) {
      ready.value = false
      error.value = errorMessage(err)
    }
  }

  async function loadAreaCodes() {
    try {
      const response = await $fetch<AreaCode[] | { error?: string }>('/api/area-codes')
      const rows = Array.isArray(response) ? response.filter(row => row.code !== '0207') : []
      areaCodes.value = rows.length ? rows : FALLBACK_AREA_CODES
    } catch {
      areaCodes.value = FALLBACK_AREA_CODES
    }
  }

  async function loadBasket() {
    if (!sessionId.value) return
    const response = await $fetch<{ data?: Record<string, unknown>[] }>('/api/basket', {
      query: { sessionId: sessionId.value }
    })
    basket.value = (response.data || []).map(item => ({
      id: String(item.id || ''),
      number: String(item.number || ''),
      price: Number(item.price || 0),
      mrc: Number(item.mrc || 0),
      tariff: String(item.tariff || ''),
      destination: String(item.destination || ''),
      numberType: String(item.number_type || ''),
      switchboard: asBool(item.switchboard),
      team: asBool(item.team_divert),
      whisper: asBool(item.call_whisper)
    }))
  }

  async function search(areaCode: string, grade: LandlineGrade, nextPage = 1, append = false) {
    const id = ++requestId
    searching.value = true
    error.value = ''
    try {
      if (catalogue.value && append) {
        publish(catalogue.value, grade, nextPage)
        return
      }

      if (!append) catalogue.value = null

      const response = await $fetch<LandlineNumber[] | {
        data?: LandlineNumber[]
        page?: number
        total?: number
        error?: string
      }>('/api/landline', {
        query: {
          areaCode,
          page: nextPage,
          ...(grade !== 'All' ? { grade } : {})
        }
      })

      if (id !== requestId) return

      if (Array.isArray(response)) {
        catalogue.value = response.map(row => ({
          number: String(row.number || ''),
          price: Number(row.price || 0)
        }))
        publish(catalogue.value, grade, nextPage)
        return
      }

      const rows = (response.data || []).map(row => ({
        number: String(row.number || ''),
        price: Number(row.price || 0)
      }))
      results.value = append ? [...results.value, ...rows] : rows
      page.value = response.page || nextPage
      resultTotal.value = response.total ?? rows.length
    } catch (err) {
      if (id !== requestId) return
      if (!append) {
        results.value = []
        page.value = nextPage
        resultTotal.value = 0
        catalogue.value = null
      }
      error.value = errorMessage(err)
    } finally {
      if (id === requestId) searching.value = false
    }
  }

  function refilter(grade: LandlineGrade) {
    if (!catalogue.value) return false
    requestId += 1
    publish(catalogue.value, grade, 1)
    return true
  }

  async function addToBasket(item: LandlineAdd) {
    if (!sessionId.value || inBasket(item.number)) return
    const plan = planById(item.plan)
    if (!plan) return
    basketBusy.value = true
    error.value = ''
    try {
      await $fetch('/api/basket', {
        method: 'POST',
        body: {
          sessionId: sessionId.value,
          mrc: plan.monthly,
          price: item.price,
          number: item.number,
          tariff: plan.name,
          destination: item.destination,
          number_type: item.numberType,
          switchboard: item.switchboard,
          team_divert: item.team,
          call_whisper: item.whisper
        }
      })
      await loadBasket()
    } catch (err) {
      error.value = errorMessage(err)
    } finally {
      basketBusy.value = false
    }
  }

  async function removeFromBasket(id: string) {
    basketBusy.value = true
    error.value = ''
    try {
      await $fetch(`/api/basket/${id}`, {
        method: 'DELETE',
        query: { sessionId: sessionId.value }
      })
      basket.value = basket.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = errorMessage(err)
    } finally {
      basketBusy.value = false
    }
  }

  async function lookupCompany(query: string) {
    lookingUp.value = true
    error.value = ''
    companies.value = []
    try {
      const response = await $fetch<{ items?: CompanyHit[] }>('/api/companies-house', {
        query: { q: query }
      })
      companies.value = (response.items || []).map(item => ({
        title: item.title || '',
        company_number: item.company_number || '',
        address_snippet: item.address_snippet || '',
        address: item.address
      }))
    } catch (err) {
      error.value = errorMessage(err)
    } finally {
      lookingUp.value = false
    }
  }

  async function saveCompany(hit: CompanyHit) {
    if (!sessionId.value) return
    await $fetch('/api/company', {
      method: 'POST',
      body: {
        sessionId: sessionId.value,
        name: hit.title,
        address: hit.address_snippet,
        registration: hit.company_number
      }
    })
  }

  async function checkout(details: CheckoutDetails) {
    if (!sessionId.value || !basket.value.length) return
    checkingOut.value = true
    error.value = ''
    try {
      const products = basket.value.map(item => ({
        id: item.id,
        number: item.number,
        price: item.price,
        mrc: item.mrc,
        tariff: item.tariff,
        destination: item.destination
      }))
      const payg = basket.value.filter(item => item.tariff === 'PAYG Plan').length
      const individual = basket.value.filter(item => item.tariff === 'Individual Plan').length
      const business = basket.value.filter(item => item.tariff === 'Business Plan').length
      await $fetch('/api/lead', {
        method: 'POST',
        body: {
          sessionId: sessionId.value,
          city: details.city,
          name: `${details.firstName} ${details.lastName}`.trim(),
          news: details.news,
          type: 'landline',
          email: details.email,
          total: total.value,
          source: import.meta.client ? window.location.href : '',
          address: details.address,
          lastName: details.lastName,
          metadata: JSON.stringify({
            payg_quant: payg,
            individual_quant: individual,
            business_quant: business,
            switchboard_quant: basket.value.filter(item => item.switchboard).length - business,
            team_quant: basket.value.filter(item => item.team).length - business,
            whisper_quant: basket.value.filter(item => item.whisper).length - (business + individual)
          }),
          postCode: details.postCode,
          products: JSON.stringify(products),
          firstName: details.firstName,
          conditions: details.conditions,
          businessReg: details.businessReg,
          businessName: details.businessName,
          businessType: details.businessType,
          contactNumber: details.contactNumber
        }
      })

      const response = await $fetch<{ data?: string, url?: string }>('/api/checkout', {
        method: 'POST',
        body: {
          email: details.email,
          source: import.meta.client ? window.location.href : '',
          total: total.value,
          session_id: sessionId.value,
          type: 'landline'
        }
      })

      const url = typeof response.data === 'string' ? response.data : response.url
      if (!url) throw new Error('Checkout did not return a payment link')
      if (import.meta.client) window.location.href = url
    } catch (err) {
      error.value = errorMessage(err)
      checkingOut.value = false
    }
  }

  return {
    sessionId,
    basket,
    results,
    page,
    resultTotal,
    companies,
    areaCodes,
    ready,
    searching,
    basketBusy,
    checkingOut,
    lookingUp,
    error,
    monthly,
    connectionTotal,
    total,
    inBasket,
    clearSession,
    ensureSession,
    loadAreaCodes,
    search,
    refilter,
    addToBasket,
    removeFromBasket,
    lookupCompany,
    saveCompany,
    checkout
  }
}
