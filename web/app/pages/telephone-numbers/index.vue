<script setup lang="ts">
import type { LandlineGrade, LandlineNumber, LandlinePlanId, NumberKind } from '../../composables/useLandlineShop'
import { connectionLabel, formatLandline, LANDLINE_PLANS } from '../../composables/useLandlineShop'
import { readTelephoneSearch, sameTelephoneSearch, telephoneSearchQuery } from '../../composables/useTelephoneSearchQuery'

useSeoMeta({
  title: 'Telephone numbers · British Numbers',
  description: 'Elevate your business with a virtual telephone number from British Numbers. Streamline communication, expand your reach, and empower your brand with our versatile solutions.'
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
  areaCodes,
  inBasket,
  ensureSession,
  loadAreaCodes,
  search,
  refilter,
  addToBasket,
  removeFromBasket
} = useLandlineShop()

const route = useRoute()
const router = useRouter()
const { withSearch } = useTelephoneSearchQuery()
const { isWide } = useWideLayout()
const initialSearch = readTelephoneSearch(route.query)
const kind = ref<NumberKind>(initialSearch.kind)
const areaCode = ref(initialSearch.area)
const grade = ref<LandlineGrade>(initialSearch.grade)
const hasLoaded = ref(false)
const loadingMore = ref(false)
const filtersOpen = ref(false)
const filterSection = ref<HTMLElement | null>(null)
useDismissFilters(filtersOpen, filterSection)
const planOpen = ref(false)
const planPickerOpen = ref(false)
watch(filtersOpen, (value) => {
  if (!value) planPickerOpen.value = false
})
const previewPlan = ref<LandlinePlanId | null>(initialSearch.plan)
const selected = ref<LandlineNumber | null>(null)
const plan = ref<LandlinePlanId>('3')
const destination = ref('')
const switchboard = ref(false)
const team = ref(false)
const whisper = ref(false)
const planError = ref('')

const kindOptions = [
  { label: 'Local', value: '0102' },
  { label: 'National', value: '0333' },
  { label: 'Freephone', value: '0800' }
]

const gradeOptions = [
  { label: 'All', value: 'All' },
  { label: 'Bronze', value: 'Bronze' },
  { label: 'Silver', value: 'Silver' },
  { label: 'Gold', value: 'Gold' },
  { label: 'Diamond', value: 'Platinum' }
]

const areaItems = computed(() => {
  const rows = areaCodes.value.length
    ? [...areaCodes.value]
    : [{ name: 'London', code: '0208', featured: true }]
  if (!rows.some(row => row.code === '0208')) rows.push({ name: 'London', code: '0208', featured: true })
  rows.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name) || a.code.localeCompare(b.code))
  return rows.map(row => ({
    label: row.name.includes(`(${row.code})`) ? row.name : `${row.name} (${row.code})`,
    value: row.code
  }))
})

const isLocal = computed(() => kind.value === '0102')
const kindLabel = computed(() => kindOptions.find(option => option.value === kind.value)?.label ?? 'Local')
const gradeLabel = computed(() => gradeOptions.find(option => option.value === grade.value)?.label ?? 'All')
const heroTitle = computed(() => `Pick your ${kindLabel.value.toLowerCase()} number`)
const heroCopy = computed(() => {
  if (kind.value === '0800') return 'Increase customer enquiries with a number that\'s free to call.'
  if (kind.value === '0333') return 'A national 0333 number your customers can call from anywhere in the UK.'
  return 'Attract local customers across the UK with our virtual landlines.'
})

const activeArea = computed(() => (isLocal.value ? (areaCode.value || '0208') : kind.value))
const foundLabel = computed(() => `${resultTotal.value.toLocaleString('en-GB')} number${resultTotal.value === 1 ? '' : 's'} found`)
const remaining = computed(() => Math.max(0, resultTotal.value - results.value.length))
const remainingLabel = computed(() => `${remaining.value.toLocaleString('en-GB')} number${remaining.value === 1 ? '' : 's'} still to see`)
const showSkeleton = computed(() => !hasLoaded.value || (searching.value && results.value.length === 0))

