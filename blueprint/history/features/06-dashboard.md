# Feature: Dashboard

**From build-plan:** feature 6
**Build attempt:** 1
**Branch:** feature/dashboard
**Status:** verified

## Goal

Build the `/` dashboard: the authenticated home screen with 4 same-size agent
stat tiles (identity + faction badge, credits, ship count, starting system
link) and a fleet preview mini-table linking to `/fleet`, each with its own
loading and error/retry states. This is the first authenticated route, so it
also adds the router guard that keeps an unauthenticated visit off it.

## In scope

- New `/` route (`features/dashboard/views/DashboardView.vue`), shown with
  `AppHeader` (already conditional on route name in `App.vue`).
- `requireAuth` router guard (`src/router/guards.ts`): redirects to `/login`
  when no token is stored. Wired as `beforeEnter` on the `/` route only.
- `useAgentQuery` composable (`features/auth/composables/useAgentQuery.ts`)
  wrapping `getAgent` in `useQuery` - the first genuine `useQuery` consumer.
- 4 stat tiles, same fixed height (124px per `identite-visuelle.md`):
  - Identity: `agent.symbol` + a static, neutral faction badge
    (`agent.startingFaction`) - informational only, not one of the 4 signal
    colors.
  - Credits: `agent.credits`.
  - Ship count: `agent.shipCount`.
  - Starting system: system symbol derived from `agent.headquarters`
    (a waypoint symbol), linking to `/systems/:systemSymbol`. That route
    does not exist until feature 8; `AppHeader` already links to
    not-yet-built routes (`/systems`, `/fleet`) the same way.
- Shared SpaceTraders text helpers (`shared/lib/spacetraders.ts`):
  - `toReadableText(value)` - `SNAKE_CASE` to readable text (`IN_ORBIT` to
    `IN ORBIT`), the badge-text conversion rule from `identite-visuelle.md`.
    Reused by every future badge (traits, ship status, trade good types).
  - `systemSymbolFromWaypoint(waypointSymbol)` - a waypoint symbol's leading
    `SECTOR-SYSTEM` segments.
- Minimal `Ship` schema (`features/fleet/api/ship.schema.ts`) and
  `getShips` (`features/fleet/api/ship.ts`, `GET /my/ships` via
  `requestPage`), with only `symbol` and `nav.status` /
  `nav.waypointSymbol` - the fields this preview needs. Features 10 and 11
  extend this same schema.
- Fleet preview: mini-table (symbol, status as a readable-text badge with
  its signal color, position) built from the first page of `getShips`
  (`limit: 5` - a preview, not the full paginated list), called directly
  with `useQuery` in the view (no dedicated composable - the build plan
  reserves dedicated `useQuery` composable tests for Agent here and Systems
  in feature 7, "1 or 2, not one per screen"). "View full fleet" link to
  `/fleet`.
- Independent loading (skeleton) and error (retry via `refetch()`) states
  for the agent tiles and the fleet preview - two separate queries, so one
  can fail or still be loading while the other has data.

## Out of scope

- `/systems/:systemSymbol` and `/fleet` themselves (features 7-10) - only
  the links.
- Full `/fleet` table behavior: filtering, sorting, pagination controls,
  ETA/cargo/fuel columns (feature 10 extends `Ship` for those).
- Extracting the fleet preview's status-color mapping into a shared helper -
  it lives inline in the view until feature 10 gives it a second real
  consumer (same "2nd occurrence" rule the build plan already applies to
  `shared/ui/DataTable`).
- 404 handling (feature 13) and any other authenticated-route guard beyond
  `/` (features 7-12 remain open for now; only this feature's own route is
  wired to `requireAuth`).
- A shared `StatTile`-style component outside `features/dashboard` - it is
  local to this view.

## Build loop

One step at a time. After each step: run the affected checks, request
review, wait for explicit approval before starting the next step. A
checkpoint commit follows each approved step (`workflow.checkpointCommits:
enabled`).

## Build steps

- [x] 1. **Shared SpaceTraders text helpers**
  - Add `src/shared/lib/spacetraders.ts`: `toReadableText(value: string):
    string` (replace `_` with a space) and `systemSymbolFromWaypoint
    (waypointSymbol: string): string` (join the first two `-`-separated
    segments).
  - Add `src/shared/lib/spacetraders.test.ts`: `toReadableText` on a
    multi-underscore value (`IN_ORBIT`) and a value with none; `
    systemSymbolFromWaypoint` on a 3-segment waypoint symbol (e.g.
    `X1-DF55-20250Z` to `X1-DF55`).
  - Done when: `npm run test:unit` passes with the new tests, `npm run
    type-check` passes.

