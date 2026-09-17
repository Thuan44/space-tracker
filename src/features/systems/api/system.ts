import { request, requestPage, type PageOptions, type RequestOptions } from '@/shared/api/http'
import { systemSchema } from './system.schema'

export function getSystems(options?: PageOptions) {
  return requestPage('/systems', systemSchema, options)
}

export function getSystem(symbol: string, options?: RequestOptions) {
  return request(`/systems/${symbol}`, systemSchema, options)
}
