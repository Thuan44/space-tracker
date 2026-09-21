import { mutate } from '@/shared/api/http'
import {
  shipNavActionResponseSchema,
  navigateResponseSchema,
  refuelResponseSchema,
  type ShipNavActionResponse,
  type NavigateResponse,
  type RefuelResponse,
} from './navigation.schema'

export async function orbitShip(shipSymbol: string): Promise<ShipNavActionResponse> {
  return mutate(`/my/ships/${shipSymbol}/orbit`, shipNavActionResponseSchema, { method: 'POST' })
}

export async function dockShip(shipSymbol: string): Promise<ShipNavActionResponse> {
  return mutate(`/my/ships/${shipSymbol}/dock`, shipNavActionResponseSchema, { method: 'POST' })
}

export async function navigateShip(
  shipSymbol: string,
  waypointSymbol: string,
): Promise<NavigateResponse> {
  return mutate(`/my/ships/${shipSymbol}/navigate`, navigateResponseSchema, {
    method: 'POST',
    body: { waypointSymbol },
  })
}

export async function refuelShip(shipSymbol: string): Promise<RefuelResponse> {
  return mutate(`/my/ships/${shipSymbol}/refuel`, refuelResponseSchema, { method: 'POST' })
}