- [x] 2. **Minimal Ship schema and API function**
  - Add `src/features/fleet/api/ship.schema.ts`: `shipSchema` with `symbol`
    (string) and `nav` (`status`: `z.enum(['IN_ORBIT', 'DOCKED',
    'IN_TRANSIT'])`, `waypointSymbol`: string); export `Ship` via
    `z.infer`.
  - Add `src/features/fleet/api/ship.ts`: `getShips(options?)` calling
    `requestPage('/my/ships', shipSchema, options)` (mirrors `agent.ts`'s
    `getAgent`).
  - Add `src/features/fleet/api/ship.schema.test.ts`: a valid payload and a
    contract-breaking one (mirrors `agent.schema.test.ts`).
  - Done when: `npm run test:unit` and `npm run type-check` pass.

- [x] 3. **`useAgentQuery` composable**
  - Add `src/features/auth/composables/useAgentQuery.ts`: wraps `getAgent`
    in `useQuery` (`queryKey: ['agent']`), returning the query result
    (`data`, `isPending`, `isError`, `refetch`, etc.) for the view to
    consume.
  - Add `src/features/auth/composables/useAgentQuery.test.ts`: success,
    loading, and error states, with `getAgent` mocked via `vi.mock()`
    (matches this project's stated mocking strategy - `vi.mock()` for
    composables, hand-mocked `fetch` reserved for `request<T>()` itself).
  - Done when: `npm run test:unit` and `npm run type-check` pass.

