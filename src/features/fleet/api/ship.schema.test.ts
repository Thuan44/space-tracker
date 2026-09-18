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
        inventory: [{ symbol: 'IRON_ORE', name: 'Iron Ore', units: 10 }],
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
      cooldown: {
        remainingSeconds: 0,
      },
      crew: {
        current: 4,
        required: 3,
        capacity: 8,
        morale: 100,
        rotation: 'STRICT',
        wages: 800,
      },
      frame: { name: 'Frigate', condition: 0.9 },
      reactor: { name: 'Fusion Reactor I', condition: 0.85 },
      engine: { name: 'Impulse Drive I', condition: 0.95 },
      modules: [{ symbol: 'MODULE_CARGO_HOLD_I', name: 'Cargo Hold' }],
      mounts: [{ symbol: 'MOUNT_MINING_LASER_I', name: 'Mining Laser' }],
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
        inventory: [],
      },
      fuel: {
        current: 200,
        capacity: 400,
      },
      cooldown: {
        remainingSeconds: 45,
      },
      crew: {
        current: 2,
        required: 3,
        capacity: 8,
        morale: 80,
        rotation: 'RELAXED',
        wages: 600,
      },
      frame: { name: 'Frigate', condition: 0.9 },
      reactor: { name: 'Fusion Reactor I', condition: 0.85 },
      engine: { name: 'Impulse Drive I', condition: 0.95 },
      modules: [],
      mounts: [{ symbol: 'MOUNT_MINING_LASER_I', name: 'Mining Laser' }],
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
      cooldown: {
        remainingSeconds: 0,
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when cooldown breaks the contract', () => {
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
      cooldown: {
        remainingSeconds: 'none',
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when a cargo inventory item breaks the contract', () => {
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
        inventory: [{ symbol: 'IRON_ORE', name: 'Iron Ore' }],
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
      cooldown: {
        remainingSeconds: 0,
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when crew breaks the contract', () => {
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
        inventory: [],
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
      cooldown: {
        remainingSeconds: 0,
      },
      crew: {
        current: 4,
        required: 3,
        capacity: 8,
        morale: 100,
        rotation: 'STRICT',
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when a component breaks the contract', () => {
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
        inventory: [],
      },
      fuel: {
        current: 400,
        capacity: 400,
      },
      cooldown: {
        remainingSeconds: 0,
      },
      crew: {
        current: 4,
        required: 3,
        capacity: 8,
        morale: 100,
        rotation: 'STRICT',
        wages: 800,
      },
      frame: { name: 'Frigate' },
      reactor: { name: 'Fusion Reactor I', condition: 0.85 },
      engine: { name: 'Impulse Drive I', condition: 0.95 },
      modules: [{ symbol: 'MODULE_CARGO_HOLD_I', name: 'Cargo Hold' }],
      mounts: [{ symbol: 'MOUNT_MINING_LASER_I', name: 'Mining Laser' }],
    })

    expect(result.success).toBe(false)
  })
})
