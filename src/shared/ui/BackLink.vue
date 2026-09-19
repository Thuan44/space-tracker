<script setup lang="ts">
defineProps<{ to: string }>()
</script>

<template>
  <RouterLink
    :to="to"
    class="text-data font-semibold uppercase tracking-label text-info hover:underline"
  >
    <span aria-hidden="true">&larr;</span> <slot />
  </RouterLink>
</template>
