import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMotionStore } from './motion'

describe('useMotionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to the OS preference, or the stored value when one is present', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    expect(useMotionStore().reduced).toBe(true)

    localStorage.setItem('reduced-motion', 'false')
    setActivePinia(createPinia())
    expect(useMotionStore().reduced).toBe(false)
  })

  it('toggle flips the flag and persists it to localStorage', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    const store = useMotionStore()

    store.toggle()

    expect(store.reduced).toBe(true)
    expect(localStorage.getItem('reduced-motion')).toBe('true')
  })
})
