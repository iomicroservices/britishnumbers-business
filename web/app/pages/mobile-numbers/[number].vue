<script setup lang="ts">
import type { MobileNumber } from '../../composables/useMobileShop'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80'

const route = useRoute()
const {
  error,
  ready,
  basket,
  basketBusy,
  inBasket,
  ensureSession,
  findNumber,
  addToBasket,
  removeFromBasket
} = useMobileShop()

const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const item = ref<MobileNumber | null>(null)
const loading = ref(true)
const missing = ref(false)
const lookupError = ref('')

const digits = computed(() => {
  const raw = String(route.params.number || '')
  return /^\d{10,11}$/.test(raw) ? raw : ''
})

const formattedNumber = computed(() => item.value ? formatNumber(item.value.number) : '')
const formattedPrice = computed(() => item.value ? money.format(Number(item.value.price) || 0) : '')
const deliveryDays = computed(() => {
  const days = Number(item.value?.delivery)
  if (!Number.isFinite(days) || days < 0) return null
  return Math.round(days)
})
const deliveryText = computed(() => {
  const count = deliveryDays.value
  if (count == null) return ''
  return count === 1 ? '1 business day' : `${count} business days`
})
const deliveryDate = computed(() => {
  const count = deliveryDays.value
  if (count == null) return ''
  const date = addBusinessDays(londonToday(), count)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date).replace(',', '')
})
const deliveryEta = computed(() => {
  if (!deliveryDate.value) return ''
  return `Delivered by ${deliveryDate.value}`
})

useSeoMeta({
  title: computed(() => formattedNumber.value ? `${formattedNumber.value} · British Numbers` : 'Mobile number · British Numbers'),
  description: computed(() => {
    if (!item.value) return 'Memorable UK mobile numbers from British Numbers.'
    const timing = deliveryEta.value ? ` ${deliveryEta.value}.` : ''
    return `${formattedNumber.value} is available for ${formattedPrice.value}, paid once.${timing}`
  })
})

function formatNumber(value: string) {
  const clean = value.replace(/\D/g, '')
  if (clean.length !== 11) return value
  return `${clean.slice(0, 5)} ${clean.slice(5)}`
}

function londonToday() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const year = Number(parts.find(part => part.type === 'year')?.value)
  const month = Number(parts.find(part => part.type === 'month')?.value)
  const day = Number(parts.find(part => part.type === 'day')?.value)
  return new Date(year, month - 1, day)
}

function addBusinessDays(start: Date, days: number) {
  const date = new Date(start)
  let remaining = days
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const weekday = date.getDay()
    if (weekday !== 0 && weekday !== 6) remaining -= 1
  }
  return date
}

function removeBasketNumber() {
  if (!item.value) return
  const entry = basket.value.find(row => row.number === item.value?.number)
  if (entry) removeFromBasket(entry.id)
}

const included = [
  {
    title: 'Pay once',
    description: 'The price on this page is the whole cost. There is no monthly charge for the number itself.',
    icon: 'i-lucide-badge-pound-sterling'
  },
  {
    title: 'Yours to keep',
    description: 'Once delivery is complete, the number is yours to use for calls and messages.',
    icon: 'i-lucide-smartphone'
  },
  {
    title: 'Any UK network',
    description: 'Take it to the network you already use. You do not have to switch provider to buy it.',
    icon: 'i-lucide-signal'
  }
]

const steps = [
  {
    title: 'Choose the number',
    description: 'You are looking at the number now. The price and delivery time stay with it through checkout.',
    icon: 'i-lucide-search'
  },
  {
    title: 'Add it to your basket',
    description: 'Keep browsing if you want more than one. The basket stays with you across the mobile shop.',
    icon: 'i-lucide-shopping-bag'
  },
  {
    title: 'Tell us about the business',
    description: 'We ask for the business and a contact so the number can be set up in your name.',
    icon: 'i-lucide-building-2'
  },
  {
    title: 'Pay once',
    description: 'Checkout takes payment for the numbers in the basket. Delivery starts after that.',
    icon: 'i-lucide-credit-card'
  }
]

