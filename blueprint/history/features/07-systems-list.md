# Feature: Systems list

**From build-plan:** feature 7
**Build attempt:** 1
**Branch:** feature/systems-list
**Status:** verified

## Goal

Build the `/systems` screen: a paginated table of known SpaceTraders systems
(symbol, name, sector, star type, waypoint count), with filter and sort, and
its own loading and error/retry states. First table in the app, built
directly here rather than through a shared component
(`specs-techniques.md`: "pas de composant partagé conçu à l'avance").

## In scope

- Colocated `System` schema (`features/systems/api/system.schema.ts`) and API
  function (`features/systems/api/system.ts`) calling `GET /systems` through
  the shared `requestPage` client. Fields limited to what this screen shows:
  `symbol`, `name` (falls back to `symbol` when absent), `sectorSymbol`,
  `type` (star type), `waypoints` (only used here for a count). System detail
  (#8) extends this same schema with `constellation`, `x`, `y`, `factions`.
- `useSystemsQuery` composable (`features/systems/composables/useSystemsQuery.ts`)
  wrapping `getSystems` in `useQuery`, keyed on the current page.
- `SystemsView.vue` (`features/systems/views/SystemsView.vue`): PrimeVue
  `DataTable` + `Paginator` (both already styled via the global `pt` config
  from feature 3), columns: symbol (link to `/systems/:systemSymbol`, not
  built until feature 8 - the dashboard already links forward to that same
  route the same way), name, sector, star type, waypoint count.
- Filter (by symbol/sector substring) and sort (by star type, by waypoint
  count) applied client-side to the currently loaded page only. Verified
  live against `GET https://api.spacetraders.io/v2/systems`: the endpoint's
  only query parameters are `page` and `limit`, no server-side filter or
  sort, and `meta.total` is in the thousands (7000+), so fetching every page
  to filter/sort globally is not viable. This matches the existing
  `requestPage` client, which already only accepts `page`/`limit`.
- New `/systems` route in `src/router/index.ts`, `beforeEnter: requireAuth`
  (same guard as `/`), rendered under the existing `AppHeader` (`App.vue`
  already shows it on every route except `login`). The header's `Systems`
  nav link (`shared/ui/AppHeader.vue`) already points at `/systems` and
  starts resolving once this route exists.
- Loading (skeleton, matching the dashboard's pattern) and error (message +
  retry button) states.

## Out of scope

- System detail (`/systems/:systemSymbol`) - feature 8.
- Shared `DataTable` extraction (`shared/ui/DataTable`) - feature 9, only
  once Fleet list is a second real consumer.
- Server-side filter/sort - not supported by the SpaceTraders API for this
  endpoint.
- `constellation`, `x`, `y`, `factions` on `System` - added when feature 8
  needs them.

## Build loop

One step at a time. After each step: run the affected checks, request
review, wait for explicit approval before starting the next step. A
checkpoint commit follows each approved step (`workflow.checkpointCommits:
enabled`).

## Build steps

- [x] 1. **System schema and API function**
  - Add `features/systems/api/system.schema.ts`: `systemSchema` with
    `symbol` (string), `name` (string, optional), `sectorSymbol` (string),
    `type` (string - star type, no enum: not constrained by the API, same
    reasoning already used for `Agent.startingFaction`), `waypoints`
    (`z.array(z.object({ symbol: z.string() }))`, used only for `.length`
    here).
  - Add `features/systems/api/system.ts`: `getSystems(options?: PageOptions)`
    calling `requestPage('/systems', systemSchema, options)`.
  - Tests: `systemSchema` - valid payload parses, a contract-breaking case
    (e.g. `type` as a number) fails `safeParse()`.
  - Done when: `npm run test:unit` passes for the new schema test and
    `npm run type-check` is clean.

- [x] 2. **`useSystemsQuery` composable**
  - Add `features/systems/composables/useSystemsQuery.ts`: takes a reactive
    page number, returns `useQuery({ queryKey: ['systems', page], queryFn:
    () => getSystems({ page: page.value }) })`.
  - Tests: success/loading/error states, following the `useAgentQuery.test.ts`
    pattern (`runWithContext`, mocked `getSystems`).
  - Done when: `npm run test:unit` passes for the new composable test and
    `npm run type-check` is clean.

- [x] 3. **Systems view and route**
  - Add `features/systems/views/SystemsView.vue`: PrimeVue `DataTable` bound
    to the current page's systems (client-side sorted/filtered from that
    page), `Paginator` driving the composable's page ref
    (`meta.total`/`meta.limit` from the response); text input filtering
    symbol/sector substrings; sortable star-type and waypoint-count columns;
    symbol cell links to `/systems/${symbol}`; name cell falls back to
    symbol; waypoint count from `waypoints.length`. Loading skeleton and
    error/retry state matching `DashboardView.vue`'s existing pattern.
  - Register `{ path: '/systems', name: 'systems', component: SystemsView,
    beforeEnter: requireAuth }` in `src/router/index.ts`.
  - No new tests (UI-only step - table rendering, filtering and PrimeVue
    wiring are integration-level, out of the test scope per
    `coding-standards.md`; logic already covered by the schema and composable
    tests in steps 1-2).
  - Done when: `npm run type-check` and `npm run test:unit` are clean, and a
    manual run (`npm run dev`) shows `/systems` rendering a paginated,
    filterable, sortable table with working loading/error states.

