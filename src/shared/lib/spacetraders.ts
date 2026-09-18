export function toReadableText(value: string): string {
  return value.replace(/_/g, ' ')
}

export function systemSymbolFromWaypoint(waypointSymbol: string): string {
  return waypointSymbol.split('-').slice(0, 2).join('-')
}

export function percentOf(current: number, capacity: number): number {
  return capacity > 0 ? Math.round((current / capacity) * 100) : 0
}
