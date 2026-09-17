import { z } from 'zod'

export const systemSchema = z.object({
  symbol: z.string(),
  name: z.string().optional(),
  sectorSymbol: z.string(),
  type: z.string(),
  constellation: z.string(),
  x: z.number(),
  y: z.number(),
  waypoints: z.array(z.object({ symbol: z.string() })),
})

export type System = z.infer<typeof systemSchema>
