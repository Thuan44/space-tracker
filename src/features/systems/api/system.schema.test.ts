import { describe, it, expect } from 'vitest'
import { systemSchema } from './system.schema'

describe('systemSchema', () => {
  it('parses a valid system payload', () => {
    const result = systemSchema.safeParse({
      symbol: 'X1-DF55',
      name: 'Nashira',
      sectorSymbol: 'X1',
      type: 'RED_STAR',
      waypoints: [{ symbol: 'X1-DF55-20250Z' }],
    })

    expect(result.success).toBe(true)
  })

  it('fails when a field breaks the contract', () => {
    const result = systemSchema.safeParse({
      symbol: 'X1-DF55',
      name: 'Nashira',
      sectorSymbol: 'X1',
      type: 42,
      waypoints: [{ symbol: 'X1-DF55-20250Z' }],
    })

    expect(result.success).toBe(false)
  })
})
