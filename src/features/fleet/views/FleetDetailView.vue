<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink, useRoute } from 'vue-router'
import { Users, Box, Wrench } from '@primeicons/vue'
import { getShip, shipKeys } from '../api/ship'
import type { Ship } from '../api/ship.schema'
import { getWaypoint, waypointKeys } from '@/features/systems/api/waypoint'
import { percentOf, systemSymbolFromWaypoint, toReadableText } from '@/shared/lib/spacetraders'
import { STALE_TIME } from '@/shared/api/query-config'
import TypewriterText from '@/shared/ui/TypewriterText.vue'
import GaugeBar from '@/shared/ui/GaugeBar.vue'

const route = useRoute()
const shipSymbol = computed(() => route.params.shipSymbol as string)

const {
  data: ship,
  isPending,
  isError,
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

const statusBadgeClasses: Record<Ship['nav']['status'], string> = {
  DOCKED: 'border-accent/30 bg-accent/10 text-accent',
  IN_TRANSIT: 'border-warn/30 bg-warn/10 text-warn',
  IN_ORBIT: 'border-info/30 bg-info/10 text-info',
}

function eta(ship: Ship): string {
  return ship.nav.status === 'IN_TRANSIT' ? new Date(ship.nav.route.arrival).toLocaleString() : '—'
}

function cooldownText(ship: Ship): string {
  return ship.cooldown.remainingSeconds > 0 ? `${ship.cooldown.remainingSeconds}s` : 'None'
}
</script>

<template>
  <div class="p-8">
    <RouterLink
      to="/fleet"
      class="text-[13px] font-semibold uppercase tracking-[0.09em] text-info hover:underline"
    >
      <span aria-hidden="true">&larr;</span> Back to fleet
    </RouterLink>

    <div
      v-if="isPending"
      class="mt-6 h-40 animate-pulse rounded-md border border-line bg-surface-1"
    />

    <div
      v-else-if="isError"
      class="mt-6 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5"
    >
      <p class="text-[13px] text-danger">Failed to load ship.</p>
      <button
        type="button"
        class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
        @click="() => refetch()"
      >
        Retry
      </button>
    </div>

    <template v-else-if="ship">
      <div class="mt-6 flex items-center gap-4">
        <h1 class="text-[28px] font-semibold tracking-[0.02em] text-accent">
          <TypewriterText :text="ship.symbol" />
        </h1>
        <span
          class="rounded-xs border px-2 py-0.5 text-[14px] font-semibold uppercase tracking-[0.09em]"
          :class="statusBadgeClasses[ship.nav.status]"
        >
          {{ toReadableText(ship.nav.status) }}
        </span>
      </div>
      <p class="mt-1 text-[13px] text-muted">{{ toReadableText(ship.registration.role) }}</p>

      <div class="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-line pb-6">
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Position</span
          >
          <div class="mt-1 flex items-center gap-2">
            <span class="text-[15px] font-semibold text-fg">{{ ship.nav.waypointSymbol }}</span>
            <RouterLink
              v-if="hasMarket"
              :to="`/markets/${ship.nav.waypointSymbol}`"
              class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] border-info/40 text-info hover:bg-info/10"
            >
              Market
            </RouterLink>
          </div>
        </div>
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >ETA</span
          >
          <span class="mt-1 block text-[15px] font-semibold text-fg">{{ eta(ship) }}</span>
        </div>
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Fuel</span
          >
          <div class="mt-1">
            <GaugeBar
              :percent="percentOf(ship.fuel.current, ship.fuel.capacity)"
              bar-width-class="w-24"
              label="Fuel"
            >
              <span class="text-[13px] text-muted"
                >{{ ship.fuel.current }}/{{ ship.fuel.capacity }}</span
              >
            </GaugeBar>
          </div>
        </div>
        <div>
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Cooldown</span
          >
          <span class="mt-1 block text-[15px] font-semibold text-fg">{{ cooldownText(ship) }}</span>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-6">
        <div class="rounded-md border border-line bg-surface-1 p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-[13px] font-semibold uppercase tracking-[0.12em] text-fg">Crew</h2>
            <Users class="size-4 text-muted" />
          </div>

          <div class="mt-3 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
                >Members</span
              >
              <span class="mt-1 block text-[15px] font-semibold text-fg">
                {{ ship.crew.current }}/{{ ship.crew.required }} (max {{ ship.crew.capacity }})
              </span>
            </div>
            <div>
              <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
                >Morale</span
              >
              <span class="mt-1 block text-[15px] font-semibold text-fg"
                >{{ ship.crew.morale }}%</span
              >
            </div>
            <div>
              <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
                >Rotation</span
              >
              <span class="mt-1 block text-[15px] font-semibold text-fg">{{
                toReadableText(ship.crew.rotation)
              }}</span>
            </div>
            <div>
              <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
                >Wages</span
              >
              <span class="mt-1 block text-[15px] font-semibold text-fg">{{
                ship.crew.wages.toLocaleString()
              }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-md border border-line bg-surface-1 p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-[13px] font-semibold uppercase tracking-[0.12em] text-fg">
              Cargo &middot; {{ ship.cargo.units }}/{{ ship.cargo.capacity }}
            </h2>
            <Box class="size-4 text-muted" />
          </div>

          <p v-if="ship.cargo.inventory.length === 0" class="mt-3 text-[13px] text-muted">
            Cargo hold is empty.
          </p>

          <table v-else class="mt-3 w-full text-left text-[13px]">
            <thead>
              <tr class="border-b border-line text-[12px] uppercase tracking-[0.09em] text-muted">
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
        </div>
      </div>

      <div class="mt-6 rounded-md border border-line bg-surface-1 p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-[13px] font-semibold uppercase tracking-[0.12em] text-fg">Components</h2>
          <Wrench class="size-4 text-muted" />
        </div>

        <div class="mt-3 flex flex-wrap gap-x-10 gap-y-4">
          <div
            v-for="component in [
              { label: 'Frame', data: ship.frame },
              { label: 'Reactor', data: ship.reactor },
              { label: 'Engine', data: ship.engine },
            ]"
            :key="component.label"
          >
            <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted">{{
              component.label
            }}</span>
            <span class="mt-1 block text-[15px] font-semibold text-fg">{{
              component.data.name
            }}</span>
            <div class="mt-1">
              <GaugeBar
                :percent="percentOf(component.data.condition, 1)"
                bar-width-class="w-24"
                :label="`${component.label} condition`"
              >
                <template #default="{ percent }">
                  <span class="text-[13px] text-muted">{{ percent }}%</span>
                </template>
              </GaugeBar>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Modules</span
          >
          <div v-if="ship.modules.length === 0" class="mt-2 text-[13px] text-muted">&mdash;</div>
          <div v-else class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="mod in ship.modules"
              :key="mod.symbol"
              class="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted"
            >
              {{ mod.name }}
            </span>
          </div>
        </div>

        <div class="mt-4">
          <span class="block text-[12px] font-semibold uppercase tracking-[0.09em] text-muted"
            >Mounts</span
          >
          <div v-if="ship.mounts.length === 0" class="mt-2 text-[13px] text-muted">&mdash;</div>
          <div v-else class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="mount in ship.mounts"
              :key="mount.symbol"
              class="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted"
            >
              {{ mount.name }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
