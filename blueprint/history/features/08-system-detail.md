# Feature: System detail

**From build-plan:** feature 8
**Build attempt:** 1
**Branch:** feature/system-detail
**Status:** verified

## Goal

Give the player a detail page for one system: its header facts (name,
sector, constellation, star type, x/y) and a paginated table of its
waypoints, each showing type and trait badges, with `MARKETPLACE` waypoints
linking toward the future market page and `SHIPYARD` waypoints visually
flagged. Reached from the Systems list's existing symbol links
(`src/features/systems/views/SystemsView.vue:65`), which already point at
`/systems/${row.symbol}` even though the route does not exist yet.

## Design reference

`blueprint/reference/design/wireframes/wireframe_system-detail.png` - low-fidelity
layout reference (light-theme wireframe, not the final visual design system).
Follow its structure: back link with an arrow above the symbol heading, a plain
label-above-value meta row under a hairline divider (no bordered card), a
free-text search above the waypoints table, pill-shaped trait badges (outlined
for `MARKETPLACE`, bold-filled for `SHIPYARD`, plain for everything else), and a
numbered `Page X of Y · N waypoints` pagination footer. Render it with this
project's actual dark, monospace design system tokens (`surface-0/1/2`,
`line`, `fg`, `muted`, `accent`, `info`), not the wireframe's literal light
colors. The wireframe does not show `name` or `constellation`; both stay in the
header per this spec's contract, styled to match the wireframe's other meta
fields. The wireframe's "All types" dropdown filter is not built - this spec's
scope is the single free-text filter already used by the Systems list; a
dropdown filter would be a scope addition beyond the approved spec.

## In scope

- New route `/systems/:systemSymbol`, guarded by `requireAuth` like the
  other authenticated routes.
- Header: `GET /systems/:systemSymbol` (single system, not paginated) shown
  as symbol, name (falls back to symbol), sector, constellation, star type,
  x/y. Own loading (skeleton) and error (message + retry) states.
- Waypoints table: `GET /systems/:systemSymbol/waypoints`, paginated
  separately from the header system's embedded `waypoints` field. Columns:
  symbol (sortable), type (sortable, readable text), trait badges (readable
  text). `MARKETPLACE` trait renders as a link to `/markets/:waypointSymbol`
  (route not built yet, same forward-linking precedent as the Systems list
  and Dashboard already use). `SHIPYARD` trait renders with an accent
  treatment instead of the plain trait badge style. Free-text filter across
  symbol/type/traits, same single-input pattern as the Systems list.
  Own loading, error (message + retry), and pagination state, independent
  from the header.
- Back link to `/systems`.
- Extends the existing shared `System` schema (`system.schema.ts`, used by
  both the Systems list and this feature) with `constellation`, `x`, `y` -
  the fields this header needs that the list did not. Same incremental
  schema pattern already used for `Ship` across features 6/10/11.
- New colocated `Waypoint` schema (`features/systems/api/waypoint.schema.ts`,
  already named in the build plan): `symbol`, `type`, `traits`. **Correction
  found during manual testing against the live API**: `traits` is an array of
  `{ symbol, name }` objects, not the plain string array
  `project-overview.md`'s data model documents - the live response failed the
  original schema. `waypointTraitSchema` now models the object shape; badge
  classification (`MARKETPLACE`/`SHIPYARD`) uses `trait.symbol`, display text
  uses `trait.name` (already human-readable, no `toReadableText` needed).

## Out of scope

- The `/markets/:waypointSymbol` page itself (feature 12/13) - the
  `MARKETPLACE` link points at a route that does not exist yet, same as
  existing forward links in this codebase.
- Shipyard purchases or any shipyard screen (v2+, out of build plan).
- Server-side filter/sort/search params on the waypoints endpoint. The
  Systems list's filter and column sort already only operate on the
  currently loaded page (`SystemsView.vue`'s `filteredRows` filters
  `rows.value`, which is only the current page's data, and PrimeVue
  `sortable` columns sort the same in-memory array) even though only
  pagination is server-side. This feature repeats that exact, already
  established shape rather than inventing real server-side filtering the
  API contract does not document.
- The symbol-search feature (build-plan item 9) - depends on this feature
  existing but is specced separately.
