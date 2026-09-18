import { describe, it, expect } from 'vitest'
import { easeOutCubic } from './easing'

describe('easeOutCubic', () => {
  it('starts at 0', () => {
    expect(easeOutCubic(0)).toBe(0)
  })

  it('ends at 1', () => {
    expect(easeOutCubic(1)).toBe(1)
  })

  it('front-loads progress past the midpoint', () => {
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
  })
})
