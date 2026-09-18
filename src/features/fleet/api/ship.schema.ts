import { z } from 'zod'

export const shipSchema = z.object({
  symbol: z.string(),
  registration: z.object({
    role: z.string(),
  }),
  nav: z.object({
    status: z.enum(['IN_ORBIT', 'DOCKED', 'IN_TRANSIT']),
    waypointSymbol: z.string(),
    route: z.object({
      arrival: z.string(),
    }),
  }),
  cargo: z.object({
    units: z.number(),
    capacity: z.number(),
  }),
  fuel: z.object({
    current: z.number(),
    capacity: z.number(),
  }),
})

export type Ship = z.infer<typeof shipSchema>
