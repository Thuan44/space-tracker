import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTokenStore } from '@/stores/token'
import { redirectIfAuthenticated, requireAuth } from './guards'

describe('redirectIfAuthenticated', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('redirects to / when a token is already stored', () => {
    useTokenStore().login('existing-token')

    expect(redirectIfAuthenticated()).toBe('/')
  })

  it('allows navigation when there is no token', () => {
    expect(redirectIfAuthenticated()).toBeUndefined()
  })
})

describe('requireAuth', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('redirects to /login when there is no token', () => {
    expect(requireAuth()).toBe('/login')
  })

  it('allows navigation when a token is already stored', () => {
    useTokenStore().login('existing-token')

    expect(requireAuth()).toBeUndefined()
  })
})
