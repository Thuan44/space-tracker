import { requestPage, type PageOptions } from '@/shared/api/http'
import { shipSchema } from './ship.schema'

export function getShips(options?: PageOptions) {
  return requestPage('/my/ships', shipSchema, options)
}
