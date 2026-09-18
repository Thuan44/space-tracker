<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { User, Wallet, Send, MapMarker } from '@primeicons/vue'
import { useAgentQuery } from '@/features/auth/composables/useAgentQuery'
import { getShips } from '@/features/fleet/api/ship'
import type { Ship } from '@/features/fleet/api/ship.schema'
import { percentOf, systemSymbolFromWaypoint, toReadableText } from '@/shared/lib/spacetraders'
import CountUpNumber from '@/shared/ui/CountUpNumber.vue'
import GaugeBar from '@/shared/ui/GaugeBar.vue'
import StatTile from '../components/StatTile.vue'

function fuelPercent(ship: Ship): number {
  return percentOf(ship.fuel.current, ship.fuel.capacity)
}

const { data: agent, isPending, isError, refetch } = useAgentQuery()

const {
  data: shipsPage,
  isPending: shipsPending,
  isError: shipsError,
  refetch: refetchShips,
} = useQuery({
  queryKey: ['ships', 'preview'],
  queryFn: () => getShips({ limit: 5 }),
})

const statusBadgeClasses: Record<Ship['nav']['status'], string> = {
  DOCKED: 'border-accent/30 bg-accent/10 text-accent',
  IN_TRANSIT: 'border-warn/30 bg-warn/10 text-warn',
  IN_ORBIT: 'border-info/30 bg-info/10 text-info',
}
</script>

<template>
  <div class="p-8">
    <h2 class="text-[20px] font-semibold uppercase tracking-[0.06em] text-accent">Agent</h2>

    <div v-if="isPending" class="mt-4 grid grid-cols-2 gap-6 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-[124px] animate-pulse rounded-md border border-line bg-surface-1" />
    </div>

    <div v-else-if="isError"
      class="mt-4 flex h-[124px] items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5">
      <p class="text-[13px] text-danger">Failed to load agent data.</p>
      <button type="button"
        class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
        @click="() => refetch()">
        Retry
      </button>
    </div>

    <div v-else-if="agent" class="mt-4 grid grid-cols-2 gap-6 lg:grid-cols-4">
      <StatTile label="Identity" :icon="User">
        <div class="flex items-end justify-between gap-2">
          <span class="truncate text-2xl font-semibold text-fg">{{ agent.symbol }}</span>
          <span
            class="shrink-0 rounded-xs border border-line bg-surface-2 px-2 py-0.5 text-[14px] font-semibold uppercase tracking-[0.09em] text-muted">
            {{ agent.startingFaction }}
          </span>
        </div>
      </StatTile>

      <StatTile label="Credits" :icon="Wallet">
        <CountUpNumber v-slot="{ value }" :value="agent.credits">
          <span class="truncate text-[2.5rem] leading-none font-semibold text-fg">{{ value.toLocaleString() }}</span>
        </CountUpNumber>
      </StatTile>

      <StatTile label="Ships" :icon="Send">
        <CountUpNumber v-slot="{ value }" :value="agent.shipCount">
          <span class="truncate text-[2.5rem] leading-none font-semibold text-fg">{{ value }}</span>
        </CountUpNumber>
      </StatTile>

      <StatTile label="Starting system" :icon="MapMarker">
        <RouterLink :to="`/systems/${systemSymbolFromWaypoint(agent.headquarters)}`"
          class="text-2xl font-semibold text-info hover:underline">
          {{ systemSymbolFromWaypoint(agent.headquarters) }} &rarr;
        </RouterLink>
      </StatTile>
    </div>

    <div class="mt-8">
      <div class="flex items-end justify-between">
        <h2 class="text-[20px] font-semibold uppercase tracking-[0.06em] text-accent">Fleet preview</h2>
        <RouterLink to="/fleet" class="text-[13px] font-semibold uppercase tracking-[0.09em] text-info hover:underline">
          View full fleet &rarr;</RouterLink>
      </div>

      <div v-if="shipsPending" class="mt-4 h-48 animate-pulse rounded-md border border-line bg-surface-1" />

      <div v-else-if="shipsError"
        class="mt-4 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5">
        <p class="text-[13px] text-danger">Failed to load fleet data.</p>
        <button type="button"
          class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
          @click="() => refetchShips()">
          Retry
        </button>
      </div>

      <div v-else-if="shipsPage" class="mt-6 overflow-hidden rounded-md border border-line bg-surface-1">
        <table class="w-full table-fixed border-collapse">
          <colgroup>
            <col class="w-[25%]" />
            <col class="w-[25%]" />
            <col class="w-[25%]" />
            <col class="w-[25%]" />
          </colgroup>
          <thead class="bg-surface-2">
            <tr class="border-b border-line">
              <th class="h-12 px-4 text-left text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">
                Symbol
              </th>
              <th class="h-12 px-4 text-left text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">
                Status
              </th>
              <th class="h-12 px-4 text-left text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">
                Position
              </th>
              <th class="h-12 px-4 text-left text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">
                Fuel
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="shipsPage.data.length === 0">
              <td colspan="4" class="px-4 py-4 text-base text-muted">No ships yet.</td>
            </tr>
            <tr v-for="ship in shipsPage.data" :key="ship.symbol"
              class="h-12 border-b border-line last:border-0 hover:bg-surface-2">
              <td class="truncate px-4 text-base text-fg">
                <RouterLink :to="`/fleet/${ship.symbol}`" class="text-info hover:underline">
                  {{ ship.symbol }}
                </RouterLink>
              </td>
              <td class="px-4 text-base">
                <span class="rounded-xs border px-2 py-0.5 text-[14px] font-semibold uppercase tracking-[0.09em]"
                  :class="statusBadgeClasses[ship.nav.status]">
                  {{ toReadableText(ship.nav.status) }}
                </span>
              </td>
              <td class="truncate px-4 text-base text-fg">{{ ship.nav.waypointSymbol }}</td>
              <td class="px-4 text-base">
                <GaugeBar :percent="fuelPercent(ship)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
