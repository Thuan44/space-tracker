<script setup lang="ts">
defineProps<{ heightClass: string }>()
</script>

<template>
  <div class="animate-pulse rounded-md border border-line bg-surface-1" :class="heightClass" />
</template>
