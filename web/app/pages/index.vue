<script setup lang="ts">
useSeoMeta({
  title: 'British Numbers',
  description: 'Take your customer calls to the next level with solutions made for small business success.'
})

const products = [
  {
    title: 'Memorable mobile numbers',
    description: 'Explore the largest range of memorable and custom mobile numbers for sale in the UK. We have something for everyone. You can always submit a custom request if you can\'t find what you\'re looking for.',
    icon: 'i-lucide-smartphone',
    to: '/mobile-numbers',
    action: 'Buy mobile number'
  },
  {
    title: 'Virtual landline numbers',
    description: 'Super-competitive and feature-rich telephone numbers made for business. Enjoy tonnes of features to help run your business professionally. Choose from local, freephone or national numbers, and select the number you like most.',
    icon: 'i-lucide-phone',
    to: '/telephone-numbers',
    action: 'Subscribe today'
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="Take your customer calls to the next level with solutions made for small business success"
      description="Ensure you're always connected to your customers with our virtual landline numbers and managed call handling services, designed with small business in mind. Experience the freedom and flexibility to grow your business, backed by our commitment to outstanding service and innovative solutions at unbeatable prices."
      :links="[{
        label: 'Telephone numbers',
        to: '/telephone-numbers',
        size: 'xl',
        trailingIcon: 'i-lucide-arrow-right'
      }, {
        label: 'Mobile numbers',
        to: '/mobile-numbers',
        size: 'xl',
        color: 'neutral',
        variant: 'outline'
      }]"
    />

    <UPageSection>
      <div class="grid gap-6 md:grid-cols-2">
        <UCard
          v-for="product in products"
          :key="product.to"
        >
          <div class="flex h-full flex-col gap-4">
            <UIcon
              :name="product.icon"
              class="size-8 text-primary"
            />
            <h2 class="text-xl font-semibold text-highlighted">
              {{ product.title }}
            </h2>
            <p class="text-sm leading-6 text-muted">
              {{ product.description }}
            </p>
            <UButton
              :to="product.to"
              class="mt-auto w-fit"
              trailing-icon="i-lucide-chevron-right"
            >
              {{ product.action }}
            </UButton>
          </div>
        </UCard>
      </div>
    </UPageSection>
  </div>
</template>
