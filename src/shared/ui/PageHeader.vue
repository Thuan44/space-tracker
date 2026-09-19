<script setup lang="ts">
import TypewriterText from './TypewriterText.vue'

withDefaults(defineProps<{ title: string; typewriter?: boolean }>(), { typewriter: false })
</script>

<template>
  <div>
    <div class="flex items-center gap-4">
      <h1 v-if="typewriter" class="text-[28px] font-semibold tracking-[0.02em] text-accent">
        <TypewriterText :text="title" />
      </h1>
      <h1 v-else class="text-[20px] font-semibold uppercase tracking-[0.06em] text-accent">
        {{ title }}
      </h1>
      <slot name="badge" />
    </div>
    <slot name="description" />
  </div>
</template>
