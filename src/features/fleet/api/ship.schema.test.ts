import { describe, it, expect } from 'vitest'
import { shipSchema } from './ship.schema'

describe('shipSchema', () => {
  it('parses a valid ship payload', () => {
    const result = shipSchema.safeParse({
      symbol: 'SHIP-1',
      nav: {
        status: 'IN_ORBIT',
        waypointSymbol: 'X1-DF55-20250Z',
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
    })

    expect(result.success).toBe(true)
  })

  it('fails when a field breaks the contract', () => {
    const result = shipSchema.safeParse({
      symbol: 'SHIP-1',
      nav: {
        status: 'LANDED',
        waypointSymbol: 'X1-DF55-20250Z',
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
    })

    expect(result.success).toBe(false)
  })
})
