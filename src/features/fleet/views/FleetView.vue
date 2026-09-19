<script setup lang="ts">
import { computed, ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import Column from 'primevue/column'
import DataTable from '@/shared/ui/DataTable.vue'
import GaugeBar from '@/shared/ui/GaugeBar.vue'
import ShipStatusBadge from '../components/ShipStatusBadge.vue'
import { getShips, shipKeys } from '../api/ship'
import { formatEta } from '../lib/eta'
import PageHeader from '@/shared/ui/PageHeader.vue'
import { percentOf, toReadableText } from '@/shared/lib/spacetraders'
import { STALE_TIME } from '@/shared/api/query-config'

const page = ref(1)
const filterText = ref('')

const { data, isPending, isFetching, isError, error, refetch } = useQuery({
  queryKey: shipKeys.list(page),
  queryFn: () => getShips({ page: page.value }),
  staleTime: STALE_TIME.ships,
  placeholderData: keepPreviousData,
})

const rows = computed(
  () =>
    data.value?.data.map((ship) => ({
      ...ship,
      displayRole: toReadableText(ship.registration.role),
      displayStatus: toReadableText(ship.nav.status),
      position: ship.nav.waypointSymbol,
      eta: formatEta(ship),
      fuelPercent: percentOf(ship.fuel.current, ship.fuel.capacity),
      cargoPercent: percentOf(ship.cargo.units, ship.cargo.capacity),
    })) ?? [],
)

const filteredRows = computed(() => {
  const needle = filterText.value.trim().toLowerCase()
  if (!needle) return rows.value
  return rows.value.filter(
    (row) =>
      row.symbol.toLowerCase().includes(needle) ||
      row.displayRole.toLowerCase().includes(needle) ||
      row.displayStatus.toLowerCase().includes(needle),
  )
})
</script>

<template>
  <div class="p-8">
    <PageHeader title="Fleet">
      <template #description>
        <p class="mt-1 max-w-2xl text-[14px] text-muted">
          Your fleet is every ship under your command — vessels that explore, trade, mine, and
          defend your interests across known space. A fleet at rest earns nothing — keep them moving
          !
        </p>
      </template>
    </PageHeader>

    <DataTable
      v-model:page="page"
      v-model:filter-text="filterText"
      :rows="filteredRows"
      data-key="symbol"
      :is-pending="isPending"
      :is-fetching="isFetching"
      :is-error="isError"
      :error="error"
      error-message="Failed to load fleet."
      :total="data?.meta.total ?? 0"
      :limit="data?.meta.limit ?? 1"
      item-label="ships"
      filter-placeholder="Filter by symbol, role or status"
      @retry="() => refetch()"
    >
      <Column field="symbol" header="Symbol" sortable>
        <template #body="{ data: row }">
          <RouterLink :to="`/fleet/${row.symbol}`" class="text-info hover:underline">
            {{ row.symbol }}
          </RouterLink>
        </template>
      </Column>
      <Column field="displayRole" header="Role" sortable />
      <Column field="displayStatus" header="Status" sortable>
        <template #body="{ data: row }">
          <ShipStatusBadge :status="row.nav.status" />
        </template>
      </Column>
      <Column field="position" header="Position" sortable />
      <Column header="ETA">
        <template #body="{ data: row }">{{ row.eta }}</template>
      </Column>
      <Column field="cargoPercent" header="Cargo" sortable>
        <template #body="{ data: row }">
          <GaugeBar :percent="row.cargoPercent" label="Cargo" />
        </template>
      </Column>
      <Column field="fuelPercent" header="Fuel" sortable>
        <template #body="{ data: row }">
          <GaugeBar :percent="row.fuelPercent" label="Fuel" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
