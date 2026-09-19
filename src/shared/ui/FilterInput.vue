<script setup lang="ts">
defineProps<{ modelValue: string; placeholder: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    type="text"
    :placeholder="placeholder"
    :aria-label="placeholder"
    class="block w-full max-w-sm rounded-sm border border-line bg-surface-0 px-3 py-2 text-data text-fg placeholder-muted focus:border-accent focus:outline-none"
  />
</template>
