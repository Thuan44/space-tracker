import { describe, it, expect } from 'vitest'
import { agentKeys } from './agent'

describe('agentKeys', () => {
  it('detail returns a stable key', () => {
    expect(agentKeys.detail()).toEqual(['agent'])
    expect(agentKeys.detail()).toEqual(agentKeys.detail())
  })
})
