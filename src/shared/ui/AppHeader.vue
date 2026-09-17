<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTokenStore } from '@/stores/token'

const route = useRoute()
const router = useRouter()
const tokenStore = useTokenStore()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Systems', to: '/systems' },
  { label: 'Fleet', to: '/fleet' },
]

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

function handleLogout() {
  tokenStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="flex h-16 items-center justify-between border-b border-line bg-surface-0 px-8">
    <div class="flex items-center gap-8">
      <RouterLink to="/" class="text-2xl font-semibold uppercase tracking-[0.08em] text-fg">
        Space Tracker
      </RouterLink>

      <nav class="flex items-center gap-1">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="rounded-sm px-3 py-1.5 text-base"
          :class="isActive(item.to) ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:text-fg'">
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <button type="button"
      class="cursor-pointer rounded-sm border border-line px-3 py-1.5 text-base text-muted hover:text-fg"
      @click="handleLogout">
      Log out
    </button>
  </header>
</template>
