<script setup lang="ts">
import type { MobileMatch } from '../../composables/useMobileShop'
import { mobileSearchQuery, readMobileSearch, sameMobileSearch, type MobileSearchMode } from '../../composables/useMobileSearchQuery'

useSeoMeta({
  title: 'Mobile numbers · British Numbers',
  description: 'Search memorable and custom UK mobile numbers, add them to your basket, and check out.'
})

const {
  error,
  ready,
  searching,
  results,
  page,
  resultTotal,
  basket,
  basketBusy,
  inBasket,
  ensureSession,
  search,
  addToBasket,
  removeFromBasket
} = useMobileShop()
type SearchMode = MobileSearchMode

function cleanPart(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, '').slice(0, 11)
}

const route = useRoute()
const router = useRouter()
const { withSearch } = useMobileSearchQuery()
const initialSearch = readMobileSearch(route.query)
const initialParts = initialSearch.q.split(',')
const query = ref(initialSearch.mode === 'multi' ? '07' : initialSearch.q)
const mode = ref<SearchMode>(initialSearch.mode)
const starts = ref(initialSearch.mode === 'multi' ? cleanPart(initialParts[0] || '') : '')
const contains = ref(initialSearch.mode === 'multi' ? cleanPart(initialParts[1] || '') : '')
const ends = ref(initialSearch.mode === 'multi' ? cleanPart(initialParts[2] || '') : '')

const matchOptions = [
  { label: 'Anywhere', value: 'number' },
  { label: 'Multi-search', value: 'multi' },
  { label: 'Prefix', value: 'prefix' },
  { label: 'Ending', value: 'last_six' }
]

function multiTerm() {
  return [cleanPart(starts.value), cleanPart(contains.value), cleanPart(ends.value)].join(',')
}

function apiMatch(): MobileMatch {
  return mode.value === 'multi' ? 'number' : mode.value
}

function currentTerm() {
  if (mode.value === 'multi') return multiTerm()
  return query.value.replace(/[^A-Za-z0-9,]/g, '')
}

const priceOpen = ref(false)
const filtersOpen = ref(false)
const modeLabel = computed(() => matchOptions.find(option => option.value === mode.value)?.label ?? 'Anywhere')
const priceGte = ref(initialSearch.min != null ? String(initialSearch.min) : '')
const priceLte = ref(initialSearch.max != null ? String(initialSearch.max) : '')
const appliedGte = ref<number | undefined>(initialSearch.min)
const appliedLte = ref<number | undefined>(initialSearch.max)

function parsePrice(value: string | number | null | undefined) {
  if (value == null || value === '') return undefined
  const parsed = Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function selectedPrice() {
  return { gte: appliedGte.value, lte: appliedLte.value }
}

const priceLabel = computed(() => {
  const min = appliedGte.value
  const max = appliedLte.value
  if (min == null && max == null) return 'Any price'
  if (min != null && max != null) return `£${min} – £${max}`
  if (min != null) return `From £${min}`
  return `Up to £${max}`
})

function applyPrice() {
  appliedGte.value = parsePrice(priceGte.value)
  appliedLte.value = parsePrice(priceLte.value)
  priceOpen.value = false
  onSearch()
}

const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

function formatPrice(value: number) {
  return money.format(Number(value) || 0)
}

function formatNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return `${digits.slice(0, 5)} ${digits.slice(5)}`
}

function removeBasketNumber(number: string) {
  const item = basket.value.find(entry => entry.number === number)
  if (item) removeFromBasket(item.id)
}

const foundLabel = computed(() => {
  const count = resultTotal.value.toLocaleString('en-GB')
  return `${count} number${resultTotal.value === 1 ? '' : 's'} found`
})
const remaining = computed(() => Math.max(0, resultTotal.value - results.value.length))
const remainingLabel = computed(() => `${remaining.value.toLocaleString('en-GB')} number${remaining.value === 1 ? '' : 's'} still to see`)
const hasLoaded = ref(false)
const showSkeleton = computed(() => !hasLoaded.value || (searching.value && results.value.length === 0))

let applyingMode = false
let resetting = false

function currentParams() {
  return {
    q: currentTerm() || '07',
    mode: mode.value,
    min: appliedGte.value,
    max: appliedLte.value
  }
}

