import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useMotionStore } from '@/stores/motion'
import { useCountUp } from './useCountUp'

describe('useCountUp', () => {
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

  it('animates from 0 toward the target, and replays when motion is toggled back on', () => {
    const display = useCountUp(ref(100), 200)

    expect(display.value).toBe(0)

    vi.advanceTimersByTime(100)
    expect(display.value).toBeGreaterThan(0)
    expect(display.value).toBeLessThan(100)

    vi.advanceTimersByTime(200)
    expect(display.value).toBe(100)

    const motionStore = useMotionStore()
    motionStore.toggle()
    expect(display.value).toBe(100)

    motionStore.toggle()
    expect(display.value).toBe(0)

    vi.advanceTimersByTime(200)
    expect(display.value).toBe(100)
  })
})
