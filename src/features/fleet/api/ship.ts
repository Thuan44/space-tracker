import type { MaybeRefOrGetter } from 'vue'
import { request, requestPage, type PageOptions, type RequestOptions } from '@/shared/api/http'
import { shipSchema } from './ship.schema'

export function getShips(options?: PageOptions) {
  return requestPage('/my/ships', shipSchema, options)
}

export function getShip(shipSymbol: string, options?: RequestOptions) {
  return request(`/my/ships/${shipSymbol}`, shipSchema, options)
}

export const shipKeys = {
  list: (page: MaybeRefOrGetter<number>) => ['ships', page] as const,
  preview: () => ['ships', 'preview'] as const,
  detail: (symbol: MaybeRefOrGetter<string>) => ['ship', symbol] as const,
}
