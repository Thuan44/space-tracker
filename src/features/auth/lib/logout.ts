import type { QueryClient } from '@tanstack/vue-query'
import { useTokenStore } from '@/stores/token'

export async function logout(queryClient: QueryClient) {
  await queryClient.cancelQueries()
  queryClient.clear()
  useTokenStore().logout()
}
