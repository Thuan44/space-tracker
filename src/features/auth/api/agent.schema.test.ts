import { describe, it, expect } from 'vitest'
import { agentSchema } from './agent.schema'

describe('agentSchema', () => {
  it('parses a valid agent payload', () => {
    const result = agentSchema.safeParse({
      symbol: 'AGENT',
      credits: 175000,
      headquarters: 'X1-DF55-20250Z',
      startingFaction: 'COSMIC',
      shipCount: 2,
    })

    expect(result.success).toBe(true)
  })

  it('fails when a field breaks the contract', () => {
    const result = agentSchema.safeParse({
      symbol: 'AGENT',
      credits: 'not-a-number',
      headquarters: 'X1-DF55-20250Z',
      startingFaction: 'COSMIC',
      shipCount: 2,
    })

    expect(result.success).toBe(false)
  })
})
