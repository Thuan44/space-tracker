<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator, { type PageState } from 'primevue/paginator'
import { useSystemsQuery } from '../composables/useSystemsQuery'
import { toReadableText } from '@/shared/lib/spacetraders'
import { symbolSchema } from '../lib/symbol.schema'

const router = useRouter()

const page = ref(1)
const filterText = ref('')

const searchSymbol = ref('')

const parsedSymbol = computed(() => symbolSchema.safeParse(searchSymbol.value))

function handleExplore() {
  if (!parsedSymbol.value.success) return

  router.push(`/systems/${parsedSymbol.value.data}`)
}

const { data, isPending, isError, refetch } = useSystemsQuery(page)

const rows = computed(
  () =>
    data.value?.data.map((system) => ({
      ...system,
      displayName: system.name ?? system.symbol,
      waypointCount: system.waypoints.length,
    })) ?? [],
)

const filteredRows = computed(() => {
  const needle = filterText.value.trim().toLowerCase()
  if (!needle) return rows.value
  return rows.value.filter(
    (row) =>
      row.symbol.toLowerCase().includes(needle) || row.name?.toLowerCase().includes(needle) || row.sectorSymbol.toLowerCase().includes(needle) || row.type.toLowerCase().includes(needle),
  )
})

function onPage(event: PageState) {
  page.value = event.page + 1
}

const totalPages = computed(() =>
  data.value ? Math.max(1, Math.ceil(data.value.meta.total / data.value.meta.limit)) : 1,
)
</script>

<template>
  <div class="p-8">
    <h2 class="text-[20px] font-semibold uppercase tracking-[0.06em] text-accent">Systems</h2>

    <div class="mt-4 flex flex-wrap items-start gap-4">
      <input v-model="filterText" type="text" placeholder="Filter by symbol, name, sector or star type"
        class="block w-full max-w-sm rounded-sm border border-line bg-surface-0 px-3 py-2 text-[13px] text-fg placeholder-muted focus:border-accent focus:outline-none" />

      <form class="flex gap-2" @submit.prevent="handleExplore">
        <input v-model="searchSymbol" type="text" placeholder="Explore system symbol, e.g. X1-DF55"
          class="block w-96 rounded-sm border border-line bg-surface-0 px-3 py-2 text-[13px] text-fg placeholder-muted focus:border-accent focus:outline-none" />
        <button type="submit" :disabled="!parsedSymbol.success"
          class="flex h-10 w-32 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm bg-accent px-4 text-[13px] font-semibold text-surface-0 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
          Explore
        </button>
      </form>
    </div>

    <div v-if="isPending" class="mt-4 h-96 animate-pulse rounded-md border border-line bg-surface-1" />

    <div v-else-if="isError"
      class="mt-4 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5">
      <p class="text-[13px] text-danger">Failed to load systems.</p>
      <button type="button"
        class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
        @click="() => refetch()">
        Retry
      </button>
    </div>

    <template v-else-if="data">
      <DataTable :value="filteredRows" data-key="symbol" class="mt-4">
        <Column field="symbol" header="Symbol" sortable>
          <template #body="{ data: row }">
            <RouterLink :to="`/systems/${row.symbol}`" class="text-info hover:underline">
              {{ row.symbol }}
            </RouterLink>
          </template>
        </Column>
        <Column field="displayName" header="Name" sortable />
        <Column field="sectorSymbol" header="Sector" sortable />
        <Column field="type" header="Star type" sortable>
          <template #body="{ data: row }">{{ toReadableText(row.type) }}</template>
        </Column>
        <Column field="waypointCount" header="Waypoints" sortable />
      </DataTable>

      <Paginator :rows="data.meta.limit" :total-records="data.meta.total" :first="(page - 1) * data.meta.limit"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink" class="mt-4" @page="onPage">
        <template #start>
          <span class="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            Page {{ page }} of {{ totalPages }}
          </span>
        </template>
      </Paginator>
    </template>
  </div>
</template>
