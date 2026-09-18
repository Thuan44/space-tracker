<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ label: string; icon: Component }>()
</script>

<template>
  <div
    class="flex h-[124px] flex-col justify-between rounded-md border border-line bg-surface-1 p-5"
  >
    <div class="flex items-center justify-between">
      <span class="text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">{{
        label
      }}</span>
      <component :is="icon" class="size-4 text-muted" />
    </div>
    <slot />
  </div>
</template>
