import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { waypointKeys } from './waypoint'

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
