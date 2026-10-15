<script setup lang="ts">
import type { CheckoutDetails, CompanyHit } from '../composables/useMobileShop'

const open = useState('mobile-basket-open', () => false)
const step = useState<'items' | 'details'>('mobile-basket-step', () => 'items')

const {
  basket,
  basketBusy,
  total,
  companies,
  lookingUp,
  checkingOut,
  error,
  removeFromBasket,
  lookupCompany,
  saveCompany,
  checkout
} = useMobileShop()

const companyQuery = ref('')
const form = reactive<CheckoutDetails>({
  firstName: '',
  lastName: '',
  email: '',
  contactNumber: '',
  address: '',
  city: '',
  postCode: '',
  businessType: '',
  businessName: '',
  businessReg: '',
  news: false,
  conditions: false
})

const businessTypes = [
  { label: 'Sole Trader', value: 'soleTrader' },
  { label: 'Company', value: 'company' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Charity', value: 'charity' },
  { label: 'Government', value: 'government' }
]
const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
const showCompanyFields = computed(() => form.businessType === 'company')
const showBusinessName = computed(() => form.businessType !== '' && form.businessType !== 'soleTrader')
const businessNameLabel = computed(() => {
  switch (form.businessType) {
    case 'company': return 'Company name'
    case 'partnership': return 'Partnership name'
    case 'charity': return 'Charity name'
    case 'government': return 'Agency name'
    default: return 'Business name'
  }
})

watch(() => form.businessType, (type) => {
  if (type !== 'company') {
    form.businessReg = ''
    companyQuery.value = ''
    companies.value = []
  }
  if (type === '' || type === 'soleTrader') form.businessName = ''
})

const title = computed(() => step.value === 'items' ? 'Basket' : 'Your details')
const description = computed(() => (
  step.value === 'items'
    ? 'Review the numbers in your order.'
    : 'Tell us where to deliver the number.'
))

function formatPrice(value: number) {
  return money.format(Number(value) || 0)
}

async function onLookup() {
  if (!companyQuery.value.trim()) return
  await lookupCompany(companyQuery.value.trim())
}

function streetAddress(hit: CompanyHit) {
  const address = hit.address
  if (!address) return ''
  return [address.premises, address.address_line_1, address.address_line_2]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(', ')
}

async function chooseCompany(hit: CompanyHit) {
  form.businessName = hit.title
  form.businessReg = hit.company_number
  form.address = streetAddress(hit)
  form.city = hit.address?.locality?.trim() || ''
  form.postCode = hit.address?.postal_code?.trim() || ''
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
  <USlideover
    v-model:open="open"
    :title="title"
    :description="description"
  >
      <template #body>
        <UAlert
          v-if="error"
          class="mb-4"
          color="error"
          variant="subtle"
          :title="error"
        />

        <div
          v-show="step === 'items'"
          class="flex flex-col gap-4"
        >
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
                color="error"
                variant="outline"
                size="sm"
                :disabled="basketBusy"
                @click="removeFromBasket(item.id)"
              >
                Remove
              </UButton>
            </li>
          </ul>
          <div class="flex items-center justify-between border-t border-default pt-4">
            <span class="text-sm text-muted">Total</span>
            <span class="text-lg font-semibold text-highlighted">{{ formatPrice(total) }}</span>
          </div>
          <UButton
            size="lg"
            block
            :disabled="!basket.length"
            @click="step = 'details'"
          >
            Checkout
          </UButton>
        </div>

        <form
          v-show="step === 'details'"
          class="flex flex-col gap-4"
          @submit.prevent="onCheckout"
        >
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            class="w-fit"
            @click="step = 'items'"
          >
            Back to basket
          </UButton>
          <UFormField label="Business type">
            <USelect
              v-model="form.businessType"
              :items="businessTypes"
              placeholder="Business type"
              class="w-full"
            />
          </UFormField>
          <template v-if="showCompanyFields">
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
          </template>
          <UFormField
            v-if="showBusinessName"
            :label="businessNameLabel"
          >
            <UInput
              v-model="form.businessName"
              class="w-full"
            />
          </UFormField>
          <UFormField
            v-if="showCompanyFields"
            label="Company reg number"
          >
            <UInput
              v-model="form.businessReg"
              class="w-full"
            />
          </UFormField>
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
</template>
