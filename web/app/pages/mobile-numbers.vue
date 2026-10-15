<script setup lang="ts">
import { MOBILE_PAGE_SIZE, type MobileMatch } from '../composables/useMobileShop'

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
  basketBusy,
  inBasket,
  ensureSession,
  search,
  addToBasket
} = useMobileShop()
const route = useRoute()
const query = ref('07')
const match = ref<MobileMatch>('number')

const matchOptions = [
  { label: 'Anywhere', value: 'number' },
  { label: 'Prefix', value: 'prefix' },
  { label: 'Ending', value: 'last_six' }
]

const priceOpen = ref(false)
const priceGte = ref('')
const priceLte = ref('')
const appliedGte = ref<number>()
const appliedLte = ref<number>()

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

const pageCount = computed(() => Math.max(1, Math.ceil(resultTotal.value / MOBILE_PAGE_SIZE)))
const foundLabel = computed(() => `${resultTotal.value} number${resultTotal.value === 1 ? '' : 's'} found`)
const hasLoaded = ref(false)
const showSkeleton = computed(() => !hasLoaded.value || (searching.value && results.value.length === 0))

async function showNumbers() {
  try {
    await Promise.all([
      ensureSession(),
      search(query.value || '07', match.value, 1, selectedPrice())
    ])
  } finally {
    hasLoaded.value = true
  }
}

if (import.meta.client) {
  watch(() => route.path, (path) => {
    if (path === '/mobile-numbers') showNumbers()
  }, { immediate: true })
}

const SEARCH_DEBOUNCE_MS = 1000
let searchTimer: ReturnType<typeof setTimeout> | undefined

function clearSearchTimer() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = undefined
}

async function onSearch() {
  clearSearchTimer()
  const term = query.value.replace(/[^A-Za-z0-9,]/g, '')
  if (term.length < 2) return
  try {
    await search(term, match.value, 1, selectedPrice())
  } finally {
    hasLoaded.value = true
  }
}

watch(query, () => {
  clearSearchTimer()
  searchTimer = setTimeout(() => {
    onSearch()
  }, SEARCH_DEBOUNCE_MS)
})

watch(match, () => {
  onSearch()
})

onUnmounted(clearSearchTimer)

async function goToPage(nextPage: number) {
  if (nextPage === page.value || nextPage < 1 || nextPage > pageCount.value) return
  await search(query.value, match.value, nextPage, selectedPrice())
}
</script>

<template>
  <div>
    <form
      class="sticky top-(--ui-header-height) z-40 flex flex-col gap-3 border-b border-default bg-default/75 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:px-6"
      @submit.prevent="onSearch"
    >
      <UInput
        v-model="query"
        size="lg"
        placeholder="Search by digits, e.g. 07747 or 123"
        inputmode="numeric"
        class="w-full sm:flex-1"
        aria-label="Search by digits"
      />
      <USelect
        v-model="match"
        :items="matchOptions"
        size="lg"
        class="w-full sm:w-40"
        aria-label="Search in"
      />
      <UPopover v-model:open="priceOpen">
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
        :class="searching ? 'pointer-events-none opacity-60' : ''"
        :aria-busy="searching"
      >
          <li
            v-for="item in results"
            :key="item.number"
          >
            <UCard :ui="{ body: 'p-4 sm:p-4' }">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-lg font-semibold tracking-wide text-highlighted">
                    {{ item.number }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ formatPrice(item.price) }}
                  </p>
                </div>
                <UButton
                  :color="inBasket(item.number) ? 'neutral' : 'primary'"
                  :variant="inBasket(item.number) ? 'subtle' : 'solid'"
                  :disabled="inBasket(item.number) || basketBusy || !ready"
                  @click="addToBasket(item)"
                >
                  {{ inBasket(item.number) ? 'In basket' : 'Add to basket' }}
                </UButton>
              </div>
            </UCard>
          </li>
        </ul>

      <div
        v-if="showSkeleton"
        class="mt-6 flex justify-center"
      >
        <USkeleton class="h-8 w-72 rounded-md" />
      </div>
      <div
        v-else-if="resultTotal > 0"
        class="mt-6 flex justify-center"
      >
        <UPagination
          :page="page"
          :total="resultTotal"
          :items-per-page="MOBILE_PAGE_SIZE"
          :disabled="searching"
          show-controls
          @update:page="goToPage"
        />
      </div>
    </section>
    </UContainer>
  </div>
</template>