function planForwarding(id: LandlinePlanId) {
  const freephone = kind.value === '0800'
  if (id === '11') return 'Forward calls for free to your landline or mobile number.'
  if (id === '14') {
    return freephone
      ? 'Forward calls at 1.5p/min from a landline and 6.5p/min from a mobile.'
      : 'Forward calls at 1.5p/minute to your landline or mobile number.'
  }
  return freephone
    ? 'Forward calls at 3p/min from a landline and 8p/min from a mobile.'
    : 'Forward calls at 3p/minute to your landline or mobile number.'
}

const planFeatures = ['switchboard', 'team', 'whisper'] as const

function featureChecked(id: LandlinePlanId, feature: typeof planFeatures[number]) {
  if (id === '14') return true
  if (id === '11') return feature === 'whisper'
  if (feature === 'switchboard') return switchboard.value
  if (feature === 'team') return team.value
  return whisper.value
}

function featureLabel(id: LandlinePlanId, feature: typeof planFeatures[number]) {
  if (id === '3') {
    if (feature === 'switchboard') return 'Switchboard +£6/month'
    if (feature === 'team') return 'Team coverage +£3/month'
    return 'Call whisper +£3/month'
  }
  const state = id === '14' || (id === '11' && feature === 'whisper') ? 'included' : 'n/a'
  if (feature === 'switchboard') return `Switchboard (${state})`
  if (feature === 'team') return `Team coverage (${state})`
  return `Call whisper (${state})`
}

function setFeature(feature: typeof planFeatures[number], value: boolean) {
  if (plan.value !== '3') return
  if (feature === 'switchboard') switchboard.value = value
  else if (feature === 'team') team.value = value
  else whisper.value = value
}

function planShortName(id: LandlinePlanId) {
  if (id === '3') return 'PAYG'
  if (id === '11') return 'Individual'
  return 'Business'
}

const previewChoice = computed(() => LANDLINE_PLANS.find(option => option.id === previewPlan.value))
const previewLabel = computed(() => {
  if (!previewChoice.value) return 'Choose plan'
  return `${planShortName(previewChoice.value.id)} · £${previewChoice.value.monthly}/month`
})
const filterSummary = computed(() => {
  const parts = [kindLabel.value, activeArea.value, gradeLabel.value]
  if (previewChoice.value) parts.push(planShortName(previewChoice.value.id))
  return parts.join(' · ')
})

function connectionFeeLine(price: number) {
  if (!Number(price)) return 'No connection fee'
  return `${connectionLabel(price)} connection fee`
}

const planAddons = computed(() => {
  if (plan.value === '14') {
    return { switchboard: true, team: true, whisper: true }
  }
  if (plan.value === '11') {
    return { switchboard: false, team: false, whisper: true }
  }
  return { switchboard: switchboard.value, team: team.value, whisper: whisper.value }
})

function removeBasketNumber(number: string) {
  const item = basket.value.find(entry => entry.number === number)
  if (item) removeFromBasket(item.id)
}

let resetting = false
let syncing = false

function currentParams() {
  return {
    kind: kind.value,
    area: areaCode.value,
    grade: grade.value,
    plan: previewPlan.value
  }
}

function publishSearch() {
  if (route.path !== '/telephone-numbers') return
  const next = telephoneSearchQuery(currentParams())
  const current = telephoneSearchQuery(readTelephoneSearch(route.query))
  if (sameTelephoneSearch(next, current)) return
  return router.replace({ path: '/telephone-numbers', query: next })
}

async function showNumbers(nextPage = 1, append = false) {
  await search(activeArea.value, grade.value, nextPage, append)
  hasLoaded.value = true
}

async function loadMore() {
  if (searching.value || remaining.value <= 0) return
  loadingMore.value = true
  try {
    await showNumbers(page.value + 1, true)
  } finally {
    loadingMore.value = false
  }
}

function resetFilters() {
  resetting = true
  kind.value = '0333'
  areaCode.value = '0208'
  grade.value = 'All'
  previewPlan.value = null
  planPickerOpen.value = false
  nextTick(() => {
    resetting = false
    router.replace({ path: '/telephone-numbers', query: {} })
    showNumbers(1, false)
  })
}

function choosePreview(id: LandlinePlanId) {
  previewPlan.value = id
  planPickerOpen.value = false
}

function openPlan(item: LandlineNumber) {
  selected.value = item
  plan.value = previewPlan.value ?? '3'
  destination.value = ''
  switchboard.value = false
  team.value = false
  whisper.value = false
  planError.value = ''
  planOpen.value = true
}

