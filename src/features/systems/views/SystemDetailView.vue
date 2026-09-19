<script setup lang="ts">
import { computed, ref } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { RouterLink, useRoute } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator, { type PageState } from 'primevue/paginator'
import { getSystem, systemKeys } from '../api/system'
import { getWaypoints, waypointKeys } from '../api/waypoint'
import { toReadableText } from '@/shared/lib/spacetraders'
import { STALE_TIME } from '@/shared/api/query-config'
import TypewriterText from '@/shared/ui/TypewriterText.vue'

const route = useRoute()
const systemSymbol = computed(() => route.params.systemSymbol as string)

const {
  data: system,
  isPending,
  isError,
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

function onWaypointsPage(event: PageState) {
  waypointsPage.value = event.page + 1
}

const totalWaypointsPages = computed(() =>
  waypointsData.value
    ? Math.max(1, Math.ceil(waypointsData.value.meta.total / waypointsData.value.meta.limit))
    : 1,
)

const traitBadgeClasses: Record<'MARKETPLACE' | 'SHIPYARD' | 'UNCHARTED' | 'default', string> = {
  MARKETPLACE: 'border-info/40 text-info hover:bg-info/10',
  SHIPYARD: 'border-accent/30 bg-accent/10 text-accent',
  UNCHARTED: 'border-dashed border-line text-muted italic opacity-70',
  default: 'border-line bg-surface-2 text-muted',
}

function traitClasses(trait: string): string {
  if (trait === 'MARKETPLACE') return traitBadgeClasses.MARKETPLACE
  if (trait === 'SHIPYARD') return traitBadgeClasses.SHIPYARD
  if (trait === 'UNCHARTED') return traitBadgeClasses.UNCHARTED
  return traitBadgeClasses.default
}
</script>

<template>
  <div class="p-8">
    <RouterLink
      to="/systems"
      class="text-[13px] font-semibold uppercase tracking-[0.09em] text-info hover:underline"
    >
      <span aria-hidden="true">&larr;</span> Back to systems
    </RouterLink>

    <div
      v-if="isPending"
      class="mt-6 h-28 animate-pulse rounded-md border border-line bg-surface-1"
    />

    <div
      v-else-if="isError"
      class="mt-6 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5"
    >
      <p class="text-[13px] text-danger">Failed to load system.</p>
      <button
        type="button"
        class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
        @click="() => refetch()"
      >
        Retry
      </button>
    </div>

    <template v-else-if="system">
      <h1 class="mt-6 text-[28px] font-semibold tracking-[0.02em] text-accent">
        <TypewriterText :text="system.symbol" />
      </h1>
      <p v-if="system.name && system.name !== system.symbol" class="mt-1 text-[13px] text-muted">
        {{ system.name }}
      </p>

      <div class="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-6">
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Sector</span
          >
          <span class="mt-1 block text-[15px] font-semibold text-fg">{{
            system.sectorSymbol
          }}</span>
        </div>
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Constellation</span
          >
          <span class="mt-1 block text-[15px] font-semibold text-fg">{{
            system.constellation
          }}</span>
        </div>
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Star type</span
          >
          <span class="mt-1 block text-[15px] font-semibold text-fg">{{
            toReadableText(system.type)
          }}</span>
        </div>
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Coordinates</span
          >
          <span class="mt-1 block text-[15px] font-semibold text-fg"
            >{{ system.x }}, {{ system.y }}</span
          >
        </div>
      </div>
    </template>

    <div v-if="system" class="mt-6">
      <h2 class="text-[13px] font-semibold uppercase tracking-[0.12em] text-fg">Waypoints</h2>

      <input
        v-model="waypointsFilterText"
        type="text"
        placeholder="Filter by symbol, type or trait"
        aria-label="Filter by symbol, type or trait"
        class="mt-3 block w-full max-w-sm rounded-sm border border-line bg-surface-0 px-3 py-2 text-[13px] text-fg placeholder-muted focus:border-accent focus:outline-none"
      />

      <div
        v-if="waypointsPending"
        class="mt-4 h-96 animate-pulse rounded-md border border-line bg-surface-1"
      />

      <div
        v-else-if="waypointsError"
        class="mt-4 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5"
      >
        <p class="text-[13px] text-danger">Failed to load waypoints.</p>
        <button
          type="button"
          class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
          @click="() => refetchWaypoints()"
        >
          Retry
        </button>
      </div>

      <template v-else-if="waypointsData">
        <DataTable
          :value="filteredWaypointRows"
          data-key="symbol"
          class="mt-4 transition-opacity"
          :class="{ 'opacity-60': waypointsFetching }"
        >
          <Column field="symbol" header="Symbol" sortable>
            <template #body="{ data: row }">{{ row.symbol }}</template>
          </Column>
          <Column field="type" header="Type" sortable>
            <template #body="{ data: row }">{{ row.displayType }}</template>
          </Column>
          <Column header="Traits">
            <template #body="{ data: row }">
              <div v-if="row.traits.length === 0" class="text-[13px] text-muted">&mdash;</div>
              <div v-else class="flex flex-wrap gap-2">
                <template v-for="trait in row.traits" :key="trait.symbol">
                  <RouterLink
                    v-if="trait.symbol === 'MARKETPLACE'"
                    :to="`/markets/${row.symbol}`"
                    class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.09em]"
                    :class="traitClasses(trait.symbol)"
                  >
                    {{ trait.name }}
                  </RouterLink>
                  <span
                    v-else
                    class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.09em]"
                    :class="traitClasses(trait.symbol)"
                  >
                    {{ trait.name }}
                  </span>
                </template>
              </div>
            </template>
          </Column>
        </DataTable>

        <Paginator
          :rows="waypointsData.meta.limit"
          :total-records="waypointsData.meta.total"
          :first="(waypointsPage - 1) * waypointsData.meta.limit"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          class="mt-4"
          @page="onWaypointsPage"
        >
          <template #start>
            <span class="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
              Page {{ waypointsPage }} of {{ totalWaypointsPages }} &middot;
              {{ waypointsData.meta.total }} waypoints
            </span>
          </template>
        </Paginator>
      </template>
    </div>
  </div>
</template>
