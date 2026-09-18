import { describe, it, expect } from 'vitest'
import { percentOf } from './spacetraders'

describe('percentOf', () => {
  it('rounds the current/capacity ratio to a percentage', () => {
    expect(percentOf(50, 200)).toBe(25)
  })

  it('returns 0 when capacity is 0', () => {
    expect(percentOf(50, 0)).toBe(0)
  })
})
