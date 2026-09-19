import { describe, it, expect } from 'vitest'
import { formatEta } from './eta'
import type { Ship } from '../api/ship.schema'

function shipWithNav(nav: Ship['nav']): Ship {
  return { nav } as Ship
}

describe('formatEta', () => {
  it('formats the arrival time for a ship in transit', () => {
    const ship = shipWithNav({
      status: 'IN_TRANSIT',
      waypointSymbol: 'X1-DF55-20250Z',
      route: { arrival: '2026-01-01T00:00:00.000Z' },
    })

    expect(formatEta(ship)).toBe(new Date('2026-01-01T00:00:00.000Z').toLocaleString())
  })

  it('returns an em dash for a ship that is not in transit', () => {
    const ship = shipWithNav({
      status: 'DOCKED',
      waypointSymbol: 'X1-DF55-20250Z',
      route: { arrival: '2026-01-01T00:00:00.000Z' },
    })

    expect(formatEta(ship)).toBe('—')
  })
})
