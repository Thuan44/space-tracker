import { request, type RequestOptions } from '@/shared/api/http'
import { marketSchema } from './market.schema'

export function getMarket(systemSymbol: string, waypointSymbol: string, options?: RequestOptions) {
  return request(
    `/systems/${systemSymbol}/waypoints/${waypointSymbol}/market`,
    marketSchema,
    options,
  )
}
