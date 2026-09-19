# Feature: Query staleTime, cache purge on logout, reactive query keys

**From build-plan:** feature 21
**Build attempt:** 1
**Status:** verified
**Branch:** feature/query-staletime-cache-purge-on-logout-reactive-query-keys

## Goal

Right now every query defaults to `staleTime: 0`, so returning to a screen or
refocusing the window always refetches. Logging out doesn't clear the Query
cache, so briefly the previous agent's data can flash on screen after logging
in as a different agent. Detail views (`SystemDetailView`, `FleetDetailView`,
`MarketView`) read `route.params.x` once into a plain `const`, so navigating
from one instance of the route to another (e.g. `/systems/X1-A` →
`/systems/X1-B`) reuses the component without refetching. This step fixes all
three: per-resource `staleTime`, a shared `logout(queryClient)` that purges
the cache, reactive route-param-driven query keys via factories, and
`keepPreviousData` on paginated queries so changing pages doesn't blank the
table.

## In scope

- Named `staleTime` constants per resource in `src/shared/api/query-config.ts`,
  and wiring them into every existing `useQuery` call.
- Query-key factories (`agentKeys`, `systemKeys`, `waypointKeys`, `shipKeys`,
  `marketKeys`), colocated with each feature's existing `api/*.ts` functions,
  replacing every ad hoc key array currently duplicated across composables
  and views.
- `SystemDetailView`, `FleetDetailView`, `MarketView` deriving their route
  param(s) as `computed` so their query keys (and any value built from that
  param) follow route navigation instead of staying frozen at mount.
- Removing the `enabled: !!system.value` cascade on `SystemDetailView`'s
  waypoints query (the waypoints section only renders once `system` is
  loaded, so no double error message depends on this guard).
- `placeholderData: keepPreviousData` on the three paginated queries
  (systems list, fleet list, waypoints list) and a `DataTable` `isFetching`
  affordance so a page change dims the table instead of either flashing a
  full skeleton or giving no feedback at all.
- `logout(queryClient)` in `src/features/auth/lib/logout.ts`: cancels
  in-flight queries, clears the cache, then clears the token store. Wired
  into `AppHeader`'s logout button and the `QueryCache` `onError` 401
  handler. `LoginView` calls `queryClient.clear()` before storing a newly
  entered token.

## Out of scope

- Seeding `['ship', symbol]` from the fleet list cache when opening a ship's
  detail page (explicitly optional in
  `blueprint/specs/post-release-improvements.md` step 6; a separate,
  independent optimization).