## Files / areas

- `src/features/systems/api/system.schema.ts` (new)
- `src/features/systems/api/system.schema.test.ts` (new)
- `src/features/systems/api/system.ts` (new)
- `src/features/systems/composables/useSystemsQuery.ts` (new)
- `src/features/systems/composables/useSystemsQuery.test.ts` (new)
- `src/features/systems/views/SystemsView.vue` (new)
- `src/router/index.ts` (edit - add `/systems` route)

## Data / contracts

`GET /systems` via `requestPage('/systems', systemSchema, { page, limit? })`,
returning `{ data: System[], meta: { total, page, limit } }` (existing
`requestPage` shape, unchanged).

```ts
System = {
  symbol: string
  name?: string        // falls back to symbol in the UI when absent
  sectorSymbol: string
  type: string          // star type, e.g. "RED_STAR"; no enum
  waypoints: { symbol: string }[]  // count only, for now
}
```

No mutations, no pagination/sort/filter params beyond `page`/`limit` (the API
does not support more).

## Testing

- `system.schema.test.ts`: valid payload parses; a contract-breaking payload
  fails `safeParse()`.
- `useSystemsQuery.test.ts`: loading, success, and error states via a mocked
  `getSystems`.
- No component test for `SystemsView.vue` (UI/integration, out of unit-test
  scope); verify manually with `npm run dev`.

## Notes for the AI

- Client-side filter/sort operates only on the currently loaded page's rows,
  not the full system list - this is a hard API constraint (confirmed live:
  `GET /systems` only accepts `page`/`limit`), not a simplification to
  revisit later.
- Reuse `requestPage` as-is; do not add filter/sort parameters to the shared
  HTTP client for this feature.
- Follow the existing `getShips`/`shipSchema` pattern (colocated schema + one
  API function) and the existing `useAgentQuery` pattern (thin `useQuery`
  wrapper) rather than introducing new conventions.
- The DataTable/Paginator `pt` styling is already configured globally in
  `src/plugins/primevue.ts` (feature 3) - do not add per-instance styling.
- Reuse `toReadableText` (`shared/lib/spacetraders.ts`) if any raw
  `SNAKE_CASE` value needs display (star `type`); it is already used for ship
  status on the dashboard.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7702,"specSha256":"05881650dd121d0dc37924f910b41b179c29fc4ba8543bde10ff6e852923a3e3","branch":"refs/heads/feature/systems-list","head":"1ab85bfde8f339a54dd5738779b17b92aa1adebf","baseRef":"refs/heads/main","baseCommit":"1ab85bfde8f339a54dd5738779b17b92aa1adebf","sourceTree":"d119337d989740fe4cd04f49204e753c5ffa688b","absentOptional":[]} -->
