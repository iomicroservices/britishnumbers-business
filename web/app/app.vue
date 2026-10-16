<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'British Numbers'
const description = 'Virtual landline and memorable mobile numbers for small business.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const { shopLink, withSearch: withMobileSearch } = useMobileSearchQuery()
const { shopLink: telephoneLink, withSearch: withTelephoneSearch } = useTelephoneSearchQuery()
const year = new Date().getFullYear()
const nav = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Telephone', to: telephoneLink.value },
  { label: 'Mobile', to: shopLink.value }
])
const footerColumns = computed<FooterColumn[]>(() => [
  {
    label: 'Telephone',
    children: [
      { label: 'Numbers', to: telephoneLink.value },
      { label: 'Pricing', to: withTelephoneSearch('/telephone-numbers/pricing') }
    ]
  },
  {
    label: 'Mobile',
    children: [
      { label: 'Numbers', to: shopLink.value },
      { label: 'Search guide', to: withMobileSearch('/mobile-numbers/search-guide') }
    ]
  },
  {
    label: 'Legal',
    children: [
      { label: 'Terms of Service', to: 'https://britishnumbers.com/terms-of-service', target: '_blank' },
      { label: 'Privacy Policy', to: 'https://britishnumbers.com/privacy-policy', target: '_blank' },
      { label: 'Cookie Policy', to: 'https://britishnumbers.com/cookie-policy', target: '_blank' }
    ]
  }
])
const socials = [
  { label: 'Instagram', icon: 'i-simple-icons-instagram', to: 'https://www.instagram.com/britishnumbers/' },
  { label: 'Facebook', icon: 'i-simple-icons-facebook', to: 'https://facebook.com/britishnumbers' },
  { label: 'X', icon: 'i-simple-icons-x', to: 'https://twitter.com/british_numbers' },
  { label: 'WhatsApp', icon: 'i-simple-icons-whatsapp', to: 'https://wa.me/447919191791' }
]
const payments = [
  { label: 'Visa', icon: 'i-simple-icons-visa' },
  { label: 'Mastercard', icon: 'i-simple-icons-mastercard' },
  { label: 'American Express', icon: 'i-simple-icons-americanexpress' },
  { label: 'Google Pay', icon: 'i-simple-icons-googlepay' },
  { label: 'Apple Pay', icon: 'i-simple-icons-applepay' },
  { label: 'PayPal', icon: 'i-simple-icons-paypal' }
]

const route = useRoute()
const basketOpen = useState('mobile-basket-open', () => false)
const basketStep = useState<'items' | 'details'>('mobile-basket-step', () => 'items')
const landlineOpen = useState('landline-basket-open', () => false)
const landlineStep = useState<'items' | 'details'>('landline-basket-step', () => 'items')
const { basket } = useMobileShop()
const { basket: landlineBasket } = useLandlineShop()
const onMobilePage = computed(() => route.path === '/mobile-numbers' || route.path.startsWith('/mobile-numbers/'))
const onTelephonePage = computed(() => route.path === '/telephone-numbers' || route.path.startsWith('/telephone-numbers/'))
const onShopSearch = computed(() => route.path === '/mobile-numbers' || route.path === '/telephone-numbers')

function openBasket() {
  basketStep.value = 'items'
  basketOpen.value = true
}

function openLandlineBasket() {
  landlineStep.value = 'items'
  landlineOpen.value = true
}

const drawerOpen = ref(false)
const wideMenuOpen = ref(true)
const atTop = ref(true)
let ignoreMenuScroll = false
let menuSettleTimer: ReturnType<typeof setTimeout> | undefined

function onWindowScroll() {
  const atPageTop = window.scrollY <= 0
  if (ignoreMenuScroll) {
    atTop.value = atPageTop
    return
  }
  if (atPageTop && !atTop.value) wideMenuOpen.value = true
  else if (!atPageTop) wideMenuOpen.value = false
  atTop.value = atPageTop
}

function toggleWideMenu() {
  wideMenuOpen.value = !wideMenuOpen.value
  if (!wideMenuOpen.value) return
  ignoreMenuScroll = true
  clearTimeout(menuSettleTimer)
  menuSettleTimer = setTimeout(() => {
    ignoreMenuScroll = false
  }, 400)
}

onMounted(() => {
  if (window.scrollY > 0) {
    wideMenuOpen.value = false
    atTop.value = false
  }
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  onBeforeUnmount(() => {
    clearTimeout(menuSettleTimer)
    window.removeEventListener('scroll', onWindowScroll)
  })
})
</script>

