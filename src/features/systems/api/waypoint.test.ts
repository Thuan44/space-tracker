import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { waypointKeys, getAllWaypoints } from './waypoint'

function waypoint(symbol: string) {
  return { symbol, type: 'PLANET', traits: [] }
}

function pageResponse(
  data: ReturnType<typeof waypoint>[],
  page: number,
  total: number,
  limit = 20,
) {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () => Promise.resolve({ data, meta: { total, page, limit } }),
    text: () => Promise.resolve(''),
  } as Response
}

describe('waypointKeys', () => {
  it('list returns a stable key for a given system and page', () => {
    expect(waypointKeys.list('X1-DF55', 1)).toEqual(['waypoints', 'X1-DF55', 1])
    expect(waypointKeys.list('X1-DF55', 1)).toEqual(waypointKeys.list('X1-DF55', 1))
  })

  it('list accepts refs', () => {
    const systemSymbol = ref('X1-DF55')
    const page = ref(2)
    expect(waypointKeys.list(systemSymbol, page)).toEqual(['waypoints', systemSymbol, page])
  })

  it('detail returns a stable key for a given system and waypoint', () => {
    expect(waypointKeys.detail('X1-DF55', 'X1-DF55-20250Z')).toEqual([
      'waypoint',
      'X1-DF55',
      'X1-DF55-20250Z',
    ])
    expect(waypointKeys.detail('X1-DF55', 'X1-DF55-20250Z')).toEqual(
      waypointKeys.detail('X1-DF55', 'X1-DF55-20250Z'),
    )
  })

  it('detail accepts undefined while the waypoint symbol is not yet known', () => {
    expect(waypointKeys.detail(undefined, undefined)).toEqual(['waypoint', undefined, undefined])
  })
})

describe('getAllWaypoints', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns the single page when the system has no more waypoints than the page limit', async () => {
    vi.mocked(fetch).mockResolvedValue(pageResponse([waypoint('X1-DF55-A')], 1, 1))

    const result = await getAllWaypoints('X1-DF55')

    expect(result).toEqual([waypoint('X1-DF55-A')])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('fetches and flattens every remaining page when the system has more waypoints', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      const page = url.includes('page=2') ? 2 : 1
      const data = page === 1 ? [waypoint('A'), waypoint('B')] : [waypoint('C')]
      // meta.limit is 2 here purely to force a second page in this test without 20 fixtures
      return Promise.resolve(pageResponse(data, page, 3, 2))
    })

    const result = await getAllWaypoints('X1-DF55')

    expect(result.map((wp) => wp.symbol)).toEqual(['A', 'B', 'C'])
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
