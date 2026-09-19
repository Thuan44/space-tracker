import { QueryCache, QueryClient } from '@tanstack/vue-query'
import router from '@/router'
import { useTokenStore } from '@/stores/token'
import { ApiError } from '@/shared/api/api-error'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30_000

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.kind !== 'network' && error.kind !== 'server' && error.kind !== 'rate-limit') {
    return false
  }
  return failureCount < MAX_RETRIES
}

export function retryDelay(failureCount: number, error: unknown): number {
  if (error instanceof ApiError && error.kind === 'rate-limit' && error.retryAfterMs !== undefined) {
    return error.retryAfterMs
  }
  return Math.min(BASE_DELAY_MS * 2 ** failureCount, MAX_DELAY_MS)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay,
    },
  },
  queryCache: new QueryCache({
    onError(error) {
      if (error instanceof ApiError && error.kind === 'auth') {
        useTokenStore().logout()
        router.push('/login')
      }
    },
  }),
})