function syncFromRoute() {
  const next = readMobileSearch(route.query)
  const parts = next.q.split(',')
  applyingMode = true
  mode.value = next.mode
  if (next.mode === 'multi') {
    starts.value = cleanPart(parts[0] || '')
    contains.value = cleanPart(parts[1] || '')
    ends.value = cleanPart(parts[2] || '')
  } else {
    query.value = next.q
  }
  appliedGte.value = next.min
  appliedLte.value = next.max
  priceGte.value = next.min != null ? String(next.min) : ''
  priceLte.value = next.max != null ? String(next.max) : ''
  applyingMode = false
}

async function showNumbers() {
  try {
    await Promise.all([
      ensureSession(),
      search(currentTerm() || '07', apiMatch(), 1, selectedPrice())
    ])
  } finally {
    hasLoaded.value = true
  }
}

if (import.meta.client) {
  watch(() => route.fullPath, () => {
    if (route.path !== '/mobile-numbers') return
    if (!sameMobileSearch(mobileSearchQuery(readMobileSearch(route.query)), mobileSearchQuery(currentParams()))) {
      syncFromRoute()
    }
    showNumbers()
  }, { immediate: true })
}

const SEARCH_DEBOUNCE_MS = 1000
let searchTimer: ReturnType<typeof setTimeout> | undefined

function clearSearchTimer() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = undefined
}

function scheduleSearch() {
  clearSearchTimer()
  searchTimer = setTimeout(() => {
    onSearch()
  }, SEARCH_DEBOUNCE_MS)
}

async function onSearch() {
  clearSearchTimer()
  const term = currentTerm()
  const hasDigits = term.replace(/[^A-Za-z0-9]/g, '').length > 0
  if (!hasDigits || (mode.value !== 'multi' && term.length < 2)) return
  const next = mobileSearchQuery(currentParams())
  const current = mobileSearchQuery(readMobileSearch(route.query))
  if (route.path === '/mobile-numbers' && sameMobileSearch(next, current)) {
    await showNumbers()
    return
  }
  await router.replace({ path: '/mobile-numbers', query: next })
}

watch(query, () => {
  if (applyingMode || mode.value === 'multi') return
  scheduleSearch()
}, { flush: 'sync' })

watch([starts, contains, ends], () => {
  if (applyingMode || mode.value !== 'multi') return
  scheduleSearch()
}, { flush: 'sync' })

function resetFilters() {
  resetting = true
  applyingMode = true
  clearSearchTimer()
  priceOpen.value = false
  priceGte.value = ''
  priceLte.value = ''
  appliedGte.value = undefined
  appliedLte.value = undefined
  starts.value = ''
  contains.value = ''
  ends.value = ''
  query.value = '07'
  mode.value = 'number'
  applyingMode = false
  resetting = false
  onSearch()
}

watch(mode, (next, prev) => {
  if (resetting || applyingMode) return
  applyingMode = true
  if (next === 'multi' && prev !== 'multi') {
    const parts = query.value.replace(/[^A-Za-z0-9,]/g, '').split(',')
    if (parts.length > 1) {
      starts.value = cleanPart(parts[0] || '')
      contains.value = cleanPart(parts[1] || '')
      ends.value = cleanPart(parts[2] || '')
    } else {
      starts.value = ''
      contains.value = cleanPart(parts[0] || '')
      ends.value = ''
    }
  } else if (prev === 'multi' && next !== 'multi') {
    if (next === 'number') {
      query.value = multiTerm()
    } else if (next === 'prefix') {
      query.value = cleanPart(starts.value) || cleanPart(contains.value) || cleanPart(ends.value)
    } else {
      query.value = cleanPart(ends.value) || cleanPart(contains.value) || cleanPart(starts.value)
    }
  }
  applyingMode = false
  onSearch()
}, { flush: 'sync' })

onUnmounted(clearSearchTimer)

const loadingMore = ref(false)

async function loadMore() {
  if (searching.value || remaining.value <= 0) return
  loadingMore.value = true
  try {
    await search(currentTerm(), apiMatch(), page.value + 1, selectedPrice(), true)
  } finally {
    loadingMore.value = false
  }
}
</script>

