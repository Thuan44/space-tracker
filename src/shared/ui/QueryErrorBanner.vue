<script setup lang="ts">
import { computed } from 'vue'
import { ApiError } from '@/shared/api/api-error'
import { getErrorMessage } from '@/shared/lib/error-message'

const props = withDefaults(
  defineProps<{
    error: unknown
    fallbackMessage: string
    heightClass?: string
  }>(),
  { heightClass: 'h-16' },
)

defineEmits<{ retry: [] }>()

const message = computed(() => getErrorMessage(props.error, props.fallbackMessage))
const showRetry = computed(() => {
  const kind = props.error instanceof ApiError ? props.error.kind : undefined
  return kind !== 'auth' && kind !== 'not-found'
})
</script>

<template>
  <div
    class="flex items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5"
    :class="heightClass"
  >
    <p class="text-data text-danger">{{ message }}</p>
    <button
      v-if="showRetry"
      type="button"
      class="h-8 cursor-pointer rounded-sm border border-line px-3 text-data text-fg hover:bg-surface-2"
      @click="$emit('retry')"
    >
      Retry
    </button>
  </div>
</template>
