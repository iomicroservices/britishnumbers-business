<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 500)

useSeoMeta({
  title: () => `${statusCode.value} · British Numbers`,
  description: () => props.error?.statusMessage || 'This page could not be found.'
})
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
