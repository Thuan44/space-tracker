<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import Column from 'primevue/column'
import ProgressBar from 'primevue/progressbar'
import DataTable from '@/shared/ui/DataTable.vue'
import { getShips } from '../api/ship'
import type { Ship } from '../api/ship.schema'
import { percentOf, toReadableText } from '@/shared/lib/spacetraders'

const page = ref(1)
const filterText = ref('')

const { data, isPending, isError, refetch } = useQuery({
  queryKey: ['ships', page],
  queryFn: () => getShips({ page: page.value }),
})

const statusBadgeClasses: Record<Ship['nav']['status'], string> = {
  DOCKED: 'border-accent/30 bg-accent/10 text-accent',
  IN_TRANSIT: 'border-warn/30 bg-warn/10 text-warn',
  IN_ORBIT: 'border-info/30 bg-info/10 text-info',
}

const rows = computed(
  () =>
    data.value?.data.map((ship) => ({
      ...ship,
      displayRole: toReadableText(ship.registration.role),
      displayStatus: toReadableText(ship.nav.status),
      statusBadgeClass: statusBadgeClasses[ship.nav.status],
      position: ship.nav.waypointSymbol,
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

function eta(ship: Ship): string {
  return ship.nav.status === 'IN_TRANSIT' ? new Date(ship.nav.route.arrival).toLocaleString() : '—'
}
</script>

<template>
  <div class="p-8">
    <h2 class="text-[20px] font-semibold uppercase tracking-[0.06em] text-accent">Fleet</h2>

    <DataTable v-model:page="page" v-model:filter-text="filterText" :rows="filteredRows" data-key="symbol"
      :is-pending="isPending" :is-error="isError" error-message="Failed to load fleet." :total="data?.meta.total ?? 0"
      :limit="data?.meta.limit ?? 1" filter-placeholder="Filter by symbol, role or status" @retry="() => refetch()">
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
          <span class="rounded-xs border px-2 py-0.5 text-[14px] font-semibold uppercase tracking-[0.09em]"
            :class="row.statusBadgeClass">
            {{ row.displayStatus }}
          </span>
        </template>
      </Column>
      <Column field="position" header="Position" sortable />
      <Column header="ETA">
        <template #body="{ data: row }">{{ eta(row) }}</template>
      </Column>
      <Column field="cargoPercent" header="Cargo" sortable>
        <template #body="{ data: row }">
          <div class="flex items-center gap-2">
            <div class="h-2 min-w-0 flex-1">
              <ProgressBar :value="row.cargoPercent" :show-value="false" />
            </div>
            <span class="w-9 shrink-0 text-right text-[13px] text-muted">{{ row.cargoPercent }}%</span>
          </div>
        </template>
      </Column>
      <Column field="fuelPercent" header="Fuel" sortable>
        <template #body="{ data: row }">
          <div class="flex items-center gap-2">
            <div class="h-2 min-w-0 flex-1">
              <ProgressBar :value="row.fuelPercent" :show-value="false" />
            </div>
            <span class="w-9 shrink-0 text-right text-[13px] text-muted">{{ row.fuelPercent }}%</span>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
