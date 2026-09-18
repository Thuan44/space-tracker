<script setup lang="ts">
import { toRef } from 'vue'
import { useCountUp } from '@/shared/composables/useCountUp'

const props = defineProps<{ value: number; duration?: number }>()
const display = useCountUp(toRef(props, 'value'), props.duration)
</script>

<template>
  <slot :value="display">{{ display }}</slot>
</template>
