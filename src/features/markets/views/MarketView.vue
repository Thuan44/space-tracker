<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import Column from 'primevue/column'
import { getMarket, marketKeys } from '../api/market'
import type { MarketTradeGood, TradeGoodInfo } from '../api/market.schema'
import { systemSymbolFromWaypoint, toReadableText } from '@/shared/lib/spacetraders'
import { STALE_TIME } from '@/shared/api/query-config'
import PageHeader from '@/shared/ui/PageHeader.vue'
import QueryErrorBanner from '@/shared/ui/QueryErrorBanner.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import BackLink from '@/shared/ui/BackLink.vue'

const route = useRoute()
const waypointSymbol = computed(() => route.params.waypointSymbol as string)
const systemSymbol = computed(() => systemSymbolFromWaypoint(waypointSymbol.value))

const {
  data: market,
  isPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: marketKeys.detail(waypointSymbol),
  queryFn: () => getMarket(systemSymbol.value, waypointSymbol.value),
  staleTime: STALE_TIME.market,
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
    <BackLink :to="`/systems/${systemSymbol}`">Back to system</BackLink>

    <SkeletonBlock v-if="isPending" class="mt-6" height-class="h-28" />

    <QueryErrorBanner
      v-else-if="isError"
      class="mt-6"
      :error="error"
      fallback-message="Failed to load market."
      @retry="() => refetch()"
    />

    <template v-else-if="market">
      <PageHeader class="mt-6" typewriter :title="market.symbol">
        <template #description>
          <p class="mt-1 max-w-2xl text-[14px] text-muted">
            Markets are trading posts found at select waypoints, listing the goods you can export,
            import, or exchange here. Prices move with supply and activity — and with every deal
            your agents make. Buy low, sell high — fortune favors the trader who watches the board !
          </p>
        </template>
      </PageHeader>

      <div
        v-if="!hasTradeGoods"
        class="mt-6 rounded-md border border-warn/30 bg-warn/10 px-5 py-3 text-data text-warn"
      >
        Limited market info: an agent ship must be present at this waypoint to see prices, volume,
        supply and activity.
      </div>

      <DataTable
        class="mt-6"
        v-model:filter-text="filterText"
        :rows="filteredRows"
        data-key="symbol"
        :is-pending="false"
        :is-error="false"
        :error="null"
        error-message="Failed to load market goods."
        filter-placeholder="Filter by name or type"
      >
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
      </DataTable>
    </template>
  </div>
</template>
