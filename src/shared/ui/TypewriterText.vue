<script setup lang="ts">
import { toRef } from 'vue'
import { useTypewriter } from '@/shared/composables/useTypewriter'

const props = defineProps<{ text: string }>()
const display = useTypewriter(toRef(props, 'text'))
</script>

<template>
  <span class="sr-only">{{ text }}</span>
  <span aria-hidden="true">{{ display }}</span>
</template>
