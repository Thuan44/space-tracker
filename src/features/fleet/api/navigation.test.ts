import { describe, it, expect, vi, beforeEach } from 'vitest'
import { orbitShip, dockShip, navigateShip, refuelShip } from './navigation'
import * as http from '@/shared/api/http'

vi.mock('@/shared/api/http', () => ({
  mutate: vi.fn<typeof http.mutate>(),
}))

describe('orbitShip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls mutate with correct URL and method', async () => {
    vi.mocked(http.mutate).mockResolvedValue({ nav: {} })

    await orbitShip('SHIP-1')

    expect(http.mutate).toHaveBeenCalledWith('/my/ships/SHIP-1/orbit', expect.anything(), {
      method: 'POST',
    })
  })

  it('returns the mutate result', async () => {
    const mockResponse = { nav: { status: 'IN_ORBIT' } }
    vi.mocked(http.mutate).mockResolvedValue(mockResponse)

    const result = await orbitShip('SHIP-1')

    expect(result).toEqual(mockResponse)
  })
})

describe('dockShip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls mutate with correct URL and method', async () => {
    vi.mocked(http.mutate).mockResolvedValue({ nav: {} })

    await dockShip('SHIP-1')

    expect(http.mutate).toHaveBeenCalledWith('/my/ships/SHIP-1/dock', expect.anything(), {
      method: 'POST',
    })
  })

  it('returns the mutate result', async () => {
    const mockResponse = { nav: { status: 'DOCKED' } }
    vi.mocked(http.mutate).mockResolvedValue(mockResponse)

    const result = await dockShip('SHIP-1')

    expect(result).toEqual(mockResponse)
  })
})

describe('navigateShip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls mutate with correct URL, method, and body', async () => {
    vi.mocked(http.mutate).mockResolvedValue({ nav: {}, fuel: {} })

    await navigateShip('SHIP-1', 'X1-DF55-20250Z')

    expect(http.mutate).toHaveBeenCalledWith('/my/ships/SHIP-1/navigate', expect.anything(), {
      method: 'POST',
      body: { waypointSymbol: 'X1-DF55-20250Z' },
    })
  })

  it('returns the mutate result', async () => {
    const mockResponse = { nav: { status: 'IN_TRANSIT' }, fuel: { current: 50, capacity: 100 } }
    vi.mocked(http.mutate).mockResolvedValue(mockResponse)

    const result = await navigateShip('SHIP-1', 'X1-DF55-20250Z')

    expect(result).toEqual(mockResponse)
  })
})

describe('refuelShip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls mutate with correct URL and method', async () => {
    vi.mocked(http.mutate).mockResolvedValue({ agent: {}, fuel: {}, transaction: {} })

    await refuelShip('SHIP-1')

    expect(http.mutate).toHaveBeenCalledWith('/my/ships/SHIP-1/refuel', expect.anything(), {
      method: 'POST',
    })
  })

  it('returns the mutate result', async () => {
    const mockResponse = {
      agent: { symbol: 'AGENT-1', credits: 150000 },
      fuel: { current: 100, capacity: 100 },
      transaction: { totalPrice: 500 },
    }
    vi.mocked(http.mutate).mockResolvedValue(mockResponse)

    const result = await refuelShip('SHIP-1')

    expect(result).toEqual(mockResponse)
  })
})
