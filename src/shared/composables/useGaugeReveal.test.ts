import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useMotionStore } from '@/stores/motion'
import { useGaugeReveal } from './useGaugeReveal'

describe('useGaugeReveal', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tracks target changes directly, and resets instantly (no drain) when motion is toggled back on', () => {
    const target = ref(30)
    const { revealed, instant } = useGaugeReveal(target)

    target.value = 80
    expect(revealed.value).toBe(80)

    const motionStore = useMotionStore()
    motionStore.toggle() // reduced on -> snaps instantly
    expect(revealed.value).toBe(80)
    expect(instant.value).toBe(true)

    motionStore.toggle() // reduced off -> replay resets to 0 without transitioning
    expect(revealed.value).toBe(0)
    expect(instant.value).toBe(true)
  })
})
