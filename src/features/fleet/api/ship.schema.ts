import { z } from 'zod'

const shipComponentSchema = z.object({
  name: z.string(),
  condition: z.number(),
})

const shipModuleSchema = z.object({
  symbol: z.string(),
  name: z.string(),
})

const shipMountSchema = z.object({
  symbol: z.string(),
  name: z.string(),
})

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
    inventory: z.array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        units: z.number(),
      }),
    ),
  }),
  fuel: z.object({
    current: z.number(),
    capacity: z.number(),
  }),
  cooldown: z.object({
    remainingSeconds: z.number(),
  }),
  crew: z.object({
    current: z.number(),
    required: z.number(),
    capacity: z.number(),
    morale: z.number(),
    rotation: z.string(),
    wages: z.number(),
  }),
  frame: shipComponentSchema,
  reactor: shipComponentSchema,
  engine: shipComponentSchema,
  modules: z.array(shipModuleSchema),
  mounts: z.array(shipMountSchema),
})

export type Ship = z.infer<typeof shipSchema>
