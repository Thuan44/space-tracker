<script setup lang="ts">
import { computed, ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import Column from 'primevue/column'
import { getSystem, systemKeys } from '../api/system'
import { getWaypoints, waypointKeys } from '../api/waypoint'
import { toReadableText } from '@/shared/lib/spacetraders'
import { STALE_TIME } from '@/shared/api/query-config'
import PageHeader from '@/shared/ui/PageHeader.vue'
import QueryErrorBanner from '@/shared/ui/QueryErrorBanner.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import PillBadge from '@/shared/ui/PillBadge.vue'
import DetailField from '@/shared/ui/DetailField.vue'
import BackLink from '@/shared/ui/BackLink.vue'

const route = useRoute()
const systemSymbol = computed(() => route.params.systemSymbol as string)

const {
  data: system,
  isPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: systemKeys.detail(systemSymbol),
  queryFn: () => getSystem(systemSymbol.value),
  staleTime: STALE_TIME.systems,
})

const waypointsPage = ref(1)
const waypointsFilterText = ref('')

const {
  data: waypointsData,
  isPending: waypointsPending,
  isFetching: waypointsFetching,
  isError: waypointsError,
  error: waypointsErrorDetail,
  refetch: refetchWaypoints,
} = useQuery({
  queryKey: waypointKeys.list(systemSymbol, waypointsPage),
  queryFn: () => getWaypoints(systemSymbol.value, { page: waypointsPage.value }),
  staleTime: STALE_TIME.waypoints,
  placeholderData: keepPreviousData,
})

const waypointRows = computed(
  () =>
    waypointsData.value?.data.map((waypoint) => ({
      ...waypoint,
      displayType: toReadableText(waypoint.type),
    })) ?? [],
)

const filteredWaypointRows = computed(() => {
  const needle = waypointsFilterText.value.trim().toLowerCase()
  if (!needle) return waypointRows.value
  return waypointRows.value.filter(
    (row) =>
      row.symbol.toLowerCase().includes(needle) ||
      row.displayType.toLowerCase().includes(needle) ||
      row.traits.some((trait) => trait.name.toLowerCase().includes(needle)),
  )
})

function traitVariant(trait: string): 'info' | 'accent' | 'dashed' | 'muted' {
  if (trait === 'MARKETPLACE') return 'info'
  if (trait === 'SHIPYARD') return 'accent'
  if (trait === 'UNCHARTED') return 'dashed'
  return 'muted'
}
</script>

<template>
  <div class="p-8">
    <BackLink to="/systems">Back to systems</BackLink>

    <SkeletonBlock v-if="isPending" class="mt-6" height-class="h-28" />

    <QueryErrorBanner
      v-else-if="isError"
      class="mt-6"
      :error="error"
      fallback-message="Failed to load system."
      @retry="() => refetch()"
    />

    <template v-else-if="system">
      <PageHeader class="mt-6" typewriter :title="system.symbol">
        <template v-if="system.name && system.name !== system.symbol" #description>
          <p class="mt-1 text-data text-muted">{{ system.name }}</p>
        </template>
      </PageHeader>

      <div class="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-6">
        <DetailField label="Sector">
          <span class="text-[15px] font-semibold text-fg">{{ system.sectorSymbol }}</span>
        </DetailField>
        <DetailField label="Constellation">
          <span class="text-[15px] font-semibold text-fg">{{ system.constellation }}</span>
        </DetailField>
        <DetailField label="Star type">
          <span class="text-[15px] font-semibold text-fg">{{ toReadableText(system.type) }}</span>
        </DetailField>
        <DetailField label="Coordinates">
          <span class="text-[15px] font-semibold text-fg">{{ system.x }}, {{ system.y }}</span>
        </DetailField>
      </div>
    </template>

    <div v-if="system" class="mt-6">
      <h2 class="text-data font-semibold uppercase tracking-[0.12em] text-fg">Waypoints</h2>

      <DataTable
        v-model:page="waypointsPage"
        v-model:filter-text="waypointsFilterText"
        :rows="filteredWaypointRows"
        data-key="symbol"
        :is-pending="waypointsPending"
        :is-fetching="waypointsFetching"
        :is-error="waypointsError"
        :error="waypointsErrorDetail"
        error-message="Failed to load waypoints."
        :total="waypointsData?.meta.total ?? 0"
        :limit="waypointsData?.meta.limit ?? 1"
        item-label="waypoints"
        filter-placeholder="Filter by symbol, type or trait"
        @retry="() => refetchWaypoints()"
      >
        <Column field="symbol" header="Symbol" sortable>
          <template #body="{ data: row }">{{ row.symbol }}</template>
        </Column>
        <Column field="type" header="Type" sortable>
          <template #body="{ data: row }">{{ row.displayType }}</template>
        </Column>
        <Column header="Traits">
          <template #body="{ data: row }">
            <div v-if="row.traits.length === 0" class="text-data text-muted">&mdash;</div>
            <div v-else class="flex flex-wrap gap-2">
              <PillBadge
                v-for="trait in row.traits"
                :key="trait.symbol"
                :variant="traitVariant(trait.symbol)"
                :to="trait.symbol === 'MARKETPLACE' ? `/markets/${row.symbol}` : undefined"
              >
                {{ trait.name }}
              </PillBadge>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
