<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { SignOut, Sparkles } from '@primeicons/vue'
import { useMotionStore } from '@/stores/motion'
import { logout } from '@/features/auth/lib/logout'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const motionStore = useMotionStore()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Systems', to: '/systems' },
  { label: 'Fleet', to: '/fleet' },
]

const motionToggleLabel = computed(() => (motionStore.reduced ? 'Enable motion' : 'Reduce motion'))

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}

async function handleLogout() {
  await logout(queryClient)
  router.push('/login')
}
</script>

<template>
  <header class="flex h-16 items-center justify-between border-b border-line bg-surface-0 px-8">
    <div class="flex items-center gap-8">
      <RouterLink to="/" class="text-2xl font-semibold uppercase tracking-[0.08em] text-fg">
        Space Tracker
      </RouterLink>

      <nav class="flex items-center gap-1" aria-label="Main navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="rounded-sm px-3 py-1.5 text-base"
          :class="
            isActive(item.to) ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:text-fg'
          "
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        :aria-label="motionToggleLabel"
        :aria-pressed="!motionStore.reduced"
        :title="motionToggleLabel"
        class="relative cursor-pointer rounded-sm border p-1.5 hover:text-fg"
        :class="motionStore.reduced ? 'border-line text-muted' : 'border-accent/40 text-accent'"
        @click="motionStore.toggle()"
      >
        <Sparkles class="size-4" />
        <span
          v-if="motionStore.reduced"
          aria-hidden="true"
          class="absolute inset-0 m-auto h-px w-4 rotate-45 bg-muted"
        />
      </button>

      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        class="cursor-pointer rounded-sm border border-line p-1.5 text-muted hover:text-fg"
        @click="handleLogout"
      >
        <SignOut class="size-4" />
      </button>
    </div>
  </header>
</template>
