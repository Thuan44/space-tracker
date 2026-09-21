import { describe, it, expect } from 'vitest'
import {
  shipNavActionResponseSchema,
  navigateResponseSchema,
  refuelResponseSchema,
} from './navigation.schema'

describe('shipNavActionResponseSchema', () => {
  it('parses a valid orbit/dock response', () => {
    const result = shipNavActionResponseSchema.safeParse({
      nav: {
        status: 'IN_ORBIT',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2024-01-15T10:30:00.000Z',
        },
      },
    })

    expect(result.success).toBe(true)
  })

  it('fails when nav field is missing', () => {
    const result = shipNavActionResponseSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('fails when nav status is invalid', () => {
    const result = shipNavActionResponseSchema.safeParse({
      nav: {
        status: 'INVALID_STATUS',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2024-01-15T10:30:00.000Z',
        },
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('navigateResponseSchema', () => {
  it('parses a valid navigate response', () => {
    const result = navigateResponseSchema.safeParse({
      nav: {
        status: 'IN_TRANSIT',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2024-01-15T10:30:00.000Z',
        },
      },
      fuel: {
        current: 50,
        capacity: 100,
      },
    })

    expect(result.success).toBe(true)
  })

  it('fails when fuel field is missing', () => {
    const result = navigateResponseSchema.safeParse({
      nav: {
        status: 'IN_TRANSIT',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2024-01-15T10:30:00.000Z',
        },
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when fuel values are not numbers', () => {
    const result = navigateResponseSchema.safeParse({
      nav: {
        status: 'IN_TRANSIT',
        waypointSymbol: 'X1-DF55-20250Z',
        route: {
          arrival: '2024-01-15T10:30:00.000Z',
        },
      },
      fuel: {
        current: '50',
        capacity: '100',
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('refuelResponseSchema', () => {
  it('parses a valid refuel response', () => {
    const result = refuelResponseSchema.safeParse({
      agent: {
        symbol: 'AGENT-1',
        credits: 150000,
      },
      fuel: {
        current: 100,
        capacity: 100,
      },
      transaction: {
        waypointSymbol: 'X1-DF55-20250Z',
        shipSymbol: 'AGENT-1-1',
        totalPrice: 500,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    })

    expect(result.success).toBe(true)
  })

  it('fails when agent field is missing', () => {
    const result = refuelResponseSchema.safeParse({
      fuel: {
        current: 100,
        capacity: 100,
      },
      transaction: {
        waypointSymbol: 'X1-DF55-20250Z',
        shipSymbol: 'AGENT-1-1',
        totalPrice: 500,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when transaction field is missing', () => {
    const result = refuelResponseSchema.safeParse({
      agent: {
        symbol: 'AGENT-1',
        credits: 150000,
      },
      fuel: {
        current: 100,
        capacity: 100,
      },
    })

    expect(result.success).toBe(false)
  })

  it('fails when credits is not a number', () => {
    const result = refuelResponseSchema.safeParse({
      agent: {
        symbol: 'AGENT-1',
        credits: '150000',
      },
      fuel: {
        current: 100,
        capacity: 100,
      },
      transaction: {
        waypointSymbol: 'X1-DF55-20250Z',
        shipSymbol: 'AGENT-1-1',
        totalPrice: 500,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    })

    expect(result.success).toBe(false)
  })
})
