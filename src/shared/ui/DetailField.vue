<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <div>
    <span class="block text-label-lg font-semibold uppercase tracking-label text-muted">{{
      label
    }}</span>
    <div class="mt-1">
      <slot />
    </div>
  </div>
</template>
