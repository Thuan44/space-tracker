<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { Users, Box, Wrench, Sync, ArrowDown, Send, Bolt } from '@primeicons/vue'
import Select from 'primevue/select'
import { getShip, shipKeys } from '../api/ship'
import type { Ship } from '../api/ship.schema'
import ShipStatusBadge from '../components/ShipStatusBadge.vue'
import { formatEta } from '../lib/eta'
import { getWaypoint, waypointKeys, getAllWaypoints } from '@/features/systems/api/waypoint'
import type { WaypointTrait } from '@/features/systems/api/waypoint.schema'
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
import ActionButton from '@/shared/ui/ActionButton.vue'
import { useShipNavigation } from '../composables/useShipNavigation'
import { getErrorMessage } from '@/shared/lib/error-message'

const route = useRoute()
const shipSymbol = computed(() => route.params.shipSymbol as string)

const {
  data: ship,
  isPending: shipPending,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: shipKeys.detail(shipSymbol),
  queryFn: () => getShip(shipSymbol.value),
  staleTime: STALE_TIME.ships,
  refetchInterval: (query) => (query.state.data?.nav.status === 'IN_TRANSIT' ? 10000 : false),
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

const { orbit, dock, navigate, refuel } = useShipNavigation()

const selectedWaypointSymbol = ref<string | null>(null)

const waypointsSystemSymbol = computed(() => waypointSystemSymbol.value ?? '')

const { data: waypointsData } = useQuery({
  queryKey: waypointKeys.all(waypointsSystemSymbol),
  queryFn: () => getAllWaypoints(waypointSystemSymbol.value!),
  enabled: computed(() => !!waypointSystemSymbol.value && ship.value?.nav.status === 'IN_ORBIT'),
  staleTime: STALE_TIME.waypoints,
})

const waypointOptions = computed(() => {
  if (!waypointsData.value || !ship.value) return []
  return waypointsData.value
    .filter((wp) => wp.symbol !== ship.value.nav.waypointSymbol)
    .map((wp) => ({
      label: wp.symbol,
      value: wp.symbol,
      traits: wp.traits,
    }))
})

const isPending = computed(
  () =>
    orbit.isPending.value ||
    dock.isPending.value ||
    navigate.isPending.value ||
    refuel.isPending.value,
)

const canRefuel = computed(() => ship.value && ship.value.fuel.current < ship.value.fuel.capacity)

const navigationError = computed(() => {
  const error = orbit.error.value ?? dock.error.value ?? navigate.error.value ?? refuel.error.value
  return error ? getErrorMessage(error, 'Action failed. Check ship status and try again.') : null
})

function handleOrbit() {
  if (!ship.value) return
  orbit.mutate(ship.value.symbol)
}

function handleDock() {
  if (!ship.value) return
  dock.mutate(ship.value.symbol)
}

function handleNavigate() {
  if (!ship.value || !selectedWaypointSymbol.value) return
  navigate.mutate({
    shipSymbol: ship.value.symbol,
    waypointSymbol: selectedWaypointSymbol.value,
  })
  selectedWaypointSymbol.value = null
}

function handleRefuel() {
  if (!ship.value) return
  refuel.mutate(ship.value.symbol)
}

function cooldownText(ship: Ship): string {
  return ship.cooldown.remainingSeconds > 0 ? `${ship.cooldown.remainingSeconds}s` : 'None'
}
</script>

<template>
  <div class="p-8">
    <BackLink to="/fleet">Back to fleet</BackLink>

    <SkeletonBlock v-if="shipPending" class="mt-6" height-class="h-40" />

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

      <div class="mt-6 border-b border-line pb-6">
        <h3 class="mb-3 text-label-lg font-semibold uppercase tracking-label text-muted">
          Navigation
        </h3>

        <p v-if="navigationError" role="alert" class="mb-4 text-data text-danger">
          {{ navigationError }}
        </p>

        <p
          v-if="ship.nav.status === 'IN_ORBIT' && selectedWaypointSymbol && ship.fuel.current === 0"
          class="mb-4 w-fit rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-data text-warn"
        >
          No fuel remaining: this trip will drift and take much longer than usual.
        </p>

        <Transition
          mode="out-in"
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="ship.nav.status === 'IN_TRANSIT'"
            key="in-transit"
            class="text-data text-muted"
          >
            Ship is in transit.
          </div>

          <div v-else-if="ship.nav.status === 'DOCKED'" key="docked" class="flex flex-wrap gap-3">
            <ActionButton :icon="Sync" :disabled="isPending" @click="handleOrbit">
              {{ orbit.isPending.value ? 'Orbiting...' : 'Orbit' }}
            </ActionButton>
            <ActionButton v-if="canRefuel" :icon="Bolt" :disabled="isPending" @click="handleRefuel">
              {{ refuel.isPending.value ? 'Refueling...' : 'Refuel' }}
            </ActionButton>
          </div>

          <div
            v-else-if="ship.nav.status === 'IN_ORBIT'"
            key="in-orbit"
            class="flex flex-wrap gap-4"
          >
            <ActionButton :icon="ArrowDown" :disabled="isPending" @click="handleDock">
              {{ dock.isPending.value ? 'Docking...' : 'Dock' }}
            </ActionButton>

            <Select
              id="waypoint-select"
              v-model="selectedWaypointSymbol"
              :options="waypointOptions"
              option-label="label"
              option-value="value"
              placeholder="Select waypoint"
              :disabled="isPending"
              class="w-64 rounded-sm border border-line bg-surface-0 text-data text-fg focus:border-accent focus:outline-none disabled:opacity-60"
              pt:root:class="h-10 flex items-center"
              pt:label:class="px-3 text-data flex-1"
              pt:dropdown:class="px-3 flex items-center"
              pt:overlay:class="mt-1 rounded-sm border border-line bg-surface-1 shadow-lg max-h-60 overflow-auto"
              pt:list:class="py-1"
              pt:option:class="px-3 py-2 text-data text-fg hover:bg-surface-2 cursor-pointer"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span>{{ option.label }}</span>
                  <PillBadge
                    v-if="option.traits.some((t: WaypointTrait) => t.symbol === 'MARKETPLACE')"
                    variant="info"
                  >
                    Marketplace
                  </PillBadge>
                </div>
              </template>
            </Select>
            <ActionButton
              :icon="Send"
              :disabled="isPending || !selectedWaypointSymbol"
              @click="handleNavigate"
            >
              {{ navigate.isPending.value ? 'Navigating...' : 'Navigate' }}
            </ActionButton>
          </div>
        </Transition>
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
