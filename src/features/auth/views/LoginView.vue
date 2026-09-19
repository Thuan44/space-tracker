<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useTokenStore } from '@/stores/token'
import { getAgent } from '@/features/auth/api/agent'
import { getErrorMessage } from '@/shared/lib/error-message'

const DEFAULT_ERROR_MESSAGE = 'Invalid token. Please check and try again.'

const router = useRouter()
const tokenStore = useTokenStore()
const queryClient = useQueryClient()

const tokenInput = ref('')
const pending = ref(false)
const error = ref<string | null>(null)

function clearError() {
  error.value = null
}

async function handleSubmit() {
  pending.value = true
  error.value = null

  try {
    await getAgent({ token: tokenInput.value })
    queryClient.clear()
    tokenStore.login(tokenInput.value)
    router.push('/')
  } catch (err) {
    error.value = getErrorMessage(err, DEFAULT_ERROR_MESSAGE)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-8">
    <div class="w-full max-w-sm rounded-md border border-line bg-surface-1 p-5">
      <h1 class="text-2xl font-semibold uppercase tracking-[0.08em] text-fg">Space Tracker</h1>

      <form class="mt-6" @submit.prevent="handleSubmit">
        <label for="token" class="text-label font-semibold uppercase tracking-label text-muted">
          Enter your agent token
        </label>
        <input
          id="token"
          v-model="tokenInput"
          type="text"
          placeholder="Paste your token here"
          required
          :disabled="pending"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          class="mt-2 block w-full rounded-sm border border-line bg-surface-0 px-3 py-2 text-data text-fg placeholder-muted focus:border-accent focus:outline-none disabled:opacity-60"
          @input="clearError"
        />

        <p v-if="error" role="alert" class="mt-2 text-data text-danger">
          {{ error }}
        </p>

        <p class="mt-3 text-data text-muted">
          Don't have a token?
          <a
            href="https://my.spacetraders.io/login"
            target="_blank"
            rel="noopener"
            class="text-info hover:underline"
          >
            Create an agent &rarr;
          </a>
        </p>

        <button
          type="submit"
          :disabled="pending"
          class="mt-5 h-10 w-full cursor-pointer rounded-sm bg-accent text-data font-semibold text-surface-0 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ pending ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>