- [x] 4. **`requireAuth` router guard**
  - Add `requireAuth()` to `src/router/guards.ts`: reads `useTokenStore()`,
    returns `'/login'` when there is no token, otherwise `undefined` (mirrors
    `redirectIfAuthenticated`'s shape).
  - Add matching cases to `src/router/guards.test.ts`.
  - Done when: `npm run test:unit` and `npm run type-check` pass. No route
    uses the guard yet (wired in step 5) - the project stays working since
    this is an additive, uncalled export.

- [x] 5. **Dashboard view: agent tiles and routing**
  - Add `src/features/dashboard/views/DashboardView.vue`: a local `StatTile`
    presentational component (`src/features/dashboard/components/
    StatTile.vue`, label + value slot, fixed 124px height) used for the 4
    tiles; identity tile includes the neutral faction badge; credits
    formatted with `toLocaleString()`; starting system tile links to
    `/systems/:systemSymbol` via `systemSymbolFromWaypoint(agent.
    headquarters)`.
  - Wire `useAgentQuery` for the tiles: skeleton placeholders while
    `isPending`, an error banner with a "Retry" button calling `refetch()`
    while `isError`.
  - Register the route in `src/router/index.ts`: `{ path: '/', name:
    'dashboard', component: DashboardView, beforeEnter: requireAuth }`.
  - Done when: `npm run type-check` and `npm run test:unit` pass (no new
    logic-bearing code in this step beyond what steps 1-4 already cover);
    manually verified in the dev server - visiting `/` while logged in
    shows the 4 tiles with real agent data, visiting `/` with no token
    redirects to `/login`, and throttling/blocking the `/my/agent` request
    shows the loading skeleton then the error/retry state.

- [x] 6. **Dashboard view: fleet preview**
  - Add the fleet preview mini-table to `DashboardView.vue`: a plain
    `<table>` (not PrimeVue `DataTable` - no sort/filter/pagination for a
    preview) styled to match the design tokens already used for tables,
    fetching `getShips({ limit: 5 })` directly via `useQuery` in the view;
    columns symbol, status (readable text, colored by
    `identite-visuelle.md`'s status mapping: `DOCKED` accent, `IN_TRANSIT`
    warn, `IN_ORBIT` info), position (`nav.waypointSymbol`); "View full
    fleet" link to `/fleet`.
  - Independent skeleton/error+retry states for this query, separate from
    the agent tiles' state.
  - Done when: `npm run type-check` and `npm run test:unit` pass (no new
    logic-bearing code - `toReadableText` already covers the status-text
    conversion); manually verified in the dev server - the preview shows up
    to 5 ships with correctly colored status badges, the "View full fleet"
    link is present, and the preview's own error/retry works independently
    of the agent tiles.

- [x] 7. **Fleet preview: fuel gauge column**
  - Extend `features/fleet/api/ship.schema.ts`'s `shipSchema` with `fuel`
    (`current`, `capacity`: number) - added earlier than feature 10 planned,
    at the user's request, since it reads well in the preview and the design
    system already has a configured `ProgressBar` pass-through for exactly
    this gauge (feature 3).
  - Add a "Fuel" column to the fleet preview table: PrimeVue `ProgressBar`
    (`:value="fuelPercent"`, `show-value="false"`) plus a `NN%` label,
    using the already-configured threshold coloring (feature 3's pt:
    accent >= 50%, warn >= 20%, danger below).
  - Update `ship.schema.test.ts`'s payloads to include `fuel`.
  - Done when: `npm run test:unit` and `npm run type-check` pass; manually
    verified in the dev server - the fuel column renders a colored gauge per
    ship matching its fuel ratio.

## Files / areas

- `src/shared/lib/spacetraders.ts`, `spacetraders.test.ts` (new)
- `src/features/fleet/api/ship.schema.ts`, `ship.schema.test.ts`,
  `ship.ts` (new)
- `src/features/auth/composables/useAgentQuery.ts`,
  `useAgentQuery.test.ts` (new)
- `src/router/guards.ts`, `guards.test.ts` (edit - add `requireAuth`)
- `src/router/index.ts` (edit - add the `/` route)
- `src/features/dashboard/views/DashboardView.vue`,
  `src/features/dashboard/components/StatTile.vue` (new)

## Data / contracts

- `Ship` (`features/fleet/api/ship.schema.ts`), minimal shape for this
  feature only:
  ```ts
  {
    symbol: string
    nav: {
      status: 'IN_ORBIT' | 'DOCKED' | 'IN_TRANSIT'
      waypointSymbol: string
    }
    fuel: {
      current: number
      capacity: number
    }
  }
  ```
  `fuel` was added in step 7 (user request) ahead of the original plan.
  Features 10 and 11 add `registration.role`, `cargo`,
  `nav.route.arrival`, `frame`/`reactor`/`engine`, `modules`/`mounts`,
  `crew`, `cooldown` to this same file - do not add them now.
- `Agent` is unchanged (feature 4's schema already has every field this
  feature needs: `symbol`, `credits`, `headquarters`, `startingFaction`,
  `shipCount`).
- `GET /my/ships` is called with `requestPage`'s existing `limit` option
  (`{ limit: 5 }`); no new pagination contract.

## Testing

- `spacetraders.test.ts`: `toReadableText` and `systemSymbolFromWaypoint`,
  each on a representative valid input and one edge case.
- `ship.schema.test.ts`: valid payload, one contract-breaking field
  (mirrors `agent.schema.test.ts`).
- `useAgentQuery.test.ts`: success (data populated), loading (`isPending`
  true before resolution), error (`isError` true, `getAgent` mocked to
  reject) - the feature's one dedicated `useQuery` composable test, per the
  build plan.
- No test for `requireAuth` navigating a real router (that requires
  `@vue/test-utils`, explicitly deferred to v2 in `specs-techniques.md`) -
  it is tested the same way `redirectIfAuthenticated` already is: calling
  the guard function directly and asserting its return value.
- No component tests for `DashboardView.vue` or `StatTile.vue` (UI
  rendering, exempt per the testing scope rule) - verified manually via the
  dev server per each step's done-when.

## Notes for the AI

- Do not modify `src/shared/api/http.ts`, `src/features/auth/api/
  agent.schema.ts`, or `src/features/auth/api/agent.ts` - reuse them as-is.
- `requireAuth` and `redirectIfAuthenticated` are separate, single-purpose
  guards; do not merge them or generalize into a single parameterized guard
  - there are only two call sites and they check opposite conditions.
- Keep the faction badge visually neutral (border/surface tones, `text-
  muted`) - it is informational per the spec, not one of the 4 signal
  colors (`accent`/`warn`/`info`/`danger`), which are reserved for
  business-meaning signals (like the fleet preview's status badges).
- The starting-system and "View full fleet" links point at routes that do
  not exist yet in `src/router/index.ts` (same situation `AppHeader`
  already shipped in feature 5 for `/systems` and `/fleet`) - this is
  expected, not a bug to fix in this feature.
- Format `credits` with `toLocaleString()` for readability; no currency
  symbol (SpaceTraders credits are not a real-world currency).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":12746,"specSha256":"8536c7f72ce01292eaf971b708f07cd11342bbaa4f6cd317d661d65370f8d10f","branch":"refs/heads/feature/dashboard","head":"7a154235bfa79eb2f30afac5796f24e0d30b3cd0","baseRef":"refs/heads/main","baseCommit":"5fd1630aaafc90718e2e4f64746b213d444c403e","sourceTree":"673595eb7b852b0f8c912a5a2e44299a88a3ac0e","absentOptional":[]} -->
