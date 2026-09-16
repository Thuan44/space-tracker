import { useTokenStore } from '@/stores/token'

export function redirectIfAuthenticated() {
  const tokenStore = useTokenStore()
  if (tokenStore.token) return '/'
}
