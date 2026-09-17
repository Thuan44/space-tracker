import { describe, it, expect } from 'vitest'
import { systemSchema } from './system.schema'

describe('systemSchema', () => {
  it('parses a valid system payload', () => {
    const result = systemSchema.safeParse({
      symbol: 'X1-DF55',
      name: 'Nashira',
      sectorSymbol: 'X1',
      type: 'RED_STAR',
      constellation: 'Ursa Minor',
      x: 10,
      y: -4,
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
      constellation: 'Ursa Minor',
      x: 10,
      y: -4,
      waypoints: [{ symbol: 'X1-DF55-20250Z' }],
    })

    expect(result.success).toBe(false)
  })

  it('fails when x is not a number', () => {
    const result = systemSchema.safeParse({
      symbol: 'X1-DF55',
      name: 'Nashira',
      sectorSymbol: 'X1',
      type: 'RED_STAR',
      constellation: 'Ursa Minor',
      x: '10',
      y: -4,
      waypoints: [{ symbol: 'X1-DF55-20250Z' }],
    })

    expect(result.success).toBe(false)
  })
})