const questions = computed(() => [
  {
    label: 'Is there a monthly fee?',
    content: 'No. Memorable mobile numbers are a one-off purchase. You pay the price shown here, then use the number on your own network.'
  },
  {
    label: 'How long until I can use it?',
    content: deliveryText.value
      ? `This number is delivered in ${deliveryText.value}. That is the same whether it arrives as a PAC or on a SIM. Please wait until delivery is complete before you put it on a website, a van, or an advert.`
      : 'Delivery is counted in business days and is the same whether the number arrives as a PAC or on a SIM. Please wait until delivery is complete before you put it on a website, a van, or an advert.'
  },
  {
    label: 'Can I keep my current network?',
    content: 'Yes. The number can move to the UK network you already use. You do not need to open a new mobile account with us.'
  },
  {
    label: 'What if this number sells before I pay?',
    content: 'Purchase does not guarantee availability. If it is no longer free when we come to set it up, we will let you know rather than leave you with a number you cannot use.'
  }
])

function lookupMessage(err: unknown) {
  const data = (err as { data?: { error?: string } })?.data?.error
  if (typeof data === 'string' && data) return data
  return 'We could not load this number. Please try again.'
}

async function load() {
  loading.value = true
  missing.value = false
  lookupError.value = ''
  item.value = null
  if (!digits.value) {
    missing.value = true
    loading.value = false
    return
  }
  try {
    const [found] = await Promise.all([
      findNumber(digits.value),
      ensureSession()
    ])
    item.value = found
    missing.value = !found
  } catch (err) {
    item.value = null
    missing.value = false
    lookupError.value = lookupMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  watch(digits, () => {
    load()
  }, { immediate: true })
})

