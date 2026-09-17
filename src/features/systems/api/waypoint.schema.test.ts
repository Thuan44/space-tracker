import { describe, it, expect } from 'vitest'
import { waypointSchema } from './waypoint.schema'

describe('waypointSchema', () => {
  it('parses a valid waypoint payload', () => {
    const result = waypointSchema.safeParse({
      symbol: 'X1-DF55-20250Z',
      type: 'PLANET',
      traits: [
        { symbol: 'MARKETPLACE', name: 'Marketplace', description: 'A thriving trade hub.' },
        { symbol: 'SHIPYARD', name: 'Shipyard', description: 'Ships built and repaired here.' },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('fails when a field breaks the contract', () => {
    const result = waypointSchema.safeParse({
      symbol: 'X1-DF55-20250Z',
      type: 'PLANET',
      traits: ['MARKETPLACE'],
    })

    expect(result.success).toBe(false)
  })
})
