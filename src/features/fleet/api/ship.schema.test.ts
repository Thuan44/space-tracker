import { describe, it, expect } from 'vitest'
import { shipSchema } from './ship.schema'

describe('shipSchema', () => {
  it('parses a valid ship payload', () => {
    const result = shipSchema.safeParse({
      symbol: 'SHIP-1',
      registration: {
        role: 'COMMAND',
      },
      nav: {
        status: 'IN_ORBIT',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2026-01-01T00:00:00.000Z',
        },
      },
      cargo: {
        units: 10,
        capacity: 40,
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
    })

    expect(result.success).toBe(true)
  })

  it('parses a valid in-transit ship payload', () => {
    const result = shipSchema.safeParse({
      symbol: 'SHIP-2',
      registration: {
        role: 'EXCAVATOR',
      },
      nav: {
        status: 'IN_TRANSIT',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2026-01-01T00:00:00.000Z',
        },
      },
      cargo: {
        units: 0,
        capacity: 40,
      },
      fuel: {
        current: 200,
        capacity: 400,
      },
    })

    expect(result.success).toBe(true)
  })

  it('fails when a field breaks the contract', () => {
    const result = shipSchema.safeParse({
      symbol: 'SHIP-1',
      registration: {
        role: 'COMMAND',
      },
      nav: {
        status: 'LANDED',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2026-01-01T00:00:00.000Z',
        },
      },
      cargo: {
        units: 10,
        capacity: 40,
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
    })

    expect(result.success).toBe(false)
  })
})
