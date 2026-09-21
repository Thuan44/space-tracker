import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useShipNavigation } from './useShipNavigation'
import * as navigationApi from '../api/navigation'
import type {
  ShipNavActionResponse,
  NavigateResponse,
  RefuelResponse,
} from '../api/navigation.schema'

vi.mock('../api/navigation')

function withQueryClient<T>(fn: () => T): T {
  const app = createApp({})
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  app.use(VueQueryPlugin, { queryClient })
  return app.runWithContext(fn)
}

describe('useShipNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('orbit', () => {
    it('calls orbitShip with the ship symbol', async () => {
      vi.mocked(navigationApi.orbitShip).mockResolvedValue({
        nav: { status: 'IN_ORBIT', waypointSymbol: 'X1-DF55-20250Z', route: { arrival: '' } },
      } satisfies ShipNavActionResponse)

      const { orbit } = withQueryClient(() => useShipNavigation())

      orbit.mutate('SHIP-1')

      await vi.waitFor(() => expect(navigationApi.orbitShip).toHaveBeenCalledWith('SHIP-1'))
    })

    it('invalidates ship detail and preview queries on success', async () => {
      vi.mocked(navigationApi.orbitShip).mockResolvedValue({
        nav: { status: 'IN_ORBIT', waypointSymbol: 'X1-DF55-20250Z', route: { arrival: '' } },
      } satisfies ShipNavActionResponse)

      const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

      const { orbit } = withQueryClient(() => useShipNavigation())

      orbit.mutate('SHIP-1')

      await vi.waitFor(() => expect(orbit.isSuccess.value).toBe(true))
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expect.arrayContaining(['ship']) })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ships'] })
    })
  })

  describe('dock', () => {
    it('calls dockShip with the ship symbol', async () => {
      vi.mocked(navigationApi.dockShip).mockResolvedValue({
        nav: { status: 'DOCKED', waypointSymbol: 'X1-DF55-20250Z', route: { arrival: '' } },
      } satisfies ShipNavActionResponse)

      const { dock } = withQueryClient(() => useShipNavigation())

      dock.mutate('SHIP-1')

      await vi.waitFor(() => expect(navigationApi.dockShip).toHaveBeenCalledWith('SHIP-1'))
    })

    it('invalidates ship detail and preview queries on success', async () => {
      vi.mocked(navigationApi.dockShip).mockResolvedValue({
        nav: { status: 'DOCKED', waypointSymbol: 'X1-DF55-20250Z', route: { arrival: '' } },
      } satisfies ShipNavActionResponse)

      const { dock } = withQueryClient(() => useShipNavigation())
      const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

      dock.mutate('SHIP-1')

      await vi.waitFor(() => expect(dock.isSuccess.value).toBe(true))
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expect.arrayContaining(['ship']) })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ships'] })
    })
  })

  describe('navigate', () => {
    it('calls navigateShip with ship symbol and waypoint symbol', async () => {
      vi.mocked(navigationApi.navigateShip).mockResolvedValue({
        nav: { status: 'IN_TRANSIT', waypointSymbol: 'X1-DF55-20250Z', route: { arrival: '' } },
        fuel: { current: 50, capacity: 100 },
      } satisfies NavigateResponse)

      const { navigate } = withQueryClient(() => useShipNavigation())

      navigate.mutate({ shipSymbol: 'SHIP-1', waypointSymbol: 'X1-DF55-20250Z' })

      await vi.waitFor(() =>
        expect(navigationApi.navigateShip).toHaveBeenCalledWith('SHIP-1', 'X1-DF55-20250Z'),
      )
    })

    it('invalidates ship detail and preview queries on success', async () => {
      vi.mocked(navigationApi.navigateShip).mockResolvedValue({
        nav: { status: 'IN_TRANSIT', waypointSymbol: 'X1-DF55-20250Z', route: { arrival: '' } },
        fuel: { current: 50, capacity: 100 },
      } satisfies NavigateResponse)

      const { navigate } = withQueryClient(() => useShipNavigation())
      const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

      navigate.mutate({ shipSymbol: 'SHIP-1', waypointSymbol: 'X1-DF55-20250Z' })

      await vi.waitFor(() => expect(navigate.isSuccess.value).toBe(true))
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expect.arrayContaining(['ship']) })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ships'] })
    })
  })

  describe('refuel', () => {
    it('calls refuelShip with the ship symbol', async () => {
      vi.mocked(navigationApi.refuelShip).mockResolvedValue({
        agent: { symbol: 'AGENT-1', credits: 150000 },
        fuel: { current: 100, capacity: 100 },
        transaction: {
          waypointSymbol: 'X1-DF55-20250Z',
          shipSymbol: 'SHIP-1',
          totalPrice: 500,
          timestamp: '',
        },
      } satisfies RefuelResponse)

      const { refuel } = withQueryClient(() => useShipNavigation())

      refuel.mutate('SHIP-1')

      await vi.waitFor(() => expect(navigationApi.refuelShip).toHaveBeenCalledWith('SHIP-1'))
    })

    it('invalidates ship detail, preview, and agent queries on success', async () => {
      vi.mocked(navigationApi.refuelShip).mockResolvedValue({
        agent: { symbol: 'AGENT-1', credits: 150000 },
        fuel: { current: 100, capacity: 100 },
        transaction: {
          waypointSymbol: 'X1-DF55-20250Z',
          shipSymbol: 'SHIP-1',
          totalPrice: 500,
          timestamp: '',
        },
      } satisfies RefuelResponse)

      const { refuel } = withQueryClient(() => useShipNavigation())
      const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries')

      refuel.mutate('SHIP-1')

      await vi.waitFor(() => expect(refuel.isSuccess.value).toBe(true))
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expect.arrayContaining(['ship']) })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ships'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agent'] })
    })
  })
})