async function confirmPlan() {
  if (!selected.value) return
  const digits = destination.value.replace(/\D/g, '')
  if (digits.length < 10) {
    planError.value = 'Enter the number calls should divert to.'
    return
  }
  planError.value = ''
  const addons = planAddons.value
  await addToBasket({
    number: selected.value.number,
    price: selected.value.price,
    plan: plan.value,
    destination: digits,
    numberType: kind.value,
    switchboard: addons.switchboard,
    team: addons.team,
    whisper: addons.whisper
  })
  if (!error.value) planOpen.value = false
}

watch([kind, areaCode], () => {
  if (resetting || syncing) return
  publishSearch()
  showNumbers(1, false)
}, { flush: 'sync' })

watch(grade, () => {
  if (resetting || syncing) return
  publishSearch()
  if (refilter(grade.value)) return
  showNumbers(1, false)
}, { flush: 'sync' })

watch(previewPlan, () => {
  if (resetting || syncing) return
  publishSearch()
}, { flush: 'sync' })

watch(() => route.fullPath, () => {
  if (route.path !== '/telephone-numbers') return
  const next = readTelephoneSearch(route.query)
  if (sameTelephoneSearch(telephoneSearchQuery(next), telephoneSearchQuery(currentParams()))) return
  const previous = currentParams()
  syncing = true
  kind.value = next.kind
  areaCode.value = next.area
  grade.value = next.grade
  previewPlan.value = next.plan
  syncing = false
  const searchChanged = next.kind !== previous.kind || next.area !== previous.area || next.grade !== previous.grade
  if (!searchChanged) return
  if (next.kind === previous.kind && next.area === previous.area && refilter(next.grade)) return
  showNumbers(1, false)
})

onMounted(() => {
  ensureSession()
  loadAreaCodes()
  showNumbers()
})
</script>

