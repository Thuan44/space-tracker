# Feature: Fleet list

**From build-plan:** feature 11
**Build attempt:** 1
**Branch:** feature/fleet-list
**Status:** verified

## Goal

Add `/fleet`, a paginated table of the agent's ships (`GET /my/ships`), built on
the shared `DataTable` (#10) as its second real consumer: symbol (link to the
future detail page), role, status as a readable-text badge, current position,
ETA when in transit, cargo, and fuel — with client-side filter/sort over each
server-fetched page and loading/error states, matching the Systems list (#7)
pattern.

## In scope

- `GET /my/ships` via the existing `getShips()` (`features/fleet/api/ship.ts`),
  paginated server-side by `page` (same shape as `useSystemsQuery`), called
  inline with `useQuery` in the view — no dedicated composable/test, matching
  the precedent set after Systems list (#7) that later screens reuse the
  paginated-list shape without their own composable test.
- Extend `shipSchema` (`features/fleet/api/ship.schema.ts`) with the fields this
  screen needs: `registration.role`, `cargo.units`/`cargo.capacity`,
  `nav.route.arrival`.
- `FleetView.vue` (`features/fleet/views/`) rendered at `/fleet`
  (`requireAuth`-guarded, registered in `src/router/index.ts`), using
  `shared/ui/DataTable.vue`:
  - **Symbol** - `RouterLink` to `/fleet/:shipSymbol` (route not yet built;
    same interim state Systems list had toward System detail).
  - **Role** - readable text (`toReadableText`).
  - **Status** - readable-text badge, reusing the three-status color classes
    already defined in `DashboardView.vue`'s fleet preview
    (`DOCKED`/`IN_TRANSIT`/`IN_ORBIT`).
  - **Position** - `nav.waypointSymbol`, plain text (no market link — that
    belongs to Fleet detail, #12).
  - **ETA** - `nav.route.arrival` formatted with `Date.prototype.toLocaleString()`
    when `nav.status === 'IN_TRANSIT'`; an em dash (`—`) otherwise. First
    timestamp shown anywhere in the app; `toLocaleString()` is the simplest
    reversible choice with no persisted-data or interop consequence.
  - **Cargo** - `ProgressBar` + percentage text (via `percentOf`), matching the
    Dashboard fleet-preview fuel gauge's display convention (the PrimeVue
    `ProgressBar` pass-through added in #3 was explicitly scoped for
    "fuel/cargo/condition" gauges). Absolute units/capacity numbers stay on
    Fleet detail's cargo table (#12) where line-item quantities matter.
  - **Fuel** - `ProgressBar` + percentage text, ported verbatim from the
    Dashboard fleet-preview mini-table.
  - Single filter text input (placeholder "Filter by symbol, role or status") matching
    symbol, readable role, and readable status — same shape as the Systems
    list and System detail waypoints filters.
  - Sortable columns: Symbol, Role, Status, Position, Cargo, Fuel (percent-based
    for Cargo/Fuel). ETA is not sortable (conditional/transient).
  - Loading/error states via `DataTable`'s built-in pending/error slots
    (matches Systems list).
- Extract a shared `percentOf(current, capacity)` helper (rounds to nearest
  integer, returns `0` when `capacity <= 0`) into `shared/lib/spacetraders.ts`,
  since this is its third real usage (Dashboard fuel, Fleet fuel, Fleet cargo)
  — same "extract on the real second/third occurrence" principle already
  applied to `DataTable` (#10). Refactor `DashboardView.vue`'s local
  `fuelPercent` to call it; no visual change.

## Out of scope

- Fleet detail (`/fleet/:shipSymbol`) - #12. The symbol link will 404 until
  then, matching the Systems list → System detail interim state between #7
  and #8.
- `cargo.inventory` (item/quantity list) - not needed until Fleet detail (#12).
- Market link from the position column - #12.
- Any styling for role-specific badge colors - the overview only asks for a
  readable-text badge on **status**; role is plain readable text.

## Build loop

Per-step review is enabled for this project
(`workflow.stepReview: "every"`, `workflow.checkpointCommits: "enabled"`): pause
after each step below for approval before continuing, and offer a checkpoint
commit on the feature branch after each approved step. `/complete` creates the
final feature commit.

## Build steps

- [x] 1. **Extend the Ship schema.**
   - Add `registration.role` (`z.string()` - matches the existing convention
     for larger/growing category fields, e.g. `Waypoint.type`; only the
     3-value `nav.status` gets a strict `z.enum`), `cargo.units` (`z.number()`),
     `cargo.capacity` (`z.number()`), and `nav.route.arrival` (`z.string()`) to
     `features/fleet/api/ship.schema.ts`.
   - Update `ship.schema.test.ts`: extend the existing valid/invalid payloads
     with the new required fields (including an `IN_TRANSIT` case with
     `route.arrival` present).
   - Done when: `npm run test:unit` passes with the updated ship schema tests.

- [x] 2. **Extract the shared `percentOf` helper.**
   - Add `percentOf(current: number, capacity: number): number` to
     `shared/lib/spacetraders.ts` (rounds to nearest integer; returns `0` when
     `capacity <= 0`), with unit tests for the normal case and the
     zero-capacity guard.
   - Refactor `DashboardView.vue`'s local `fuelPercent` to call
     `percentOf(ship.fuel.current, ship.fuel.capacity)`; remove the now-unused
     local function.
   - Done when: `npm run test:unit` passes with the new `percentOf` tests, and
     the Dashboard fleet-preview fuel gauge still renders the same values
     (spot-checked - `DashboardView.vue` itself has no dedicated test, per the
     project's UI-is-not-unit-tested convention).

- [x] 3. **Build `FleetView.vue` and register `/fleet`.**
   - Add `features/fleet/views/FleetView.vue` per the "In scope" column list
     above, following `SystemsView.vue`'s `DataTable` usage pattern (`page`
     ref, `filterText` ref, computed `rows`/`filteredRows`, inline `useQuery`
     keyed `['ships', page]`).
   - Register `{ path: '/fleet', name: 'fleet', component: FleetView,
     beforeEnter: requireAuth }` in `src/router/index.ts`, after the
     `system-detail` route.
   - Done when: `npm run type-check` and `npm run test:unit` pass, and
     navigating to Fleet from the top nav renders the paginated ship table
     with working filter, sort, and pagination against the real API (manual
     check - no Browser tests command is configured for this project).

## Files / areas

- `src/features/fleet/api/ship.schema.ts` - extend
- `src/features/fleet/api/ship.schema.test.ts` - extend
- `src/shared/lib/spacetraders.ts` - add `percentOf`
- `src/shared/lib/spacetraders.test.ts` - new (first test file for this
  module; `toReadableText`/`systemSymbolFromWaypoint` currently have none)
- `src/features/dashboard/views/DashboardView.vue` - refactor `fuelPercent`
  call site only
- `src/features/fleet/views/FleetView.vue` - new
- `src/router/index.ts` - add `/fleet` route

## Data / contracts

`features/fleet/api/ship.schema.ts` (`Ship`), additive to the existing
`symbol` / `nav.status` / `nav.waypointSymbol` / `fuel.current` /
`fuel.capacity`:

- `registration.role` (string) - readable role name, e.g. `COMMAND`,
  `EXCAVATOR`; not a fixed-size enum, rendered as plain readable text only (no
  per-role badge color).
- `cargo.units` (number), `cargo.capacity` (number)
- `nav.route.arrival` (string, ISO timestamp) - always present on the real
  API's `nav.route` object; only displayed when `nav.status === 'IN_TRANSIT'`.

`shared/lib/spacetraders.ts`:

- `percentOf(current: number, capacity: number): number` - `Math.round((current
  / capacity) * 100)`, guarded to return `0` when `capacity <= 0`.

No new persisted data, no new API endpoints beyond the already-used
`GET /my/ships`.

## Testing

- `ship.schema.test.ts` - extend valid/invalid `safeParse` cases for the new
  required fields.
- `spacetraders.test.ts` (new) - `percentOf`: normal division case,
  zero-capacity guard.
- No component test for `FleetView.vue` (UI rendering/composition, not pure
  logic - matches the project's testing scope rule) and no dedicated composable
  test (matches the precedent that Systems list, #7, was the last dedicated
  `useQuery` composable test).

## Notes for the AI

- Follow `SystemsView.vue` closely for the `DataTable` wiring (`v-model:page`,
  `v-model:filter-text`, `Column ... sortable`, `#toolbar-end` only if needed -
  Fleet list has no equivalent of the Systems "Explore" button, so the toolbar
  slot is likely unused here).
- Reuse `DashboardView.vue`'s `statusBadgeClasses` record for the status badge
  colors verbatim (same three keys, same classes) rather than inventing new
  ones. Duplicating this small 3-entry class map across Dashboard and Fleet
  list is fine - do not build a shared constant for it; the project's
  "extract on real second occurrence" principle has been applied at the
  component level (`DataTable`) and the pure-logic level (`percentOf`) in this
  feature already, and a 3-line style map is not worth a third shared module.
- `getShips()` and `PageOptions` already exist and are generic
  (`features/fleet/api/ship.ts`) - no API-layer changes needed beyond the
  schema extension in step 1.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9142,"specSha256":"05cd7d6657766280dadfbf6a0d5f34f540c62687999ca6ceb193d37b312ae0c8","branch":"refs/heads/feature/fleet-list","head":"d34b54bd587206c221e04f28e5c9d7c761b83537","baseRef":"refs/heads/main","baseCommit":"c66c3a864a15d61ad3cf59d5a33a5aafb314e90f","sourceTree":"045b805f15d5005c27654c0868c9b9e5be7b0936","absentOptional":[]} -->
