import { useQuery } from '@tanstack/vue-query'
import { getAgent } from '../api/agent'

export function useAgentQuery() {
  return useQuery({
    queryKey: ['agent'],
    queryFn: () => getAgent(),
  })
}
