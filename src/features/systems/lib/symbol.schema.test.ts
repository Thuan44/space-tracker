import { describe, it, expect } from 'vitest'
import { symbolSchema } from './symbol.schema'

describe('symbolSchema', () => {
  it('parses a valid uppercase system symbol', () => {
    const result = symbolSchema.safeParse('X1-DF55')

    expect(result.success).toBe(true)
    expect(result.data).toBe('X1-DF55')
  })

  it('normalizes a mixed-case symbol to the same uppercase value', () => {
    const result = symbolSchema.safeParse('x1-df55')

    expect(result.success).toBe(true)
    expect(result.data).toBe('X1-DF55')
  })

  it('fails when there is no hyphen', () => {
    const result = symbolSchema.safeParse('X1DF55')

    expect(result.success).toBe(false)
  })

  it('fails on a waypoint-shaped symbol with an extra segment', () => {
    const result = symbolSchema.safeParse('X1-DF55-A1')

    expect(result.success).toBe(false)
  })

  it('fails on an empty string', () => {
    const result = symbolSchema.safeParse('')

    expect(result.success).toBe(false)
  })
})
