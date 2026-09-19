import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { getSystems, systemKeys } from '../api/system'
import { STALE_TIME } from '@/shared/api/query-config'

export function useSystemsQuery(page: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: systemKeys.list(page),
    queryFn: () => getSystems({ page: toValue(page) }),
    staleTime: STALE_TIME.systems,
    placeholderData: keepPreviousData,
  })
}
