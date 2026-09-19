import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { QueryClient } from '@tanstack/vue-query'
import { logout } from './logout'
import { useTokenStore } from '@/stores/token'

describe('logout', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('clears the query cache and logs out the token store', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['agent'], { symbol: 'AGENT' })
    useTokenStore().login('some-token')

    await logout(queryClient)

    expect(queryClient.getQueryData(['agent'])).toBeUndefined()
    expect(useTokenStore().token).toBeNull()
  })
})
