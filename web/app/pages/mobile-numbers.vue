<script setup lang="ts">
import type { CheckoutDetails, CompanyHit, MobileMatch } from '../composables/useMobileShop'

useSeoMeta({
  title: 'Mobile numbers · British Numbers',
  description: 'Search memorable and custom UK mobile numbers, add them to your basket, and check out.'
})

const {
  error,
  ready,
  searching,
  results,
  basket,
  basketBusy,
  total,
  companies,
  lookingUp,
  checkingOut,
  inBasket,
  ensureSession,
  search,
  addToBasket,
  removeFromBasket,
  lookupCompany,
  saveCompany,
  checkout
} = useMobileShop()
const query = ref('')
const match = ref<MobileMatch>('number')
const companyQuery = ref('')
const showCheckout = ref(false)

const form = reactive<CheckoutDetails>({
  firstName: '',
  lastName: '',
  email: '',
  contactNumber: '',
  address: '',
  city: '',
  postCode: '',
  businessType: 'Sole Trader',
  businessName: '',
  businessReg: '',
  news: false,
  conditions: false
})

const matchOptions = [
  { label: 'First part', value: 'prefix' },
  { label: 'Anywhere', value: 'number' },
  { label: 'Last part', value: 'last_six' }
]

const businessTypes = ['Sole Trader', 'Company', 'Partnership', 'Charity', 'Government']

const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

function formatPrice(value: number) {
  return money.format(Number(value) || 0)
}

onMounted(() => {
  ensureSession()
})

async function onSearch() {
  await search(query.value, match.value)
}

async function onLookup() {
  if (!companyQuery.value.trim()) return
  await lookupCompany(companyQuery.value.trim())
}

async function chooseCompany(hit: CompanyHit) {
  form.businessName = hit.title
  form.businessReg = hit.company_number
  if (hit.address_snippet) form.address = hit.address_snippet
  companies.value = []
  try {
    await saveCompany(hit)
  } catch {
    // The lead still stores the company fields if the side record fails.
  }
}

async function onCheckout() {
  await checkout(form)
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

    <div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-highlighted">
            Numbers
          </h2>
          <p class="text-sm text-muted">
            {{ results.length }} shown
          </p>
        </div>

        <UCard v-if="!results.length">
          <p class="text-sm text-muted">
            Search to see available numbers. Purchase does not guarantee availability. We don't recommend sharing or marketing the number until completion of delivery.
          </p>
        </UCard>

        <ul
          v-else
          class="flex flex-col gap-2"
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
      </section>

      <aside class="lg:sticky lg:top-4">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">
                Basket
              </h2>
              <span class="text-sm text-muted">{{ basket.length }}</span>
            </div>
          </template>

          <p
            v-if="!basket.length"
            class="text-sm text-muted"
          >
            You're just a few clicks away from your new number.
          </p>
          <ul
            v-else
            class="flex flex-col gap-3"
          >
            <li
              v-for="item in basket"
              :key="item.id"
              class="flex items-center justify-between gap-3"
            >
              <div>
                <p class="font-medium text-highlighted">
                  {{ item.number }}
                </p>
                <p class="text-sm text-muted">
                  {{ formatPrice(item.price) }}
                </p>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="basketBusy"
                @click="removeFromBasket(item.id)"
              >
                Remove
              </UButton>
            </li>
          </ul>

          <template #footer>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">Total</span>
              <span class="text-lg font-semibold text-highlighted">{{ formatPrice(total) }}</span>
            </div>
            <UButton
              class="mt-4 w-full"
              size="lg"
              :disabled="!basket.length"
              @click="showCheckout = true"
            >
              Proceed to checkout
            </UButton>
          </template>
        </UCard>
      </aside>
    </div>

    <USlideover
      v-model:open="showCheckout"
      title="Review order and connect"
      description="Tell us where to deliver the number."
    >
      <template #body>
        <form
          class="flex flex-col gap-4"
          @submit.prevent="onCheckout"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="First name"
              required
            >
              <UInput
                v-model="form.firstName"
                required
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Last name"
              required
            >
              <UInput
                v-model="form.lastName"
                required
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Email"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Contact number"
            required
          >
            <UInput
              v-model="form.contactNumber"
              type="tel"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Address"
            required
          >
            <UInput
              v-model="form.address"
              required
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="City"
              required
            >
              <UInput
                v-model="form.city"
                required
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Post code"
              required
            >
              <UInput
                v-model="form.postCode"
                required
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Business type">
            <USelect
              v-model="form.businessType"
              :items="businessTypes"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Search by company name or number">
            <div class="flex gap-2">
              <UInput
                v-model="companyQuery"
                placeholder="Lookup a registered business"
                class="w-full"
                @keydown.enter.prevent="onLookup"
              />
              <UButton
                type="button"
                color="neutral"
                variant="outline"
                :loading="lookingUp"
                @click="onLookup"
              >
                Lookup
              </UButton>
            </div>
          </UFormField>
          <ul
            v-if="companies.length"
            class="max-h-40 overflow-auto rounded-md border border-default"
          >
            <li
              v-for="hit in companies"
              :key="hit.company_number"
            >
              <button
                type="button"
                class="w-full px-3 py-2 text-left hover:bg-elevated"
                @click="chooseCompany(hit)"
              >
                <span class="block text-sm font-medium text-highlighted">{{ hit.title }}</span>
                <span class="block text-xs text-muted">{{ hit.company_number }} · {{ hit.address_snippet }}</span>
              </button>
            </li>
          </ul>
          <UFormField label="Business name">
            <UInput
              v-model="form.businessName"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Company reg number">
            <UInput
              v-model="form.businessReg"
              class="w-full"
            />
          </UFormField>
          <UCheckbox
            v-model="form.news"
            label="Contact me about new offers"
          />
          <UCheckbox
            v-model="form.conditions"
            required
            label="Accept Terms & Conditions"
          />
          <p class="text-sm text-muted">
            Basket total {{ formatPrice(total) }}
          </p>
          <UButton
            type="submit"
            size="lg"
            block
            :loading="checkingOut"
            :disabled="!form.conditions || !basket.length"
          >
            Pay now
          </UButton>
        </form>
      </template>
    </USlideover>
  </UContainer>
</template>
