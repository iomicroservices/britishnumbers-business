<script setup lang="ts">
import type { LandlinePlanId } from '../../composables/useLandlineShop'

useSeoMeta({
  title: 'Telephone plan pricing',
  description: 'PAYG, Individual, and Business plans for virtual landline numbers. From £3/month, no contract, cancel anytime.'
})

const { withSearch } = useTelephoneSearchQuery()

const freeFeatures = [
  'Welcome announcement',
  'Missed call alerts',
  'Call statistics',
  'Holiday settings',
  'WhatsApp Business',
  'Voicemail',
  'Blacklist numbers',
  'Control panel',
  '100% uptime'
].map(title => ({ title, icon: 'i-lucide-check' }))

function browse(plan: LandlinePlanId, primary = false) {
  return {
    label: 'Browse numbers',
    to: withSearch('/telephone-numbers', plan),
    color: primary ? 'primary' as const : 'neutral' as const,
    variant: primary ? 'solid' as const : 'outline' as const
  }
}

const plans = computed(() => [
  {
    title: 'PAYG',
    price: '£3',
    billingPeriod: '/month',
    description: 'Forward calls at 3p/minute to your landline or mobile number.',
    button: browse('3'),
    terms: '1 month rolling. Cancel anytime.',
    features: [
      { title: 'Switchboard +£6/month', icon: 'i-lucide-plus' },
      { title: 'Team coverage +£3/month', icon: 'i-lucide-plus' },
      { title: 'Call whisper +£3/month', icon: 'i-lucide-plus' },
      ...freeFeatures
    ]
  },
  {
    title: 'Business',
    price: '£14',
    billingPeriod: '/month',
    description: 'Forward calls at 1.5p/minute to your landline or mobile number.',
    badge: 'Full package',
    highlight: true,
    scale: true,
    button: browse('14', true),
    terms: '1 month rolling. Cancel anytime.',
    features: [
      { title: 'Switchboard (included)', icon: 'i-lucide-check' },
      { title: 'Team coverage (included)', icon: 'i-lucide-check' },
      { title: 'Call whisper (included)', icon: 'i-lucide-check' },
      ...freeFeatures
    ]
  },
  {
    title: 'Individual',
    price: '£11',
    billingPeriod: '/month',
    description: 'Forward calls for free to your landline or mobile number.',
    button: browse('11'),
    terms: '1 month rolling. Cancel anytime.',
    features: [
      { title: 'Call whisper (included)', icon: 'i-lucide-check' },
      { title: 'Switchboard (n/a)', icon: 'i-lucide-minus' },
      { title: 'Team coverage (n/a)', icon: 'i-lucide-minus' },
      ...freeFeatures
    ]
  }
])
</script>

<template>
  <div>
    <UPageHero
      headline="From £3/month · No contract · Cancel anytime"
      title="Select your plan"
      description="We understand that every business is unique. That's why we've designed flexible, affordable pricing packages to suit your specific needs. Whether you're a solo entrepreneur or a growing business, our plans are crafted to give you the professional edge and the flexibility you need."
    />

    <UPageSection>
      <UPricingPlans
        :plans="plans"
        scale
      />
    </UPageSection>
  </div>
</template>