- Extracting a shared `DataTable` component (build-plan item 10) - the
  Systems list is still the only table when this feature starts; this
  feature's table is built directly, matching the Systems list's own
  precedent.
- Dedicated `useQuery` composable files or composable tests for the system
  or waypoints queries. Both `useAgentQuery` and `useSystemsQuery` were
  already built and tested as the project's "first and last" dedicated
  `useQuery` composable tests per the build plan's testing note on item 7.
  Every query since (the Dashboard's ships preview) calls `useQuery` inline
  in the view instead of extracting a file. This feature follows that same
  inline pattern for both its queries.

## Build loop

Per-step review is enabled for this feature: stop after each build step
below and wait for approval before starting the next one. On approval,
create a checkpoint commit on `feature/system-detail` for that step alone.
`/complete` creates the final feature commit and archives this spec; it is
not run by this skill.

## Build steps

- [x] 1. Extend the `System` schema and add the single-system API call.
      - Add `constellation: z.string()`, `x: z.number()`, `y: z.number()` to
        `systemSchema` in `src/features/systems/api/system.schema.ts`.
      - Add matching valid-payload fields and one new contract-breaking case
        (e.g. `x` as a string) to
        `src/features/systems/api/system.schema.test.ts`, alongside the
        existing two tests.
      - Add `getSystem(symbol: string, options?: RequestOptions)` to
        `src/features/systems/api/system.ts`, calling
        `request(`/systems/${symbol}`, systemSchema, options)`.
      - Done when: `npm run type-check` and `npm run test:unit` both pass.

- [x] 2. Add the `Waypoint` schema and the waypoints API call.
      - Create `src/features/systems/api/waypoint.schema.ts` exporting
        `waypointSchema` (`symbol: z.string()`, `type: z.string()`,
        `traits: z.array(z.string())`) and `type Waypoint`.
      - Create `src/features/systems/api/waypoint.schema.test.ts` with a
        valid-payload case and one contract-breaking case, matching the
        style of `system.schema.test.ts`.
      - **Amended during step 4's live testing**: `traits` is actually an
        array of `{ symbol, name }` objects against the real API, not plain
        strings. `waypointSchema`/tests were corrected in place; see Data /
        contracts below for the final shape.
      - Create `src/features/systems/api/waypoint.ts` exporting
        `getWaypoints(systemSymbol: string, options?: PageOptions)`, calling
        `requestPage(`/systems/${systemSymbol}/waypoints`, waypointSchema,
        options)`.
      - Done when: `npm run type-check` and `npm run test:unit` both pass.

- [x] 3. Build the System detail header and wire the route.
      - Create `src/features/systems/views/SystemDetailView.vue`. Read
        `systemSymbol` from the route params. Fetch the system with an
        inline `useQuery` call (`queryKey: ['system', systemSymbol]`,
        `queryFn: () => getSystem(systemSymbol)`), matching the Dashboard's
        inline ships-preview query rather than a new composable file.
      - Render a back link to `/systems`, then the header: symbol, name
        (fall back to symbol), sector, constellation, star type (readable
        text via `toReadableText`), and `x`/`y`. Reuse the loading-skeleton
        and error-with-retry block markup already established in
        `SystemsView.vue` and `DashboardView.vue` (same classes) for the
        header's own loading/error states.
      - Add the route to `src/router/index.ts`:
        `{ path: '/systems/:systemSymbol', name: 'system-detail', component: SystemDetailView, beforeEnter: requireAuth }`.
      - Done when: clicking a system symbol on `/systems` navigates to
        `/systems/:systemSymbol` and shows that system's header data, a
        loading skeleton while pending, and a retry button on failure;
        `npm run type-check` passes.

- [x] 4. Add the waypoints table to the same view.
      - Add a second inline `useQuery` call for the current waypoints page
        (`queryKey: ['waypoints', systemSymbol, page]`,
        `queryFn: () => getWaypoints(systemSymbol, { page })`), with its own
        `page` ref, loading, and error/retry state, independent of the
        header query.
      - Render a `PrimeVue` `DataTable` + `Paginator`, matching
        `SystemsView.vue`'s structure: a single free-text filter input
        (placeholder "Filter by symbol, type or trait") filtering the
        current page's rows by symbol, readable type, or any trait; sortable
        `symbol` and `type` (readable text) columns; a `Traits` column
        rendering each trait as a small badge - `MARKETPLACE` as a
        `RouterLink` to `/markets/${row.symbol}` styled like the existing
        `text-info hover:underline` links, `SHIPYARD` with an accent-colored
        badge, any other trait with the neutral badge style already used for
        the faction badge in `DashboardView.vue`.
      - Done when: the waypoints table loads, paginates, filters, and sorts
        within the loaded page; a `MARKETPLACE` trait renders as a working
        link and a `SHIPYARD` trait is visually distinct from other traits;
        `npm run type-check` passes.

## Files / areas

- `src/features/systems/api/system.schema.ts` - extend (add
  `constellation`, `x`, `y`)
- `src/features/systems/api/system.schema.test.ts` - extend
- `src/features/systems/api/system.ts` - extend (add `getSystem`)
- `src/features/systems/api/waypoint.schema.ts` - new
- `src/features/systems/api/waypoint.schema.test.ts` - new
- `src/features/systems/api/waypoint.ts` - new
- `src/features/systems/views/SystemDetailView.vue` - new
- `src/router/index.ts` - add the `/systems/:systemSymbol` route

## Data / contracts

- `System` (`GET /systems/:systemSymbol`, unwrapped via `request()`'s
  `{ data: T }` envelope, same as `getAgent`): existing fields
  (`symbol`, `name?`, `sectorSymbol`, `type`, `waypoints`) plus new
  `constellation: string`, `x: number`, `y: number`. `factions` stays out of
  the schema - nothing in this feature displays it, matching how `Ship`'s
  schema only ever grows the fields the feature introducing it actually
  needs.
- `Waypoint` (`GET /systems/:systemSymbol/waypoints`, paginated via
  `requestPage()`, `{ data: T[], meta: { total, page, limit } }`): `symbol:
  string`, `type: string`, `traits: WaypointTrait[]` where `WaypointTrait` is
  `{ symbol: string, name: string }` (corrected from the originally spec'd
  `string[]` after the live API rejected it - see step 2's amendment note).
- No mutations, no new persisted client state - both are read-only
  TanStack Query resources.

## Testing

- `system.schema.test.ts`: extend the existing valid-payload case with the
  three new fields; extend or add a contract-breaking case covering one of
  them.
- `waypoint.schema.test.ts`: one valid-payload case, one contract-breaking
  case, following `system.schema.test.ts`'s existing style.
- No new composable tests (see Out of scope) and no component tests -
  `SystemDetailView.vue` is UI/integration surface, verified by running the
  app (`/check`), not unit-mounted, per `coding-standards.md`'s testing
  scope rule.
- No `Browser tests` command is declared yet, so this feature does not add
  browser coverage.

## Notes for the AI

- `system.schema.ts` is shared by the Systems list (feature 7) and this
  feature. Adding fields to it must not change any currently displayed
  Systems list column or its existing tests.
- Keep the header and waypoints queries, and their loading/error states,
  fully independent - a failed waypoints fetch must not block the header
  from rendering, and vice versa. `DashboardView.vue` already does this for
  its agent tiles vs. fleet preview; mirror that structure.
- `MARKETPLACE`, `SHIPYARD`, and `UNCHARTED` are exact-match values of
  `trait.symbol`; no enum needed for three cases. `UNCHARTED` (waypoint not
  yet scanned) gets a dashed, faded, italic badge instead of a new signal
  color, keeping to the design system's four-color rule while still reading
  as visually distinct from a confirmed trait.
- Reuse `toReadableText` from `src/shared/lib/spacetraders.ts` for the star
  type and waypoint type display, same as the Systems list already does.
  `trait.name` is already human-readable from the API, so it is displayed
  as-is without `toReadableText`.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":13063,"specSha256":"c353463fcb1f6af0762e722e597127c9328639ae2eadc82271da20b70dc20418","branch":"refs/heads/feature/system-detail","head":"bfc60ece922b61e4562eb8e843564cbb5a8039ff","baseRef":"refs/heads/main","baseCommit":"ce487c17f8f3fd28eca108757aa261652dd4dcdc","sourceTree":"cd689a180d76979d5354ecb58aeb883ba27bdad7","absentOptional":[]} -->
