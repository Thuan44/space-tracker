import { describe, it, expect } from 'vitest'
import { marketSchema } from './market.schema'

describe('marketSchema', () => {
  it('parses a valid market payload with tradeGoods present', () => {
    const result = marketSchema.safeParse({
      symbol: 'X1-DF55-20250Z',
      exports: [{ symbol: 'IRON_ORE', name: 'Iron Ore' }],
      imports: [{ symbol: 'FUEL', name: 'Fuel' }],
      exchange: [{ symbol: 'SHIP_PLATING', name: 'Ship Plating' }],
      tradeGoods: [
        {
          symbol: 'IRON_ORE',
          tradeVolume: 100,
          supply: 'MODERATE',
          activity: 'GROWING',
          purchasePrice: 10,
          sellPrice: 8,
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('parses a valid market payload without tradeGoods', () => {
    const result = marketSchema.safeParse({
      symbol: 'X1-DF55-20250Z',
      exports: [{ symbol: 'IRON_ORE', name: 'Iron Ore' }],
      imports: [],
      exchange: [],
    })

    expect(result.success).toBe(true)
  })

  it('fails when a field breaks the contract', () => {
    const result = marketSchema.safeParse({
      symbol: 'X1-DF55-20250Z',
      exports: 'IRON_ORE',
      imports: [],
      exchange: [],
    })

    expect(result.success).toBe(false)
  })
})
