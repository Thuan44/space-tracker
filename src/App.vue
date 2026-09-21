<script setup lang="ts">
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import AppHeader from '@/shared/ui/AppHeader.vue'

const route = useRoute()
</script>

<template>
  <AppHeader v-if="route.name !== 'login' && route.name !== 'not-found'" />
  <main>
    <RouterView />
  </main>
  <Toast />
</template>
