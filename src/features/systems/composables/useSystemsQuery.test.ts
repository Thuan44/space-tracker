import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, ref } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useSystemsQuery } from './useSystemsQuery'
import { getSystems } from '../api/system'
import type { System } from '../api/system.schema'

vi.mock('../api/system')

const systemsPage: { data: System[]; meta: { total: number; page: number; limit: number } } = {
  data: [
    {
      symbol: 'X1-DF55',
      name: 'Nashira',
      sectorSymbol: 'X1',
      type: 'RED_STAR',
      waypoints: [{ symbol: 'X1-DF55-20250Z' }],
    },
  ],
  meta: { total: 1, page: 1, limit: 10 },
}

// useQuery needs an injected QueryClient; runWithContext gives it that without
// mounting a component (no @vue/test-utils in this project).
function withQueryClient<T>(fn: () => T): T {
  const app = createApp({})
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  app.use(VueQueryPlugin, { queryClient })
  return app.runWithContext(fn)
}

describe('useSystemsQuery', () => {
  beforeEach(() => {
    vi.mocked(getSystems).mockReset()
  })

  it('starts in a loading state', () => {
    vi.mocked(getSystems).mockReturnValue(new Promise(() => {}))

    const query = withQueryClient(() => useSystemsQuery(ref(1)))

    expect(query.isPending.value).toBe(true)
  })

  it('resolves with the systems page on success', async () => {
    vi.mocked(getSystems).mockResolvedValue(systemsPage)

    const query = withQueryClient(() => useSystemsQuery(ref(1)))

    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true))
    expect(query.data.value).toEqual(systemsPage)
  })

  it('reports an error state when the request fails', async () => {
    vi.mocked(getSystems).mockRejectedValue(new Error('Request failed'))

    const query = withQueryClient(() => useSystemsQuery(ref(1)))

    await vi.waitFor(() => expect(query.isError.value).toBe(true))
  })
})
