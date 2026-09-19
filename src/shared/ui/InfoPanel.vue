<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ title: string; icon: Component }>()
</script>

<template>
  <div class="rounded-md border border-line bg-surface-1 p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-data font-semibold uppercase tracking-[0.12em] text-fg">{{ title }}</h2>
      <component :is="icon" class="size-4 text-muted" />
    </div>
    <slot />
  </div>
</template>
