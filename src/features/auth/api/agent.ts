import { request, type RequestOptions } from '@/shared/api/http'
import { agentSchema, type Agent } from './agent.schema'

export function getAgent(options?: RequestOptions): Promise<Agent> {
  return request('/my/agent', agentSchema, options)
}
