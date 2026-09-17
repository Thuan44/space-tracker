import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useAgentQuery } from './useAgentQuery'
import { getAgent } from '../api/agent'
import type { Agent } from '../api/agent.schema'

vi.mock('../api/agent')

const agent: Agent = {
  symbol: 'AGENT',
  credits: 175000,
  headquarters: 'X1-DF55-20250Z',
  startingFaction: 'COSMIC',
  shipCount: 2,
}

// useQuery needs an injected QueryClient; runWithContext gives it that without
// mounting a component (no @vue/test-utils in this project).
function withQueryClient<T>(fn: () => T): T {
  const app = createApp({})
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  app.use(VueQueryPlugin, { queryClient })
  return app.runWithContext(fn)
}

describe('useAgentQuery', () => {
  beforeEach(() => {
    vi.mocked(getAgent).mockReset()
  })

  it('starts in a loading state', () => {
    vi.mocked(getAgent).mockReturnValue(new Promise(() => {}))

    const query = withQueryClient(() => useAgentQuery())

    expect(query.isPending.value).toBe(true)
  })

  it('resolves with the agent on success', async () => {
    vi.mocked(getAgent).mockResolvedValue(agent)

    const query = withQueryClient(() => useAgentQuery())

    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true))
    expect(query.data.value).toEqual(agent)
  })

  it('reports an error state when the request fails', async () => {
    vi.mocked(getAgent).mockRejectedValue(new Error('Request failed'))

    const query = withQueryClient(() => useAgentQuery())

    await vi.waitFor(() => expect(query.isError.value).toBe(true))
  })
})