<template>
  <div>
    <form
      class="sticky top-(--ui-header-height) z-40 border-b border-default bg-default/75 backdrop-blur-sm"
      @submit.prevent="onSearch"
    >
      <UContainer class="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <div class="flex items-center justify-between gap-3 sm:contents">
        <UTooltip class="shrink-0 sm:order-1">
          <UButton
            :to="withSearch('/mobile-numbers/search-guide')"
            icon="i-lucide-info"
            color="info"
            variant="soft"
            size="lg"
            square
            aria-label="Search guide"
          />
          <template #content>
            <span>Match the start, middle, or end to pinpoint your number. </span>
            <NuxtLink
              :to="withSearch('/mobile-numbers/search-guide')"
              class="font-medium underline"
            >
              Search guide
            </NuxtLink>
          </template>
        </UTooltip>
        <UButton
          type="button"
          icon="i-lucide-rotate-ccw"
          color="error"
          variant="soft"
          size="lg"
          class="sm:order-5"
          @click="resetFilters"
        >
          Reset
        </UButton>
      </div>
      <div class="w-full min-w-0 sm:order-2 sm:flex-1">
        <div
          v-if="mode === 'multi'"
          class="grid grid-cols-3 gap-2"
        >
          <UInput
            v-model="starts"
            size="lg"
            placeholder="Starts"
            inputmode="numeric"
            maxlength="11"
            class="min-w-0"
            aria-label="Starts"
          />
          <UInput
            v-model="contains"
            size="lg"
            placeholder="Contains"
            inputmode="numeric"
            maxlength="11"
            class="min-w-0"
            aria-label="Contains"
          />
          <UInput
            v-model="ends"
            size="lg"
            placeholder="Ends"
            inputmode="numeric"
            maxlength="11"
            class="min-w-0"
            aria-label="Ends"
          />
        </div>
        <UInput
          v-else
          v-model="query"
          icon="i-lucide-search"
          size="lg"
          placeholder="Search by digits, e.g. 07747 or 123"
          inputmode="numeric"
          class="w-full"
          aria-label="Search by digits"
        />
      </div>
      <div class="flex flex-col gap-3 sm:contents">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-sliders-horizontal"
          :trailing-icon="filtersOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="justify-between sm:hidden"
          :aria-expanded="filtersOpen"
          @click="filtersOpen = !filtersOpen"
        >
          {{ modeLabel }} · {{ priceLabel }}
        </UButton>
        <div
          class="flex-col gap-3 sm:contents"
          :class="filtersOpen ? 'flex' : 'hidden sm:contents'"
        >
          <USelect
            v-model="mode"
            :items="matchOptions"
            size="lg"
            class="w-full sm:order-3 sm:w-44"
            aria-label="Search in"
          />
          <UPopover
            v-model:open="priceOpen"
            class="sm:order-4"
          >
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              icon="i-lucide-banknote"
              class="w-full justify-between sm:w-44"
              aria-label="Price"
            >
              {{ priceLabel }}
            </UButton>
            <template #content>
              <div class="flex w-64 flex-col gap-3 p-3">
                <UFormField label="Minimum £">
                  <UInput
                    v-model="priceGte"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Any"
                    class="w-full"
                    @keydown.enter.prevent="applyPrice"
                  />
                </UFormField>
                <UFormField label="Maximum £">
                  <UInput
                    v-model="priceLte"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Any"
                    class="w-full"
                    @keydown.enter.prevent="applyPrice"
                  />
                </UFormField>
                <UButton
                  type="button"
                  block
                  @click="applyPrice"
                >
                  Apply
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      </UContainer>
    </form>

    <UContainer class="py-10">
    <div class="max-w-3xl">
      <p class="text-sm font-medium text-primary">
        Free delivery · One-off cost
      </p>
      <h1 class="mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">
        Express yourself with our range of gold and custom mobile numbers
      </h1>
      <p class="mt-3 text-muted">
        Search by prefix, last six, or the combination you want in your mobile number.
      </p>
    </div>

    <UAlert
      v-if="error"
      class="mt-6"
      color="error"
      variant="subtle"
      :title="error"
    />

    <section class="mt-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-highlighted">
          Numbers
        </h2>
        <USkeleton
          v-if="showSkeleton"
          class="h-4 w-28"
        />
        <p
          v-else
          class="text-sm text-muted"
        >
          {{ foundLabel }}
        </p>
      </div>

      <ul
        v-if="showSkeleton"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
      >
        <li
          v-for="slot in 12"
          :key="slot"
        >
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-2">
                <USkeleton class="h-6 w-36" />
                <USkeleton class="h-4 w-16" />
              </div>
              <USkeleton class="h-8 w-28 rounded-md" />
            </div>
          </UCard>
        </li>
      </ul>

      <UCard v-else-if="!results.length">
        <p class="text-sm text-muted">
          Search to see available numbers. Purchase does not guarantee availability. We don't recommend sharing or marketing the number until completion of delivery.
        </p>
      </UCard>

      <ul
        v-else
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        :aria-busy="searching"
      >
          <li
            v-for="item in results"
            :key="item.number"
            :class="searching && !loadingMore ? 'pointer-events-none opacity-60' : ''"
          >
            <UCard
              class="transition-colors duration-300"
              :class="inBasket(item.number) ? 'bg-info/10 ring-info/25' : 'bg-elevated'"
              :ui="{ body: 'p-3 sm:p-4' }"
            >
              <div class="flex items-center justify-between gap-3">
                <NuxtLink
                  :to="withSearch(`/mobile-numbers/${item.number.replace(/\D/g, '')}`)"
                  class="min-w-0 text-base font-semibold tabular-nums tracking-wide whitespace-nowrap text-highlighted hover:text-primary sm:text-lg"
                >
                  {{ formatNumber(item.number) }}
                  <span class="text-sm font-medium text-muted">· {{ formatPrice(item.price) }}</span>
                </NuxtLink>
                <div class="relative shrink-0">
                  <UButton
                    icon="i-lucide-plus"
                    color="primary"
                    variant="solid"
                    aria-label="Add to basket"
                    :tabindex="inBasket(item.number) ? -1 : 0"
                    :aria-hidden="inBasket(item.number)"
                    class="transition-opacity duration-300"
                    :class="inBasket(item.number) ? 'pointer-events-none opacity-0' : 'opacity-100'"
                    :disabled="!inBasket(item.number) && (basketBusy || !ready)"
                    @click="addToBasket(item)"
                  />
                  <UButton
                    icon="i-lucide-minus"
                    color="error"
                    variant="soft"
                    aria-label="Remove from basket"
                    :tabindex="inBasket(item.number) ? 0 : -1"
                    :aria-hidden="!inBasket(item.number)"
                    class="absolute inset-0 transition-opacity duration-300"
                    :class="inBasket(item.number) ? 'opacity-100' : 'pointer-events-none opacity-0'"
                    :disabled="inBasket(item.number) && (basketBusy || !ready)"
                    @click="removeBasketNumber(item.number)"
                  />
                </div>
              </div>
            </UCard>
          </li>
          <li
            v-if="remaining > 0"
            class="sm:col-span-2 lg:col-span-1 lg:col-start-2"
          >
            <UCard
              class="bg-success text-white ring-success transition hover:bg-success/90 dark:text-slate-950"
              :ui="{ body: 'p-3 sm:p-4' }"
            >
              <div class="flex items-center justify-between gap-3">
                <button
                  type="button"
                  class="min-w-0 truncate text-left text-base font-semibold tracking-wide whitespace-nowrap text-white sm:text-lg dark:text-slate-950"
                  :disabled="searching && !loadingMore"
                  @click="loadMore"
                >
                  {{ loadingMore ? 'Loading…' : 'Load more' }}
                  <span class="text-sm font-medium text-white/80 dark:text-slate-950/80">· {{ remainingLabel }}</span>
                </button>
                <UButton
                  :icon="loadingMore ? undefined : 'i-lucide-chevron-down'"
                  color="success"
                  variant="solid"
                  class="shrink-0"
                  :ui="{ leadingIcon: loadingMore ? '' : 'animate-bounce motion-reduce:animate-none' }"
                  :loading="loadingMore"
                  :disabled="searching && !loadingMore"
                  aria-label="Load more"
                  @click="loadMore"
                />
              </div>
            </UCard>
          </li>
        </ul>
    </section>
    </UContainer>
  </div>
</template>
