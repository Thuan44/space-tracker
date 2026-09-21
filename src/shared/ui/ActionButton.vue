<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  type?: 'button' | 'submit'
  disabled?: boolean
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled"
    class="flex h-10 w-fit shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 text-data font-semibold text-surface-0 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <component :is="icon" v-if="icon" class="size-4" />
    <slot />
  </button>
</template>
