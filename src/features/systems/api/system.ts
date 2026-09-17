import { requestPage, type PageOptions } from '@/shared/api/http'
import { systemSchema } from './system.schema'

export function getSystems(options?: PageOptions) {
  return requestPage('/systems', systemSchema, options)
}
