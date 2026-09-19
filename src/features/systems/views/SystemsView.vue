<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Column from 'primevue/column'
import DataTable from '@/shared/ui/DataTable.vue'
import CountUpNumber from '@/shared/ui/CountUpNumber.vue'
import { useSystemsQuery } from '../composables/useSystemsQuery'
import PageHeader from '@/shared/ui/PageHeader.vue'
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

const { data, isPending, isFetching, isError, error, refetch } = useSystemsQuery(page)

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
      row.symbol.toLowerCase().includes(needle) ||
      row.name?.toLowerCase().includes(needle) ||
      row.sectorSymbol.toLowerCase().includes(needle) ||
      row.type.toLowerCase().includes(needle),
  )
})
</script>

<template>
  <div class="p-8">
    <PageHeader title="Systems">
      <template #description>
        <p class="mt-1 max-w-2xl text-[14px] text-muted">
          Systems are clusters of waypoints — planets, moons, asteroid fields, gas giants, and
          stations — grouped into sectors across the galaxy. The stars won't chart themselves — go
          stake your claim !
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
      error-message="Failed to load systems."
      :total="data?.meta.total ?? 0"
      :limit="data?.meta.limit ?? 1"
      item-label="systems"
      filter-placeholder="Filter by symbol, name, sector or star type"
      @retry="() => refetch()"
    >
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
      <Column field="waypointCount" header="Waypoints" sortable>
        <template #body="{ data: row }">
          <CountUpNumber :value="row.waypointCount" />
        </template>
      </Column>

      <template #toolbar-end>
        <form class="flex gap-2" @submit.prevent="handleExplore">
          <input
            v-model="searchSymbol"
            type="text"
            placeholder="Explore system symbol, e.g. X1-DF55"
            aria-label="Explore system symbol"
            class="block w-96 rounded-sm border border-line bg-surface-0 px-3 py-2 text-data text-fg placeholder-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            :disabled="!parsedSymbol.success"
            class="flex h-10 w-fit shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm bg-accent px-4 text-data font-semibold text-surface-0 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Explore
          </button>
        </form>
      </template>
    </DataTable>
  </div>
</template>
