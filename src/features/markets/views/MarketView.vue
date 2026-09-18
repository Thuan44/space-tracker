<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink, useRoute } from 'vue-router'
import PrimeDataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { getMarket } from '../api/market'
import type { MarketTradeGood, TradeGoodInfo } from '../api/market.schema'
import { systemSymbolFromWaypoint, toReadableText } from '@/shared/lib/spacetraders'

const route = useRoute()
const waypointSymbol = route.params.waypointSymbol as string
const systemSymbol = systemSymbolFromWaypoint(waypointSymbol)

const {
  data: market,
  isPending,
  isError,
  refetch,
} = useQuery({
  queryKey: ['market', waypointSymbol],
  queryFn: () => getMarket(systemSymbol, waypointSymbol),
})

const filterText = ref('')

type GoodType = 'EXPORT' | 'IMPORT' | 'EXCHANGE'

function toRows(goods: TradeGoodInfo[], type: GoodType, tradeGoods: MarketTradeGood[] | undefined) {
  return goods.map((good) => {
    const priced = tradeGoods?.find((tradeGood) => tradeGood.symbol === good.symbol)
    return {
      symbol: good.symbol,
      name: good.name,
      type,
      displayType: toReadableText(type),
      tradeVolume: priced?.tradeVolume,
      displaySupply: priced ? toReadableText(priced.supply) : undefined,
      displayActivity: priced?.activity ? toReadableText(priced.activity) : undefined,
      purchasePrice: priced?.purchasePrice,
      sellPrice: priced?.sellPrice,
    }
  })
}

const hasTradeGoods = computed(() => !!market.value?.tradeGoods)

const rows = computed(() => {
  if (!market.value) return []
  return [
    ...toRows(market.value.exports, 'EXPORT', market.value.tradeGoods),
    ...toRows(market.value.imports, 'IMPORT', market.value.tradeGoods),
    ...toRows(market.value.exchange, 'EXCHANGE', market.value.tradeGoods),
  ]
})

const filteredRows = computed(() => {
  const needle = filterText.value.trim().toLowerCase()
  if (!needle) return rows.value
  return rows.value.filter(
    (row) =>
      row.name.toLowerCase().includes(needle) || row.displayType.toLowerCase().includes(needle),
  )
})
</script>

<template>
  <div class="p-8">
    <RouterLink :to="`/systems/${systemSymbol}`"
      class="text-[13px] font-semibold uppercase tracking-[0.09em] text-info hover:underline">
      <span aria-hidden="true">&larr;</span> Back to system
    </RouterLink>

    <div v-if="isPending" class="mt-6 h-28 animate-pulse rounded-md border border-line bg-surface-1" />

    <div v-else-if="isError"
      class="mt-6 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5">
      <p class="text-[13px] text-danger">Failed to load market.</p>
      <button type="button"
        class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
        @click="() => refetch()">
        Retry
      </button>
    </div>

    <template v-else-if="market">
      <h2 class="mt-6 text-[28px] font-semibold tracking-[0.02em] text-accent">{{ market.symbol }}</h2>

      <div v-if="!hasTradeGoods"
        class="mt-6 rounded-md border border-warn/30 bg-warn/10 px-5 py-3 text-[13px] text-warn">
        Limited market info: an agent ship must be present at this waypoint to see prices, volume,
        supply and activity.
      </div>

      <input v-model="filterText" type="text" placeholder="Filter by name or type"
        class="mt-6 block w-full max-w-sm rounded-sm border border-line bg-surface-0 px-3 py-2 text-[13px] text-fg placeholder-muted focus:border-accent focus:outline-none" />

      <PrimeDataTable :value="filteredRows" data-key="symbol" class="mt-4">
        <Column field="name" header="Name" />
        <Column field="displayType" header="Type" />
        <template v-if="hasTradeGoods">
          <Column field="purchasePrice" header="Buy price" sortable>
            <template #body="{ data: row }">{{ row.purchasePrice?.toLocaleString() }}</template>
          </Column>
          <Column field="sellPrice" header="Sell price" sortable>
            <template #body="{ data: row }">{{ row.sellPrice?.toLocaleString() }}</template>
          </Column>
          <Column field="tradeVolume" header="Trade volume" sortable />
          <Column field="displaySupply" header="Supply" sortable />
          <Column field="displayActivity" header="Activity" sortable>
            <template #body="{ data: row }">
              <span v-if="row.displayActivity">{{ row.displayActivity }}</span>
              <span v-else>&mdash;</span>
            </template>
          </Column>
        </template>
      </PrimeDataTable>
    </template>
  </div>
</template>
