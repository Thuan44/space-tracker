<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant: 'info' | 'accent' | 'muted' | 'dashed'
  to?: string
}>()

const VARIANT_CLASSES: Record<typeof props.variant, string> = {
  info: 'border-info/40 text-info hover:bg-info/10',
  accent: 'border-accent/30 bg-accent/10 text-accent',
  muted: 'border-line bg-surface-2 text-muted',
  dashed: 'border-dashed border-line text-muted italic opacity-70',
}

const variantClass = computed(() => VARIANT_CLASSES[props.variant])
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'span'"
    :to="to"
    class="rounded-full border px-2.5 py-0.5 text-label font-semibold uppercase tracking-label"
    :class="variantClass"
  >
    <slot />
  </component>
</template>
