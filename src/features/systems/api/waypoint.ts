import { requestPage, type PageOptions } from '@/shared/api/http'
import { waypointSchema } from './waypoint.schema'

export function getWaypoints(systemSymbol: string, options?: PageOptions) {
  return requestPage(`/systems/${systemSymbol}/waypoints`, waypointSchema, options)
}
