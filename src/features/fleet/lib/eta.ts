import type { Ship } from '../api/ship.schema'

export function formatEta(ship: Ship): string {
  return ship.nav.status === 'IN_TRANSIT' ? new Date(ship.nav.route.arrival).toLocaleString() : '—'
}
