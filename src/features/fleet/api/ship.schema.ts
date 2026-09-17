import { z } from 'zod'

export const shipSchema = z.object({
  symbol: z.string(),
  nav: z.object({
    status: z.enum(['IN_ORBIT', 'DOCKED', 'IN_TRANSIT']),
    waypointSymbol: z.string(),
  }),
  fuel: z.object({
    current: z.number(),
    capacity: z.number(),
  }),
})

export type Ship = z.infer<typeof shipSchema>
