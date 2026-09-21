import { z } from 'zod'
import { shipSchema } from './ship.schema'

const navSchema = shipSchema.shape.nav
const fuelSchema = shipSchema.shape.fuel

export const shipNavActionResponseSchema = z.object({
  nav: navSchema,
})

export const navigateResponseSchema = z.object({
  nav: navSchema,
  fuel: fuelSchema,
})

export const refuelResponseSchema = z.object({
  agent: z.object({
    symbol: z.string(),
    credits: z.number(),
  }),
  fuel: fuelSchema,
  transaction: z.object({
    waypointSymbol: z.string(),
    shipSymbol: z.string(),
    totalPrice: z.number(),
    timestamp: z.string(),
  }),
})

export type ShipNavActionResponse = z.infer<typeof shipNavActionResponseSchema>
export type NavigateResponse = z.infer<typeof navigateResponseSchema>
export type RefuelResponse = z.infer<typeof refuelResponseSchema>
