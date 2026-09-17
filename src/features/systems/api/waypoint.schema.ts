import { z } from 'zod'

export const waypointTraitSchema = z.object({
  symbol: z.string(),
  name: z.string(),
})

export const waypointSchema = z.object({
  symbol: z.string(),
  type: z.string(),
  traits: z.array(waypointTraitSchema),
})

export type WaypointTrait = z.infer<typeof waypointTraitSchema>
export type Waypoint = z.infer<typeof waypointSchema>
