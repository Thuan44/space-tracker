import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { orbitShip, dockShip, navigateShip, refuelShip } from '../api/navigation'
import { shipKeys } from '../api/ship'
import { agentKeys } from '@/features/auth/api/agent'
import { withMinDuration } from '@/shared/lib/with-min-duration'

const MIN_PENDING_MS = 400

export function useShipNavigation() {
  const queryClient = useQueryClient()

  const orbit = useMutation({
    mutationFn: (shipSymbol: string) => withMinDuration(orbitShip(shipSymbol), MIN_PENDING_MS),
    onSuccess: (_data, shipSymbol) => {
      queryClient.invalidateQueries({ queryKey: shipKeys.detail(shipSymbol) })
      // Invalidate all queries with keys starting with 'ships' to refresh the list of ships
      queryClient.invalidateQueries({ queryKey: ['ships'] })
    },
  })

  const dock = useMutation({
    mutationFn: (shipSymbol: string) => withMinDuration(dockShip(shipSymbol), MIN_PENDING_MS),
    onSuccess: (_data, shipSymbol) => {
      queryClient.invalidateQueries({ queryKey: shipKeys.detail(shipSymbol) })
      queryClient.invalidateQueries({ queryKey: ['ships'] })
    },
  })

  const navigate = useMutation({
    mutationFn: ({ shipSymbol, waypointSymbol }: { shipSymbol: string; waypointSymbol: string }) =>
      withMinDuration(navigateShip(shipSymbol, waypointSymbol), MIN_PENDING_MS),
    onSuccess: (_data, { shipSymbol }) => {
      queryClient.invalidateQueries({ queryKey: shipKeys.detail(shipSymbol) })
      queryClient.invalidateQueries({ queryKey: ['ships'] })
    },
  })

  const refuel = useMutation({
    mutationFn: (shipSymbol: string) => withMinDuration(refuelShip(shipSymbol), MIN_PENDING_MS),
    onSuccess: (_data, shipSymbol) => {
      queryClient.invalidateQueries({ queryKey: shipKeys.detail(shipSymbol) })
      queryClient.invalidateQueries({ queryKey: ['ships'] })
      queryClient.invalidateQueries({ queryKey: agentKeys.detail() })
    },
  })

  return {
    orbit,
    dock,
    navigate,
    refuel,
  }
}
