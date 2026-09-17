import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { getSystems } from '../api/system'

export function useSystemsQuery(page: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: ['systems', page],
    queryFn: () => getSystems({ page: toValue(page) }),
  })
}
