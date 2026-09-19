<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { Users, Box, Wrench } from '@primeicons/vue'
import { getShip, shipKeys } from '../api/ship'
import type { Ship } from '../api/ship.schema'
import ShipStatusBadge from '../components/ShipStatusBadge.vue'
import { formatEta } from '../lib/eta'
import { getWaypoint, waypointKeys } from '@/features/systems/api/waypoint'
import { percentOf, systemSymbolFromWaypoint, toReadableText } from '@/shared/lib/spacetraders'
import { STALE_TIME } from '@/shared/api/query-config'
import PageHeader from '@/shared/ui/PageHeader.vue'
import GaugeBar from '@/shared/ui/GaugeBar.vue'
import QueryErrorBanner from '@/shared/ui/QueryErrorBanner.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import PillBadge from '@/shared/ui/PillBadge.vue'
import DetailField from '@/shared/ui/DetailField.vue'
import InfoPanel from '@/shared/ui/InfoPanel.vue'
import BackLink from '@/shared/ui/BackLink.vue'

const route = useRoute()
const shipSymbol = computed(() => route.params.shipSymbol as string)

const {
  data: ship,
  isPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: shipKeys.detail(shipSymbol),
  queryFn: () => getShip(shipSymbol.value),
  staleTime: STALE_TIME.ships,
})

const waypointSymbol = computed(() => ship.value?.nav.waypointSymbol)
const waypointSystemSymbol = computed(() =>
  waypointSymbol.value ? systemSymbolFromWaypoint(waypointSymbol.value) : undefined,
)

const { data: waypoint } = useQuery({
  queryKey: waypointKeys.detail(waypointSystemSymbol, waypointSymbol),
  queryFn: () => getWaypoint(waypointSystemSymbol.value!, waypointSymbol.value!),
  enabled: computed(() => !!waypointSymbol.value),
  staleTime: STALE_TIME.waypoints,
})

const hasMarket = computed(
  () => waypoint.value?.traits.some((trait) => trait.symbol === 'MARKETPLACE') ?? false,
)

function cooldownText(ship: Ship): string {
  return ship.cooldown.remainingSeconds > 0 ? `${ship.cooldown.remainingSeconds}s` : 'None'
}
</script>

<template>
  <div class="p-8">
    <BackLink to="/fleet">Back to fleet</BackLink>

    <SkeletonBlock v-if="isPending" class="mt-6" height-class="h-40" />

    <QueryErrorBanner
      v-else-if="isError"
      class="mt-6"
      :error="error"
      fallback-message="Failed to load ship."
      @retry="() => refetch()"
    />

    <template v-else-if="ship">
      <PageHeader class="mt-6" typewriter :title="ship.symbol">
        <template #badge>
          <ShipStatusBadge :status="ship.nav.status" />
        </template>
        <template #description>
          <p class="mt-1 text-data text-muted">{{ toReadableText(ship.registration.role) }}</p>
        </template>
      </PageHeader>

      <div class="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-6">
        <DetailField label="Position">
          <div class="flex items-center gap-2">
            <span class="text-[15px] font-semibold text-fg">{{ ship.nav.waypointSymbol }}</span>
            <PillBadge v-if="hasMarket" variant="info" :to="`/markets/${ship.nav.waypointSymbol}`">
              Market
            </PillBadge>
          </div>
        </DetailField>
        <DetailField label="ETA">
          <span class="text-[15px] font-semibold text-fg">{{ formatEta(ship) }}</span>
        </DetailField>
        <DetailField label="Fuel">
          <GaugeBar
            :percent="percentOf(ship.fuel.current, ship.fuel.capacity)"
            bar-width-class="w-24"
            label="Fuel"
          >
            <span class="text-data text-muted"
              >{{ ship.fuel.current }}/{{ ship.fuel.capacity }}</span
            >
          </GaugeBar>
        </DetailField>
        <DetailField label="Cooldown">
          <span class="text-[15px] font-semibold text-fg">{{ cooldownText(ship) }}</span>
        </DetailField>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-6">
        <InfoPanel title="Crew" :icon="Users">
          <div class="mt-3 flex flex-wrap gap-x-10 gap-y-4">
            <DetailField label="Members">
              <span class="text-[15px] font-semibold text-fg">
                {{ ship.crew.current }}/{{ ship.crew.required }} (max {{ ship.crew.capacity }})
              </span>
            </DetailField>
            <DetailField label="Morale">
              <span class="text-[15px] font-semibold text-fg">{{ ship.crew.morale }}%</span>
            </DetailField>
            <DetailField label="Rotation">
              <span class="text-[15px] font-semibold text-fg">{{
                toReadableText(ship.crew.rotation)
              }}</span>
            </DetailField>
            <DetailField label="Wages">
              <span class="text-[15px] font-semibold text-fg">{{
                ship.crew.wages.toLocaleString()
              }}</span>
            </DetailField>
          </div>
        </InfoPanel>

        <InfoPanel :title="`Cargo · ${ship.cargo.units}/${ship.cargo.capacity}`" :icon="Box">
          <p v-if="ship.cargo.inventory.length === 0" class="mt-3 text-data text-muted">
            Cargo hold is empty.
          </p>

          <table v-else class="mt-3 w-full text-left text-data">
            <thead>
              <tr class="border-b border-line text-label-lg uppercase tracking-label text-muted">
                <th class="py-2 font-semibold">Item</th>
                <th class="py-2 font-semibold">Units</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in ship.cargo.inventory"
                :key="item.symbol"
                class="border-b border-line last:border-0"
              >
                <td class="py-2 text-fg">{{ item.name }}</td>
                <td class="py-2 text-fg">{{ item.units }}</td>
              </tr>
            </tbody>
          </table>
        </InfoPanel>
      </div>

      <InfoPanel class="mt-6" title="Components" :icon="Wrench">
        <div class="mt-3 flex flex-wrap gap-x-10 gap-y-4">
          <DetailField
            v-for="component in [
              { label: 'Frame', data: ship.frame },
              { label: 'Reactor', data: ship.reactor },
              { label: 'Engine', data: ship.engine },
            ]"
            :key="component.label"
            :label="component.label"
          >
            <span class="block text-[15px] font-semibold text-fg">{{ component.data.name }}</span>
            <div class="mt-1">
              <GaugeBar
                :percent="percentOf(component.data.condition, 1)"
                bar-width-class="w-24"
                :label="`${component.label} condition`"
              >
                <template #default="{ percent }">
                  <span class="text-data text-muted">{{ percent }}%</span>
                </template>
              </GaugeBar>
            </div>
          </DetailField>
        </div>

        <div class="mt-6">
          <span class="block text-label-lg font-semibold uppercase tracking-label text-muted"
            >Modules</span
          >
          <div v-if="ship.modules.length === 0" class="mt-2 text-data text-muted">&mdash;</div>
          <div v-else class="mt-2 flex flex-wrap gap-2">
            <PillBadge v-for="mod in ship.modules" :key="mod.symbol" variant="muted">
              {{ mod.name }}
            </PillBadge>
          </div>
        </div>

        <div class="mt-4">
          <span class="block text-label-lg font-semibold uppercase tracking-label text-muted"
            >Mounts</span
          >
          <div v-if="ship.mounts.length === 0" class="mt-2 text-data text-muted">&mdash;</div>
          <div v-else class="mt-2 flex flex-wrap gap-2">
            <PillBadge v-for="mount in ship.mounts" :key="mount.symbol" variant="muted">
              {{ mount.name }}
            </PillBadge>
          </div>
        </div>
      </InfoPanel>
    </template>
  </div>
</template>
