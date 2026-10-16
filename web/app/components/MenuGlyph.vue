<script setup lang="ts">
defineProps<{
  open: boolean
}>()
</script>

<template>
  <span
    class="relative block h-3.5 w-4"
    aria-hidden="true"
  >
    <span
      class="absolute inset-x-0 top-0 h-0.5 origin-center rounded-full bg-current transition-transform duration-300 ease-in-out"
      :class="open ? 'translate-y-1.5 rotate-45' : ''"
    />
    <span
      class="absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-current transition-opacity duration-200 ease-in-out"
      :class="open ? 'opacity-0' : 'opacity-100'"
    />
    <span
      class="absolute inset-x-0 top-3 h-0.5 origin-center rounded-full bg-current transition-transform duration-300 ease-in-out"
      :class="open ? '-translate-y-1.5 -rotate-45' : ''"
    />
  </span>
</template>
