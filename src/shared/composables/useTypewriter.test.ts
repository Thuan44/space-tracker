import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useMotionStore } from '@/stores/motion'
import { useTypewriter } from './useTypewriter'

describe('useTypewriter', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reveals the text one character at a time, and replays when motion is toggled back on', () => {
    const display = useTypewriter(ref('ABC'), 20)

    expect(display.value).toBe('')

    vi.advanceTimersByTime(20)
    expect(display.value).toBe('A')

    vi.advanceTimersByTime(20)
    expect(display.value).toBe('AB')

    vi.advanceTimersByTime(20)
    expect(display.value).toBe('ABC')

    const motionStore = useMotionStore()
    motionStore.toggle()
    expect(display.value).toBe('ABC')

    motionStore.toggle()
    expect(display.value).toBe('')

    vi.advanceTimersByTime(60)
    expect(display.value).toBe('ABC')
  })
})
