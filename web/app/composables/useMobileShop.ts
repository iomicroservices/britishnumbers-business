export type MobileMatch = 'prefix' | 'number' | 'last_six'

export interface MobileNumber {
  number: string
  price: number
  prefix?: string
  last_six?: string
  delivery?: number
}

export interface BasketItem {
  id: string
  number: string
  price: number
}

export interface CompanyHit {
  title: string
  company_number: string
  address_snippet: string
  address?: {
    premises?: string
    address_line_1?: string
    address_line_2?: string
    locality?: string
    postal_code?: string
  }
}

export interface CheckoutDetails {
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  address: string
  city: string
  postCode: string
  businessType: string
  businessName: string
  businessReg: string
  news: boolean
  conditions: boolean
}

export const MOBILE_PAGE_SIZE = 100

const SESSION_KEY = 'bn-mobile-session'
const BASKET = 'f307c3b2-c35c-4fda-8eeb-8519409853ea'
const LEADS = '8dc4beaa-819b-48b0-95ed-6a6d92e9156b'
const COMPANIES = '454772e5-f61a-421e-854c-0ef92be1df3e'

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

export function useMobileShop() {
  const sessionId = useState<string>('mobile-session', () => '')
  const basket = useState<BasketItem[]>('mobile-basket', () => [])
  const results = useState<MobileNumber[]>('mobile-results', () => [])
  const page = useState('mobile-page', () => 1)
  const resultTotal = useState('mobile-total', () => 0)
  const companies = useState<CompanyHit[]>('mobile-companies', () => [])
  const ready = useState('mobile-ready', () => false)
  const searching = ref(false)
  const basketBusy = ref(false)
  const checkingOut = ref(false)
  const lookingUp = ref(false)
  const error = ref('')

  const total = computed(() => basket.value.reduce((sum, item) => sum + Number(item.price || 0), 0))

  function inBasket(number: string) {
    return basket.value.some(item => item.number === number)
  }

  async function ensureSession() {
    error.value = ''
    const stored = import.meta.client ? localStorage.getItem(SESSION_KEY) : ''
    try {
      const response = await $fetch<{ data?: { id?: string } }>('/ww/session/ensure', {
        method: 'POST',
        body: {
          sessionId: stored || undefined,
          type: 'mobile',
          is_auth: false
        }
      })
      const id = response.data?.id || ''
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

  async function loadBasket() {
    if (!sessionId.value) return
    const response = await $fetch<{ data?: BasketItem[] }>(
      `/ww/cms_data_sets/${BASKET}/fetch?sessionId=${encodeURIComponent(sessionId.value)}`,
      { method: 'POST', body: {} }
    )
    basket.value = (response.data || []).map(item => ({
      id: item.id,
      number: String(item.number || ''),
      price: Number(item.price || 0)
    }))
  }

  async function search(
    query: string,
    match: MobileMatch,
    nextPage = 1,
    price: { gte?: number, lte?: number } = {},
    append = false
  ) {
    searching.value = true
    error.value = ''
    try {
      const response = await $fetch<{
        data?: MobileNumber[]
        page?: number
        total?: number
        error?: string
      }>('/api/mobile', {
        query: {
          q: query,
          match,
          page: nextPage,
          pageSize: MOBILE_PAGE_SIZE,
          ...(price.gte != null ? { price_gte: price.gte } : {}),
          ...(price.lte != null ? { price_lte: price.lte } : {})
        }
      })
      const rows = response.data || []
      results.value = append ? [...results.value, ...rows] : rows
      page.value = response.page || nextPage
      resultTotal.value = response.total ?? (append ? results.value.length : rows.length)
    } catch (err) {
      if (!append) {
        results.value = []
        page.value = nextPage
        resultTotal.value = 0
      }
      error.value = errorMessage(err)
    } finally {
      searching.value = false
    }
  }

  async function findNumber(number: string) {
    const digits = number.replace(/\D/g, '')
    const path = '/api/mobile'
    const request = import.meta.server ? `${useRequestURL().origin}${path}` : path
    const response = await $fetch<{
      data?: MobileNumber[]
      error?: string
    }>(request, {
      query: {
        q: digits,
        match: 'number',
        precision: 'exact',
        page: 1,
        pageSize: 5
      }
    })
    return (response.data || []).find(row => String(row.number).replace(/\D/g, '') === digits) ?? null
  }

  async function addToBasket(item: MobileNumber) {
    if (!sessionId.value || inBasket(item.number)) return
    basketBusy.value = true
    error.value = ''
    try {
      await $fetch(`/ww/cms_data_sets/${BASKET}/airtable/record`, {
        method: 'POST',
        body: {
          data: {
            mrc: 0,
            price: item.price,
            number: item.number,
            tariff: '',
            include: true,
            session_id: [sessionId.value],
            destination: '',
            number_type: '07'
          }
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
      await $fetch(`/ww/cms_data_sets/${BASKET}/airtable/record/${id}`, { method: 'DELETE' })
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
    await $fetch(`/ww/cms_data_sets/${COMPANIES}/airtable/record`, {
      method: 'POST',
      body: {
        data: {
          name: hit.title,
          address: hit.address_snippet,
          registration: hit.company_number,
          session_id: [sessionId.value]
        }
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
        price: item.price
      }))
      await $fetch(`/ww/cms_data_sets/${LEADS}/airtable/record`, {
        method: 'POST',
        body: {
          data: {
            city: details.city,
            name: `${details.firstName} ${details.lastName}`.trim(),
            news: details.news,
            type: 'mobile',
            email: details.email,
            total: total.value,
            source: import.meta.client ? window.location.href : '',
            address: details.address,
            session: [sessionId.value],
            lastName: details.lastName,
            metadata: JSON.stringify({ quantity: products.length }),
            postCode: details.postCode,
            products: JSON.stringify(products),
            firstName: details.firstName,
            conditions: details.conditions,
            businessReg: details.businessReg,
            businessName: details.businessName,
            businessType: details.businessType,
            contactNumber: details.contactNumber
          }
        }
      })

      const response = await $fetch<{ data?: string, url?: string }>('/api/checkout', {
        method: 'POST',
        body: {
          email: details.email,
          source: import.meta.client ? window.location.href : '',
          total: total.value,
          session_id: sessionId.value,
          type: 'mobile'
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
    ready,
    searching,
    basketBusy,
    checkingOut,
    lookingUp,
    error,
    total,
    inBasket,
    ensureSession,
    search,
    findNumber,
    addToBasket,
    removeFromBasket,
    lookupCompany,
    saveCompany,
    checkout
  }
}
