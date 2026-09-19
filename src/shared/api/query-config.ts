export const STALE_TIME = {
  default: 60_000, // 1 min — QueryClient default
  agent: 20_000, // 20 s — dynamic (credits, ship count)
  ships: 20_000, // 20 s — dynamic (position, cargo, fuel)
  systems: 10 * 60_000, // 10 min — near-static
  waypoints: 5 * 60_000, // 5 min — near-static
  market: 60_000, // 1 min — prices move while a ship is present
} as const
