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
const match = ref<MobileMatch>('prefix')

const matchOptions = [
  { label: 'First part', value: 'prefix' },
  { label: 'Anywhere', value: 'number' },
  { label: 'Last part', value: 'last_six' }
]

const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

function formatPrice(value: number) {
  return money.format(Number(value) || 0)
}

const pageCount = computed(() => Math.max(1, Math.ceil(resultTotal.value / MOBILE_PAGE_SIZE)))
const foundLabel = computed(() => `${resultTotal.value} number${resultTotal.value === 1 ? '' : 's'} found`)

async function showNumbers() {
  await Promise.all([
    ensureSession(),
    search(query.value || '07', match.value)
  ])
}

if (import.meta.client) {
  watch(() => route.path, (path) => {
    if (path === '/mobile-numbers') showNumbers()
  }, { immediate: true })
}

async function onSearch() {
  await search(query.value, match.value, 1)
}

async function goToPage(nextPage: number) {
  if (nextPage === page.value || nextPage < 1 || nextPage > pageCount.value) return
  await search(query.value, match.value, nextPage)
}
</script>

<template>
  <UContainer class="py-10">
    <div class="max-w-3xl">
      <p class="text-sm font-medium text-primary">
        Free delivery · Lifetime ownership · One-off cost
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

    <UCard class="mt-8">
      <form
        class="flex flex-col gap-4"
        @submit.prevent="onSearch"
      >
        <UFormField label="Search by digits">
          <UInput
            v-model="query"
            size="lg"
            placeholder="e.g. 07747 or 123"
            inputmode="numeric"
            class="w-full"
          />
        </UFormField>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <URadioGroup
            v-model="match"
            orientation="horizontal"
            :items="matchOptions"
          />
          <UButton
            type="submit"
            size="lg"
            :loading="searching"
            :disabled="!ready"
          >
            Search
          </UButton>
        </div>
      </form>
    </UCard>

    <section class="mt-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-highlighted">
          Numbers
        </h2>
        <p class="text-sm text-muted">
          {{ foundLabel }}
        </p>
      </div>

      <UCard v-if="!results.length">
        <p class="text-sm text-muted">
          Search to see available numbers. Purchase does not guarantee availability. We don't recommend sharing or marketing the number until completion of delivery.
        </p>
      </UCard>

      <ul
        v-else
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
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
        v-if="resultTotal > 0"
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
</template>
