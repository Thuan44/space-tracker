import type { MaybeRefOrGetter } from 'vue'
import { request, requestPage, type PageOptions, type RequestOptions } from '@/shared/api/http'
import { waypointSchema, type Waypoint } from './waypoint.schema'

const MAX_PAGE_LIMIT = 20

export function getWaypoints(systemSymbol: string, options?: PageOptions) {
  return requestPage(`/systems/${systemSymbol}/waypoints`, waypointSchema, options)
}

export async function getAllWaypoints(systemSymbol: string): Promise<Waypoint[]> {
  const first = await getWaypoints(systemSymbol, { page: 1, limit: MAX_PAGE_LIMIT })
  const pageCount = Math.ceil(first.meta.total / first.meta.limit)
  if (pageCount <= 1) return first.data

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) =>
      getWaypoints(systemSymbol, { page: i + 2, limit: MAX_PAGE_LIMIT }),
    ),
  )
  return [first.data, ...rest.map((page) => page.data)].flat()
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
  all: (systemSymbol: MaybeRefOrGetter<string>) => ['waypoints', systemSymbol, 'all'] as const,
  detail: (
    systemSymbol: MaybeRefOrGetter<string | undefined>,
    waypointSymbol: MaybeRefOrGetter<string | undefined>,
  ) => ['waypoint', systemSymbol, waypointSymbol] as const,
}
