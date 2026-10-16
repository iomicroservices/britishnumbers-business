<script setup lang="ts">
useSeoMeta({
  title: 'Checkout completed successfully',
  description: 'Please check your email for further information.',
  ogTitle: 'Checkout completed successfully',
  ogDescription: 'Please check your email for further information.',
  robots: 'noindex, nofollow'
})

const { clearSession: clearMobileSession } = useMobileShop()
const { clearSession: clearLandlineSession } = useLandlineShop()

onMounted(() => {
  clearMobileSession()
  clearLandlineSession()
})

const next = [
  {
    icon: 'i-lucide-mail-open',
    title: 'Check your email',
    description: 'Please check your email for further information about your order.',
    highlightColor: 'success' as const
  },
  {
    icon: 'i-lucide-headset',
    title: 'We will follow up',
    description: 'A member of the team will get in touch if we need anything else.',
    highlightColor: 'primary' as const
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="Success! Check your email for more info"
      description="Thank you for your business - please check your email for further information. A member of the team will get in touch if we need anything else."
      :links="[{
        label: 'Return to homepage',
        to: '/',
        size: 'xl',
        icon: 'i-lucide-house',
        trailingIcon: 'i-lucide-arrow-right'
      }]"
    >
      <template #headline>
        <UBadge
          color="success"
          variant="subtle"
          size="lg"
          icon="i-lucide-circle-check"
        >
          Checkout complete
        </UBadge>
      </template>
    </UPageHero>

    <UPageSection>
      <UPageGrid>
        <UPageCard
          v-for="step in next"
          :key="step.title"
          :icon="step.icon"
          :title="step.title"
          :description="step.description"
          :highlight-color="step.highlightColor"
          spotlight
          highlight
        />
      </UPageGrid>
    </UPageSection>
  </div>
</template>