<template>
  <div>
    <div class="sticky top-(--ui-header-height) z-40 border-b border-default bg-default/75 backdrop-blur-sm lg:hidden">
      <UContainer class="py-3">
        <Teleport
          to="#shop-search-slot"
          :disabled="!isWide"
        >
          <div class="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-center lg:gap-2">
            <div
              ref="filterSection"
              class="contents"
            >
            <div class="flex items-center gap-2 lg:contents">
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                :size="isWide ? 'md' : 'lg'"
                icon="i-lucide-sliders-horizontal"
                :trailing-icon="filtersOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="min-w-0 flex-1 justify-between lg:hidden"
                :aria-expanded="filtersOpen"
                @click="filtersOpen = !filtersOpen"
              >
                <span class="truncate">{{ filterSummary }}</span>
              </UButton>
              <UButton
                type="button"
                icon="i-lucide-rotate-ccw"
                color="error"
                variant="soft"
                :size="isWide ? 'md' : 'lg'"
                square
                aria-label="Reset"
                class="shrink-0 lg:order-6"
                @click="resetFilters"
              />
            </div>

            <div
              class="flex-col gap-3 overflow-anchor-none lg:contents"
              :class="filtersOpen ? 'flex' : 'hidden'"
            >
              <USelect
                v-model="kind"
                :items="kindOptions"
                :size="isWide ? 'md' : 'lg'"
                class="w-full lg:order-2 lg:w-36"
                aria-label="Number type"
              />
              <USelectMenu
                v-if="isLocal"
                v-model="areaCode"
                :items="areaItems"
                value-key="value"
                :size="isWide ? 'md' : 'lg'"
                class="w-full lg:order-3 lg:w-52"
                aria-label="Area code"
              />
              <USelect
                v-model="grade"
                :items="gradeOptions"
                :size="isWide ? 'md' : 'lg'"
                class="w-full lg:order-4 lg:w-40"
                aria-label="Collection"
              />
              <UPopover
                v-model:open="planPickerOpen"
                class="w-full lg:order-5 lg:w-auto"
                :content="{ align: 'start', collisionPadding: 16, sideOffset: 8 }"
                :ui="{ content: 'max-w-[calc(100vw-2rem)]' }"
              >
                <UButton
                  color="neutral"
                  variant="outline"
                  :size="isWide ? 'md' : 'lg'"
                  trailing
                  trailing-icon="i-lucide-chevron-down"
                  class="relative w-full justify-start text-left lg:w-48"
                  :ui="{
                    base: 'px-3 py-2 pe-10 text-base/5 font-normal text-highlighted md:text-sm',
                    trailingIcon: `${planPickerOpen ? 'rotate-180' : ''} pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-dimmed transition-transform`
                  }"
                  :aria-expanded="planPickerOpen"
                >
                  <span class="truncate">{{ previewLabel }}</span>
                </UButton>
                <template #content>
                  <div class="flex w-[min(20rem,calc(100vw-2rem))] flex-col text-left">
                    <div class="flex max-h-[min(24rem,calc(100dvh-8rem))] flex-col gap-2 overflow-y-auto p-3">
                      <button
                        v-for="option in LANDLINE_PLANS"
                        :key="option.id"
                        type="button"
                        class="rounded-md border px-3 py-3 text-left transition"
                        :class="previewPlan === option.id ? 'border-primary bg-primary/10' : 'border-default hover:bg-elevated'"
                        @click="choosePreview(option.id)"
                      >
                        <span class="block text-left font-medium text-highlighted">{{ option.name }}</span>
                        <span class="mt-0.5 block text-left text-sm text-muted">£{{ option.monthly }}/month</span>
                        <span class="mt-2 block text-left text-sm text-muted">{{ planForwarding(option.id).replace(' to your landline or mobile number', '') }}</span>
                      </button>
                    </div>
                    <div class="border-t border-default p-3">
                      <UButton
                        :to="withSearch('/telephone-numbers/pricing')"
                        color="info"
                        block
                        trailing-icon="i-lucide-arrow-right"
                      >
                        Pricing details
                      </UButton>
                    </div>
                  </div>
                </template>
              </UPopover>
              <UTooltip class="lg:order-1 lg:shrink-0">
                <UButton
                  icon="i-lucide-info"
                  color="info"
                  variant="soft"
                  :size="isWide ? 'md' : 'lg'"
                  :square="isWide"
                  class="w-full justify-start lg:w-auto"
                  aria-label="Number types"
                >
                  <span class="lg:hidden">Number types</span>
                </UButton>
                <template #content>
                  Local numbers use an area code. National numbers are 0333. Freephone numbers are 0800.
                </template>
              </UTooltip>
            </div>
            </div>
          </div>
        </Teleport>
      </UContainer>
    </div>

    <UContainer class="py-10">
      <div class="max-w-3xl">
        <p class="text-sm font-medium text-primary">
          From £3/month · No contract · Cancel anytime
        </p>
        <h1 class="mt-2 text-3xl font-semibold text-highlighted sm:text-4xl">
          {{ heroTitle }}
        </h1>
        <p class="mt-3 text-muted">
          {{ heroCopy }}
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
            v-else-if="hasLoaded"
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
            <UCard :ui="{ body: 'p-3 sm:p-4' }">
              <USkeleton class="h-6 w-48" />
            </UCard>
          </li>
        </ul>

        <UCard v-else-if="hasLoaded && !results.length">
          <p class="text-sm text-muted">
            No numbers in this collection right now.
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
              class="bg-elevated"
              :ui="{ root: 'ring-0', body: 'p-0 sm:p-0' }"
            >
              <div class="flex items-stretch">
                <div class="flex min-w-0 flex-1 flex-col justify-center border-y border-s border-default px-3 py-3 sm:px-4">
                  <p class="truncate text-xl font-semibold tabular-nums tracking-wide text-highlighted sm:text-lg xl:text-xl">
                    {{ formatLandline(item.number, activeArea) }}
                    <span
                      v-if="previewChoice"
                      class="text-base font-medium text-muted sm:text-sm xl:text-base"
                    >· £{{ previewChoice.monthly }}/month</span>
                  </p>
                  <p class="truncate text-base text-muted sm:text-sm xl:text-base">
                    {{ connectionFeeLine(item.price) }}
                  </p>
                </div>
                <button
                  type="button"
                  class="group flex w-16 shrink-0 items-center justify-center border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-current disabled:cursor-not-allowed disabled:opacity-60"
                  :class="inBasket(item.number) ? 'border-success/10 bg-success/10 text-success lg:hover:border-error/10 lg:hover:bg-error/10 lg:hover:text-error lg:focus-visible:border-error/10 lg:focus-visible:bg-error/10 lg:focus-visible:text-error' : 'border-primary/10 bg-primary/10 text-primary hover:border-primary/15 hover:bg-primary/15'"
                  :aria-label="inBasket(item.number) ? 'Remove from basket' : 'Choose a plan'"
                  :disabled="basketBusy || !ready"
                  @click="inBasket(item.number) ? removeBasketNumber(item.number) : openPlan(item)"
                >
                  <UIcon
                    v-if="!inBasket(item.number)"
                    name="i-lucide-plus"
                    class="size-6"
                  />
                  <template v-else>
                    <UIcon
                      name="i-lucide-x"
                      class="size-5 lg:hidden"
                    />
                    <span class="hidden w-full place-items-center lg:inline-grid">
                      <UIcon
                        name="i-lucide-check"
                        class="col-start-1 row-start-1 size-6 group-hover:invisible group-focus-visible:invisible"
                      />
                      <span class="invisible col-start-1 row-start-1 text-xs font-semibold group-hover:visible group-focus-visible:visible">
                        Remove?
                      </span>
                    </span>
                  </template>
                </button>
              </div>
            </UCard>
          </li>
          <li
            v-if="remaining > 0"
            class="sm:col-span-2 lg:col-span-1 lg:col-start-2"
          >
            <UCard
              as="button"
              type="button"
              class="w-full rounded-full bg-success text-left text-white ring-success transition hover:bg-success/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-success disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-950"
              :disabled="searching && !loadingMore"
              :ui="{ body: 'p-3 sm:p-4' }"
              @click="loadMore"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="min-w-0 truncate text-base font-semibold tracking-wide whitespace-nowrap sm:text-lg">
                  {{ loadingMore ? 'Loading…' : 'Load more' }}
                  <span class="text-sm font-medium text-white/80 dark:text-slate-950/80">· {{ remainingLabel }}</span>
                </span>
                <UIcon
                  :name="loadingMore ? 'i-lucide-loader-circle' : 'i-lucide-chevron-down'"
                  class="size-5 shrink-0"
                  :class="loadingMore ? 'animate-spin' : 'animate-bounce motion-reduce:animate-none'"
                />
              </div>
            </UCard>
          </li>
        </ul>
      </section>
    </UContainer>

    <UModal
      v-model:open="planOpen"
      title="Select your plan"
      description="1 month rolling. Cancel anytime."
    >
      <template #body>
        <div
          v-if="selected"
          class="flex flex-col gap-4"
        >
          <p class="text-lg font-semibold text-highlighted">
            {{ formatLandline(selected.number, activeArea) }}
            <span class="text-sm font-medium text-muted">· {{ connectionLabel(selected.price) }} connection</span>
          </p>

          <div class="grid gap-2">
            <div
              v-for="option in LANDLINE_PLANS"
              :key="option.id"
              class="overflow-hidden rounded-md border text-left transition"
              :class="plan === option.id ? 'border-primary bg-primary/10' : 'border-default'"
            >
              <button
                type="button"
                class="w-full px-3 py-3 text-left"
                :class="plan === option.id ? '' : 'hover:bg-elevated'"
                @click="plan = option.id"
              >
                <span class="block font-medium text-highlighted">{{ option.name }}</span>
                <span class="block text-sm text-muted">£{{ option.monthly }}/month</span>
              </button>
              <div
                v-if="plan === option.id"
                class="flex flex-col gap-2 px-3 pb-3"
              >
                <p class="text-sm text-muted">
                  {{ planForwarding(option.id) }}
                </p>
                <div class="flex flex-col gap-2">
                  <UCheckbox
                    v-for="feature in planFeatures"
                    :key="feature"
                    :model-value="featureChecked(option.id, feature)"
                    :disabled="option.id !== '3'"
                    :label="featureLabel(option.id, feature)"
                    @update:model-value="setFeature(feature, Boolean($event))"
                  />
                </div>
              </div>
            </div>
          </div>

          <UFormField
            label="Divert my calls to"
            required
          >
            <UInput
              v-model="destination"
              type="tel"
              placeholder="Landline or mobile"
              class="w-full"
            />
          </UFormField>
          <p class="text-sm text-muted">
            You can divert to more numbers later from the control panel.
          </p>
          <UAlert
            v-if="planError"
            color="error"
            variant="subtle"
            :title="planError"
          />
          <UButton
            size="lg"
            block
            :loading="basketBusy"
            :disabled="!ready"
            @click="confirmPlan"
          >
            Add to basket
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
