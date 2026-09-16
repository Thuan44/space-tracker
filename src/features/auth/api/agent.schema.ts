import { z } from 'zod'

export const agentSchema = z.object({
  symbol: z.string().min(3).max(14),
  credits: z.number().int(),
  headquarters: z.string().min(1),
  startingFaction: z.string().min(1),
  shipCount: z.number().int().nonnegative(),
})

export type Agent = z.infer<typeof agentSchema>
