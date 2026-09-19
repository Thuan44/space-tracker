import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { marketKeys } from './market'

describe('marketKeys', () => {
  it('detail returns a stable key for a given waypoint symbol', () => {
    expect(marketKeys.detail('X1-DF55-20250Z')).toEqual(['market', 'X1-DF55-20250Z'])
    expect(marketKeys.detail('X1-DF55-20250Z')).toEqual(marketKeys.detail('X1-DF55-20250Z'))
  })

  it('detail accepts a ref waypoint symbol', () => {
    const waypointSymbol = ref('X1-DF55-20250Z')
    expect(marketKeys.detail(waypointSymbol)).toEqual(['market', waypointSymbol])
  })
})