const crumbs = computed(() => [
  { label: 'Mobile numbers', to: '/mobile-numbers' },
  { label: formattedNumber.value || 'Number' }
])
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <UBreadcrumb
        :items="crumbs"
        class="mb-8"
      />

      <UAlert
        v-if="lookupError || error"
        class="mb-6"
        color="error"
        variant="subtle"
        :title="lookupError || error"
      />

      <div
        v-if="loading"
        class="grid items-center gap-8 lg:grid-cols-2"
        aria-busy="true"
      >
        <USkeleton class="aspect-4/3 w-full rounded-xl" />
        <div class="space-y-4">
          <USkeleton class="h-4 w-40" />
          <USkeleton class="h-12 w-72 max-w-full" />
          <USkeleton class="h-8 w-28" />
          <USkeleton class="h-5 w-56" />
          <USkeleton class="h-11 w-40 rounded-md" />
        </div>
      </div>

      <div
        v-else-if="missing"
        class="mx-auto max-w-xl py-8 text-center"
      >
        <UIcon
          name="i-lucide-smartphone"
          class="mx-auto size-10 text-muted"
        />
        <h1 class="mt-4 text-3xl font-semibold text-highlighted">
          This number isn't available
        </h1>
        <p class="mt-3 text-muted">
          It may already have been sold, or the link may be out of date. Search again and pick a number that is still for sale.
        </p>
        <UButton
          to="/mobile-numbers"
          class="mt-6"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
        >
          Search numbers
        </UButton>
      </div>

      <div
        v-else-if="item"
        class="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <img
          :src="HERO_IMAGE"
          alt="A mobile phone"
          width="1600"
          height="1200"
          class="aspect-4/3 w-full rounded-xl object-cover ring ring-default"
        >
        <div>
          <p class="text-sm font-medium text-primary">
            Free delivery · One-off cost
          </p>
          <h1 class="mt-2 text-4xl font-semibold tracking-wide text-highlighted tabular-nums sm:text-5xl">
            {{ formattedNumber }}
          </h1>
          <p class="mt-4 text-3xl font-semibold text-highlighted tabular-nums">
            {{ formattedPrice }}
          </p>
          <p
            v-if="deliveryEta"
            class="mt-4 flex items-center gap-2 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-truck"
              class="size-4 shrink-0 text-primary"
            />
            {{ deliveryEta }}
            <span v-if="deliveryText">· {{ deliveryText }}</span>
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <UButton
              v-if="!inBasket(item.number)"
              icon="i-lucide-plus"
              size="lg"
              :disabled="basketBusy || !ready"
              @click="addToBasket(item)"
            >
              Add to basket
            </UButton>
            <UButton
              v-else
              icon="i-lucide-minus"
              color="error"
              variant="soft"
              size="lg"
              :disabled="basketBusy || !ready"
              @click="removeBasketNumber"
            >
              Remove
            </UButton>
            <UButton
              to="/mobile-numbers"
              color="neutral"
              variant="outline"
              size="lg"
            >
              Keep searching
            </UButton>
          </div>
        </div>
      </div>
    </UContainer>

    <template v-if="item && !loading">
      <UPageSection
        headline="Included"
        title="What you get"
        description="A memorable mobile number, bought once, ready to use once delivery is complete."
      >
        <UPageGrid>
          <UPageCard
            v-for="point in included"
            :key="point.title"
            :title="point.title"
            :description="point.description"
            :icon="point.icon"
            spotlight
          />
        </UPageGrid>
      </UPageSection>

      <UPageSection
        headline="Delivery"
        :title="deliveryText ? `Ready in ${deliveryText}` : 'Delivered in business days'"
        description="The time shown is the same for a PAC and a SIM. Days are business days, and the number should not be advertised until that delivery is finished."
        :features="[
          {
            title: 'Same timing either way',
            description: 'Choose a PAC or a SIM later. This page’s delivery time covers both.',
            icon: 'i-lucide-calendar-clock'
          },
          {
            title: 'We confirm it is still free',
            description: 'Seeing it here means it was available when you opened the page. We check again before it is handed over.',
            icon: 'i-lucide-shield-check'
          },
          {
            title: 'Then it is yours to share',
            description: 'Put it on the website, the van, and the email signature after delivery, not before.',
            icon: 'i-lucide-megaphone'
          }
        ]"
      />

      <UPageSection
        headline="Checkout"
        title="How buying works"
        description="Four short steps from this page to a paid order."
      >
        <div class="grid gap-6 sm:grid-cols-2">
          <UPageCard
            v-for="(step, index) in steps"
            :key="step.title"
            :title="step.title"
            :description="step.description"
            :icon="step.icon"
            variant="subtle"
          >
            <template #header>
              <p class="text-sm font-medium text-primary">
                Step {{ index + 1 }}
              </p>
            </template>
          </UPageCard>
        </div>
      </UPageSection>

      <UPageSection
        headline="Good to know"
        title="Before you use it"
        description="Purchase does not guarantee availability. We don't recommend sharing or marketing the number until completion of delivery."
      >
        <UAccordion :items="questions" />
      </UPageSection>

      <UPageSection
        headline="More numbers"
        title="Similar numbers"
        description="Other numbers from this range will be listed here. Until then, search again and filter by the start or the ending you liked."
      >
        <UPageGrid>
          <UPageCard
            v-for="slot in 3"
            :key="slot"
            title="Coming soon"
            description="A number with a similar start or ending will appear in this space."
            icon="i-lucide-smartphone"
            variant="subtle"
          />
        </UPageGrid>
      </UPageSection>

      <UPageCTA
        title="Want a different number?"
        description="Go back to the shop and search by the digits, the prefix, or the ending you have in mind."
        variant="subtle"
        :links="[{
          label: 'Search numbers',
          to: '/mobile-numbers',
          size: 'lg',
          trailingIcon: 'i-lucide-arrow-right'
        }]"
      />
    </template>
  </div>
</template>
