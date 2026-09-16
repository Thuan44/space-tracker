import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTokenStore } from './token'

describe('useTokenStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with no token when sessionStorage is empty', () => {
    expect(useTokenStore().token).toBeNull()
  })

  it('initializes from an existing sessionStorage value', () => {
    sessionStorage.setItem('token', 'existing-token')

    expect(useTokenStore().token).toBe('existing-token')
  })

  it('login sets the token and writes it to sessionStorage', () => {
    const store = useTokenStore()

    store.login('new-token')

    expect(store.token).toBe('new-token')
    expect(sessionStorage.getItem('token')).toBe('new-token')
  })

  it('logout clears the token and removes it from sessionStorage', () => {
    const store = useTokenStore()
    store.login('new-token')

    store.logout()

    expect(store.token).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })
})
