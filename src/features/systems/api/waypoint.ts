import type { MaybeRefOrGetter } from 'vue'
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

export const waypointKeys = {
  list: (systemSymbol: MaybeRefOrGetter<string>, page: MaybeRefOrGetter<number>) =>
    ['waypoints', systemSymbol, page] as const,
  detail: (
    systemSymbol: MaybeRefOrGetter<string | undefined>,
    waypointSymbol: MaybeRefOrGetter<string | undefined>,
  ) => ['waypoint', systemSymbol, waypointSymbol] as const,
}
