<script setup lang="ts">
import { computed } from 'vue'
import type { Ship } from '../api/ship.schema'
import { toReadableText } from '@/shared/lib/spacetraders'

const props = defineProps<{ status: Ship['nav']['status'] }>()

const STATUS_CLASSES: Record<Ship['nav']['status'], string> = {
  DOCKED: 'border-accent/30 bg-accent/10 text-accent',
  IN_TRANSIT: 'border-warn/30 bg-warn/10 text-warn',
  IN_ORBIT: 'border-info/30 bg-info/10 text-info',
}
const FALLBACK_CLASS = 'border-line bg-surface-2 text-muted'

const statusClass = computed(() => STATUS_CLASSES[props.status] ?? FALLBACK_CLASS)
</script>

<template>
  <span
    class="rounded-xs border px-2 py-0.5 text-[14px] font-semibold uppercase tracking-label"
    :class="statusClass"
  >
    {{ toReadableText(status) }}
  </span>
</template>
