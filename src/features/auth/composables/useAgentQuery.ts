import { useQuery } from '@tanstack/vue-query'
import { agentKeys, getAgent } from '../api/agent'
import { STALE_TIME } from '@/shared/api/query-config'

export function useAgentQuery() {
  return useQuery({
    queryKey: agentKeys.detail(),
    queryFn: () => getAgent(),
    staleTime: STALE_TIME.agent,
  })
}