<template>
  <UApp>
    <UHeader
      v-model:open="drawerOpen"
      mode="drawer"
      toggle-side="left"
      :menu="{ direction: 'left', handle: false }"
      :ui="{
        root: 'z-[80] h-auto min-h-(--ui-header-height)',
        container: 'relative h-auto min-h-(--ui-header-height)',
        left: 'flex items-center gap-1.5 lg:flex-none',
        center: 'hidden min-w-0 flex-1 lg:flex lg:items-center',
        right: 'ms-auto flex items-center justify-end gap-1.5 lg:flex-none',
        overlay: 'top-(--ui-header-height)!',
        content: 'top-(--ui-header-height)! bottom-0! h-auto! w-72 rounded-none',
        body: 'flex w-full flex-col items-stretch px-4 py-4'
      }"
    >
      <template #toggle="{ open, toggle }">
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-md text-default hover:bg-elevated focus-visible:outline-3 focus-visible:outline-primary/25 lg:hidden"
          :aria-expanded="open"
          :aria-label="open ? 'Close menu' : 'Open menu'"
          @click="toggle"
        >
          <MenuGlyph :open="open" />
        </button>
      </template>

      <template #left>
        <button
          type="button"
          class="hidden size-9 items-center justify-center rounded-md text-default hover:bg-elevated focus-visible:outline-3 focus-visible:outline-primary/25 lg:inline-flex"
          :aria-expanded="wideMenuOpen"
          aria-controls="site-menu"
          :aria-label="wideMenuOpen ? 'Close menu' : 'Open menu'"
          @click="toggleWideMenu"
        >
          <MenuGlyph :open="wideMenuOpen" />
        </button>
        <NuxtLink
          to="/"
          aria-label="British Numbers"
          class="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md lg:static lg:z-auto lg:translate-x-0 lg:translate-y-0"
        >
          <img
            src="/logo.png"
            alt=""
            class="size-9"
          >
        </NuxtLink>
      </template>

      <div
        v-if="onShopSearch"
        id="shop-search-slot"
        class="flex min-w-0 flex-1 items-center"
      />

      <template #right>
        <UColorModeButton />
        <UButton
          v-if="onMobilePage"
          color="neutral"
          variant="ghost"
          class="gap-1 px-2"
          :aria-label="`Basket, ${basket.length} items`"
          @click="openBasket"
        >
          <UIcon
            name="i-lucide-shopping-bag"
            class="size-5"
          />
          <span class="min-w-4 text-center text-xs tabular-nums text-muted">{{ basket.length }}</span>
        </UButton>
        <UButton
          v-if="onTelephonePage"
          color="neutral"
          variant="ghost"
          class="gap-1 px-2"
          :aria-label="`Basket, ${landlineBasket.length} items`"
          @click="openLandlineBasket"
        >
          <UIcon
            name="i-lucide-shopping-bag"
            class="size-5"
          />
          <span class="min-w-4 text-center text-xs tabular-nums text-muted">{{ landlineBasket.length }}</span>
        </UButton>
      </template>

      <template #body>
        <UNavigationMenu
          orientation="vertical"
          :items="nav"
          class="w-full"
          :ui="{
            root: 'w-full items-stretch',
            list: 'flex w-full flex-col items-stretch gap-1',
            item: 'w-full',
            link: 'w-full justify-start px-1 py-3 text-left text-lg font-medium'
          }"
        />
      </template>

      <template #bottom>
        <div
          id="site-menu"
          class="hidden transition-[grid-template-rows] duration-300 ease-in-out lg:grid"
          :class="wideMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden">
            <div class="border-t border-default">
              <UContainer class="flex items-center justify-center py-2">
                <UNavigationMenu
                  :items="nav"
                  :ui="{ list: 'gap-4' }"
                />
              </UContainer>
            </div>
          </div>
        </div>
      </template>
    </UHeader>

    <ClientOnly>
      <MobileBasketDrawer v-if="onMobilePage" />
      <TelephoneBasketDrawer v-if="onTelephonePage" />
    </ClientOnly>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter
      class="border-t border-default bg-slate-50 dark:bg-elevated"
      :ui="{
        top: 'py-0 lg:py-0',
        container: 'flex flex-col items-center gap-3 py-4 pb-16 lg:flex-row lg:justify-between lg:gap-x-3 lg:py-4 lg:pb-4',
        left: 'flex w-full items-center justify-center lg:w-auto lg:flex-1 lg:justify-start',
        center: 'hidden',
        right: 'flex w-full items-center justify-center lg:w-auto lg:flex-1 lg:justify-end'
      }"
    >
      <template #top>
        <UContainer class="pt-8 pb-2 sm:pt-10">
          <UFooterColumns :columns="footerColumns">
            <template #left>
              <div class="max-w-xs">
                <NuxtLink
                  to="/"
                  class="flex items-center gap-2 rounded-md"
                >
                  <img
                    src="/logo.png"
                    alt=""
                    class="size-9"
                  >
                  <span class="text-base font-semibold text-highlighted">British Numbers</span>
                </NuxtLink>
                <p class="mt-4 text-sm text-muted">
                  Bona Fides Solutions Ltd
                </p>
                <dl class="mt-3 space-y-1 text-sm text-muted">
                  <div class="flex gap-2">
                    <dt>Company</dt>
                    <dd class="text-default">11958241</dd>
                  </div>
                  <div class="flex gap-2">
                    <dt>VAT</dt>
                    <dd class="text-default">GB 429 8509 58</dd>
                  </div>
                </dl>
                <div class="mt-4 flex flex-col gap-1.5 text-sm">
                  <a
                    href="tel:07919191791"
                    class="text-muted hover:text-primary"
                  >Mob 07919 191791</a>
                  <a
                    href="tel:03337893330"
                    class="text-muted hover:text-primary"
                  >Tel 0333 789 3330</a>
                </div>
              </div>
            </template>

            <template #right>
              <div class="flex gap-1">
                  <UButton
                    v-for="social in socials"
                    :key="social.label"
                    :to="social.to"
                    :icon="social.icon"
                    :aria-label="social.label"
                    target="_blank"
                    color="neutral"
                    variant="ghost"
                  />
              </div>
            </template>
          </UFooterColumns>
        </UContainer>
      </template>

      <template #left>
        <p class="text-sm text-muted">
          © {{ year }} British Numbers
        </p>
      </template>

      <template #right>
        <ul
          class="flex max-w-full flex-wrap items-center justify-center gap-3"
          aria-label="Payment methods"
        >
          <li
            v-for="method in payments"
            :key="method.label"
          >
            <span class="sr-only">{{ method.label }}</span>
            <UIcon
              :name="method.icon"
              class="size-6 text-muted"
            />
          </li>
        </ul>
      </template>
    </UFooter>
  </UApp>
</template>
