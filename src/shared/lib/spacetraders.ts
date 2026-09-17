export function toReadableText(value: string): string {
  return value.replace(/_/g, ' ')
}

export function systemSymbolFromWaypoint(waypointSymbol: string): string {
  return waypointSymbol.split('-').slice(0, 2).join('-')
}