- Router `meta.requiresAuth` guard consolidation (build-plan #23).
- Zod schema enum robustness and the `MarketView` `find`-in-`map` fix
  (build-plan #24).
- `useCountUp` animation cleanup (build-plan #25).
- Filter/sort scope copy (build-plan #26).
- Any v2 candidate (auto-refresh, waypoint detail page, markets index, first
  mutation) (build-plan #27).

## Build loop

`workflow.stepReview` is `every`: pause for review after each step below
before continuing. `workflow.checkpointCommits` is `enabled`: an approved
step may get its own commit before `/complete`'s final merge commit.

## Build steps

- [x] 1. Add `src/shared/api/query-config.ts` with named `staleTime`
      constants, and set the global default on the `QueryClient` in
      `src/plugins/vue-query.ts`.
      **Done when:** `STALE_TIME.default` (60s) is set as
      `defaultOptions.queries.staleTime` in `plugins/vue-query.ts`, a new
      assertion in `vue-query.test.ts` confirms it, and `npm run type-check`
      / `npm run test:unit` pass.

- [x] 2. Add `agentKeys`, `systemKeys.list`, `shipKeys.list` and
      `shipKeys.preview` factories (colocated in `agent.ts`, `system.ts`,
      `ship.ts`), each with a small stability test. Wire them plus the
      matching `STALE_TIME.agent` / `STALE_TIME.systems` / `STALE_TIME.ships`
      constant into `useAgentQuery`, `useSystemsQuery`, `FleetView`'s ships
      query, and `DashboardView`'s ships-preview query.
      **Done when:** those four call sites use the new factories and
      constants instead of ad hoc key arrays and no inline `staleTime`
      omission, `agent.test.ts` / `system.test.ts` / `ship.test.ts` assert
      each factory returns a stable key, and `npm run type-check` /
      `npm run test:unit` pass.

- [x] 3. `SystemDetailView`: read `systemSymbol` via `computed(() =>
      route.params.systemSymbol as string)`; add `systemKeys.detail` and
      `waypointKeys.list` factories (colocated in `system.ts` / `waypoint.ts`,
      each with a stability test) using `STALE_TIME.systems` /
      `STALE_TIME.waypoints`; remove `enabled: computed(() =>
      !!system.value)` from the waypoints query.
      **Done when:** `npm run type-check`, `npm run test:unit`, and
      `npm run build` pass; manually pushing to a different
      `/systems/:systemSymbol` without leaving the route (e.g. via
      `$router.push` in the console) shows the new system's data (no
      automated coverage — no browser test harness is configured).

- [x] 4. `FleetDetailView`: read `shipSymbol` via `computed`; add
      `shipKeys.detail` (in `ship.ts`, with a stability test). Derive
      `waypointSymbol` as `computed(() => ship.value?.nav.waypointSymbol)`
      and its system symbol as a second `computed` built from that, removing
      both `ship.value!` occurrences; add `waypointKeys.detail` (in
      `waypoint.ts`, with a stability test) keyed on those two computeds
      instead of the previous ad hoc `['waypoint-for-ship', shipSymbol]`
      key. Apply `STALE_TIME.ships` / `STALE_TIME.waypoints`.
      **Done when:** `npm run type-check`, `npm run test:unit`, and
      `npm run build` pass; manually navigating between two ships' detail
      pages without leaving the route shows the new ship's data (manual
      check, same reason as step 3).

- [x] 5. `MarketView`: read `waypointSymbol` via `computed`; derive
      `systemSymbol` as a second `computed` from it (used for the "Back to
      system" link); add `marketKeys.detail` (in `market.ts`, with a
      stability test) using `STALE_TIME.market`.
      **Done when:** `npm run type-check`, `npm run test:unit`, and
      `npm run build` pass; manually navigating between two markets without
      leaving the route shows the new market's data (manual check, same
      reason as step 3).

- [x] 6. Add `placeholderData: keepPreviousData` to `useSystemsQuery`,
      `FleetView`'s ships query, and `SystemDetailView`'s waypoints query.
      Add an optional `isFetching` prop to `DataTable.vue` that dims the
      table body (e.g. reduced opacity) while `true`; wire it from
      `SystemsView` and `FleetView`. Apply the same dimming inline on
      `SystemDetailView`'s own waypoints table using that query's
      `isFetching`.
      **Done when:** `npm run type-check`, `npm run test:unit`, and
      `npm run build` pass; manually changing pages on Systems, Fleet, and a
      system's waypoints table shows the previous page dim briefly instead
      of a full skeleton (manual check, no automated coverage — UI
      component, per the project's testing scope rule).

- [x] 7. Add `src/features/auth/lib/logout.ts` exporting `logout(queryClient)`
      (`await queryClient.cancelQueries()`, then `queryClient.clear()`, then
      `useTokenStore().logout()`) with `logout.test.ts`. Wire it into
      `AppHeader.vue` (via `useQueryClient()`, awaited before redirecting to
      `/login`) and into the `QueryCache` `onError` auth handler in
      `plugins/vue-query.ts` (replacing the direct `useTokenStore().logout()`
      call, still followed by `router.push('/login')`). In `LoginView.vue`,
      call `queryClient.clear()` (via `useQueryClient()`) before
      `tokenStore.login(...)` on a successful submit.
      **Done when:** `logout.test.ts` shows cached data is gone and the
      token store is cleared after calling `logout`; the existing 401
      redirect test in `vue-query.test.ts` still passes; `npm run
      type-check`, `npm run test:unit`, and `npm run build` pass.

## Files / areas

- `src/shared/api/query-config.ts` (new)
- `src/plugins/vue-query.ts`, `src/plugins/vue-query.test.ts`
- `src/features/auth/api/agent.ts`, `agent.test.ts` (new)
- `src/features/auth/composables/useAgentQuery.ts`
- `src/features/auth/views/LoginView.vue`
- `src/features/auth/lib/logout.ts` (new), `logout.test.ts` (new)
- `src/features/systems/api/system.ts`, `system.test.ts` (new)
- `src/features/systems/api/waypoint.ts`, `waypoint.test.ts` (new)
- `src/features/systems/composables/useSystemsQuery.ts`
- `src/features/systems/views/SystemDetailView.vue`
- `src/features/fleet/api/ship.ts`, `ship.test.ts` (new)
- `src/features/fleet/views/FleetView.vue`
- `src/features/fleet/views/FleetDetailView.vue`
- `src/features/dashboard/views/DashboardView.vue`
- `src/features/markets/api/market.ts`, `market.test.ts` (new)
- `src/features/markets/views/MarketView.vue`
- `src/shared/ui/AppHeader.vue`
- `src/shared/ui/DataTable.vue`

## Data / contracts

**`src/shared/api/query-config.ts`** — named constants, values fixed here
(internal cache-tuning detail, no persisted-data or interoperability
consequence, so not left as an open question):

```ts
export const STALE_TIME = {
  default: 60_000, // 1 min — QueryClient default
  agent: 20_000, // 20 s — dynamic (credits, ship count)
  ships: 20_000, // 20 s — dynamic (position, cargo, fuel)
  systems: 10 * 60_000, // 10 min — near-static
  waypoints: 5 * 60_000, // 5 min — near-static
  market: 60_000, // 1 min — prices move while a ship is present
} as const
```

**Query-key factories** — each colocated in its feature's existing
`api/*.ts` file, next to the `get*` functions that already live there.
Parameters accept the same `MaybeRefOrGetter<T>` values already passed
directly into `useQuery`'s `queryKey` array today (Vue Query deep-unrefs the
key), so call sites don't need `toValue`/`.value` at the key-building call
site — only inside `queryFn`, `enabled`, and template bindings.

```ts
// agent.ts
export const agentKeys = { detail: () => ['agent'] as const }

// system.ts
export const systemKeys = {
  list: (page: MaybeRefOrGetter<number>) => ['systems', page] as const,
  detail: (symbol: MaybeRefOrGetter<string>) => ['system', symbol] as const,
}

// waypoint.ts
export const waypointKeys = {
  list: (systemSymbol: MaybeRefOrGetter<string>, page: MaybeRefOrGetter<number>) =>
    ['waypoints', systemSymbol, page] as const,
  detail: (
    systemSymbol: MaybeRefOrGetter<string | undefined>,
    waypointSymbol: MaybeRefOrGetter<string | undefined>,
  ) => ['waypoint', systemSymbol, waypointSymbol] as const,
}

// ship.ts
export const shipKeys = {
  list: (page: MaybeRefOrGetter<number>) => ['ships', page] as const,
  preview: () => ['ships', 'preview'] as const,
  detail: (symbol: MaybeRefOrGetter<string>) => ['ship', symbol] as const,
}

// market.ts
export const marketKeys = {
  detail: (waypointSymbol: MaybeRefOrGetter<string>) => ['market', waypointSymbol] as const,
}
```

`waypointKeys.detail`'s params are typed `string | undefined` because
`FleetDetailView` only knows the waypoint once the ship has loaded — the
query stays `enabled: false` until then, same guarantee the current code
already relies on for the `ship.value!` pattern it replaces.

**`logout(queryClient: QueryClient)`** (`features/auth/lib/logout.ts`):
cancels in-flight queries (so a response already in flight can't repopulate
the cache after clearing), clears the entire Query cache, then logs out the
token store. Both current logout paths (header button, 401 handler) call
this one function instead of touching the token store directly.

**`DataTable.vue`** new prop: `isFetching?: boolean` (default `false`).
When `true`, the rendered `PrimeDataTable` gets a dimmed style (e.g.
`opacity-60` or equivalent) — purely visual, no new emits or behavior.

## Testing

- `agent.test.ts`, `system.test.ts`, `waypoint.test.ts`, `ship.test.ts`,
  `market.test.ts`: each new key factory returns the expected stable array
  for representative inputs (matches the existing per-file schema-test
  granularity already used throughout `api/`).
- `logout.test.ts`: given a `QueryClient` with cached data and a logged-in
  token store, calling `logout(queryClient)` leaves the cache empty
  (`queryClient.getQueryData(...)` is `undefined`) and the token store
  logged out.
- `vue-query.test.ts`: existing 401 → redirect test must keep passing once
  the `onError` handler routes through `logout(queryClient)`.
- Everything else in this feature (reactive detail-view keys,
  `keepPreviousData`/dimming, per-resource `staleTime` actually reducing
  refetches) is UI/integration behavior with no browser test harness
  configured (`AGENTS.md`: "Browser testing is opt-in and not yet
  configured"). Verify manually per step, and as a final pass: log in as
  agent A, log out, log in as agent B (a second real agent), confirm no
  data from A ever appears; open a Systems/Fleet list, change pages inside
  the 10 min / 20 s staleTime window and confirm no new network request
  fires on revisit but does fire once the window elapses.

## Notes for the AI

- `waypointKeys.detail`'s two params being possibly `undefined` mirrors the
  query's own `enabled` guard — the `queryFn` still resolves them with a
  non-null assertion (`waypointSymbol.value!`, `systemSymbol.value!`), which
  is safe and expected here because `enabled: computed(() =>
  !!waypointSymbol.value)` guarantees `queryFn` never runs otherwise. This is
  the same idiom the current code already uses (`ship.value!`); the fix is
  computing the symbol once via `computed` instead of re-deriving it twice
  inline from `ship.value!.nav.waypointSymbol`, not eliminating every
  assertion.
- Don't extract a `useShipsQuery`/`useMarketQuery`/etc. composable set — only
  `useAgentQuery` and `useSystemsQuery` exist today, and
  `coding-standards.md` / the build-plan (#7) deliberately keep the
  composable-test count at "1 or 2, not one per screen." Detail-view and
  `FleetView`/`DashboardView` queries stay inline `useQuery` calls, just
  using the new key factories and `staleTime` constants.
- `keepPreviousData` is imported from `@tanstack/vue-query` (already a
  dependency, v5.103+).
- Don't touch `SystemDetailView`'s or `MarketView`'s filter/sort/pagination
  logic beyond what's described above — that's `DataTable` extraction
  territory (build-plan #22), out of scope here.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":14568,"specSha256":"7de148c96d7eed2273417f4e51955c4d9bdea37eb09c6b0dfa5525a908c2ad8f","branch":"refs/heads/feature/query-staletime-cache-purge-on-logout-reactive-query-keys","head":"07752a277c71c010126cd51ae621f6dd1a50c7f0","baseRef":"refs/heads/post-release-improvement","baseCommit":"efb4839f0dda78c89d15581305294c88944c05cf","sourceTree":"6d2bc29d2104c2f53164571a0dd8a6f4404751ce","absentOptional":[]} -->
