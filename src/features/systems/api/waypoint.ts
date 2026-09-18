import { request, requestPage, type PageOptions, type RequestOptions } from '@/shared/api/http'
import { waypointSchema } from './waypoint.schema'

export function getWaypoints(systemSymbol: string, options?: PageOptions) {
  return requestPage(`/systems/${systemSymbol}/waypoints`, waypointSchema, options)
}

export function getWaypoint(
  systemSymbol: string,
  waypointSymbol: string,
  options?: RequestOptions,
) {
  return request(`/systems/${systemSymbol}/waypoints/${waypointSymbol}`, waypointSchema, options)
}
