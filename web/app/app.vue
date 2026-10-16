<script setup lang="ts">
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

const { shopLink } = useMobileSearchQuery()
const nav = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Telephone', to: '/telephone-numbers' },
  { label: 'Mobile', to: shopLink.value }
])

const route = useRoute()
const basketOpen = useState('mobile-basket-open', () => false)
const basketStep = useState<'items' | 'details'>('mobile-basket-step', () => 'items')
const landlineOpen = useState('landline-basket-open', () => false)
const landlineStep = useState<'items' | 'details'>('landline-basket-step', () => 'items')
const { basket } = useMobileShop()
const { basket: landlineBasket } = useLandlineShop()
const onMobilePage = computed(() => route.path === '/mobile-numbers' || route.path.startsWith('/mobile-numbers/'))
const onTelephonePage = computed(() => route.path === '/telephone-numbers' || route.path.startsWith('/telephone-numbers/'))

function openBasket() {
  basketStep.value = 'items'
  basketOpen.value = true
}

function openLandlineBasket() {
  landlineStep.value = 'items'
  landlineOpen.value = true
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 rounded-md -ms-1 p-1 focus-visible:outline-3 focus-visible:outline-primary/25"
        >
          <img
            src="/logo.png"
            alt=""
            class="size-9"
          >
          <span class="text-base font-semibold text-highlighted">British Numbers</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="nav" />

      <template #right>
        <UButton
          v-if="onMobilePage"
          color="neutral"
          variant="ghost"
          icon="i-lucide-shopping-bag"
          @click="openBasket"
        >
          Basket
          <span class="ms-1 text-xs text-muted">{{ basket.length }}</span>
        </UButton>
        <UButton
          v-if="onTelephonePage"
          color="neutral"
          variant="ghost"
          icon="i-lucide-shopping-bag"
          @click="openLandlineBasket"
        >
          Basket
          <span class="ms-1 text-xs text-muted">{{ landlineBasket.length }}</span>
        </UButton>
        <UColorModeButton />
      </template>
    </UHeader>

    <ClientOnly>
      <MobileBasketDrawer v-if="onMobilePage" />
      <TelephoneBasketDrawer v-if="onTelephonePage" />
    </ClientOnly>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #top>
        <UContainer>
          <div class="flex flex-col gap-2 py-8">
            <h2 class="text-lg font-semibold text-highlighted">
              Need a hand?
            </h2>
            <p class="max-w-2xl text-sm text-muted">
              Our super helpful team is always a call away on
              <a
                href="tel:03337893330"
                class="text-primary font-medium"
              >0333 789 3330</a>
              or email us
              <a
                href="mailto:info@britishnumbers.com"
                class="text-primary font-medium"
              >info@britishnumbers.com</a>
            </p>
          </div>
        </UContainer>
      </template>

      <template #left>
        <p class="text-sm text-muted">
          Bona Fides Solutions Ltd © All rights reserved
        </p>
      </template>

      <template #right>
        <UButton
          to="https://www.facebook.com/britishnumbers/"
          target="_blank"
          icon="i-simple-icons-facebook"
          aria-label="Facebook"
          color="neutral"
          variant="ghost"
        />
        <UButton
          to="https://www.instagram.com/britishnumbers/"
          target="_blank"
          icon="i-simple-icons-instagram"
          aria-label="Instagram"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
