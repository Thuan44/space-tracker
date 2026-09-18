<script setup lang="ts">
import { toRef } from 'vue'
import ProgressBar from 'primevue/progressbar'
import { useGaugeReveal } from '@/shared/composables/useGaugeReveal'

const props = withDefaults(
  defineProps<{ percent: number; barWidthClass?: string; label?: string }>(),
  {
    barWidthClass: 'flex-1',
  },
)
const { revealed, instant } = useGaugeReveal(toRef(props, 'percent'))
</script>

<template>
  <div class="flex items-center gap-2">
    <div :class="['h-2 min-w-0', barWidthClass]">
      <ProgressBar
        :value="revealed"
        :show-value="false"
        :aria-label="label"
        :pt="{ value: { style: instant ? { transitionDuration: '0ms' } : undefined } }"
      />
    </div>
    <slot :percent="revealed">
      <span class="w-9 shrink-0 text-right text-[13px] text-muted">{{ revealed }}%</span>
    </slot>
  </div>
</template>
