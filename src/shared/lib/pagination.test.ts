import { describe, it, expect } from 'vitest'
import { getTotalPages } from './pagination'

describe('getTotalPages', () => {
  it('returns the exact quotient for an evenly-divisible total', () => {
    expect(getTotalPages(20, 10)).toBe(2)
  })

  it('rounds up when the total has a remainder', () => {
    expect(getTotalPages(21, 10)).toBe(3)
  })

  it('returns 1 when the total is smaller than one page', () => {
    expect(getTotalPages(5, 10)).toBe(1)
  })

  it('returns 1 when the total is 0', () => {
    expect(getTotalPages(0, 10)).toBe(1)
  })
})
