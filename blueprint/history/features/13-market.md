# Feature: Market

**From build-plan:** feature 13
**Build attempt:** 1
**Branch:** feature/market
**Status:** verified

## Goal

A `/markets/:waypointSymbol` detail page showing a waypoint's traded goods -
the last drill-down screen in the app, reached from a `MARKETPLACE` waypoint
badge on System detail (#8) or a ship's market link on Fleet detail (#12).

## In scope

- Route `/markets/:waypointSymbol` -> `MarketView.vue`, guarded by
  `requireAuth`, header/nav shown (same as every other authenticated route).
  Reached only by drill-down, no direct top-nav entry (`AppHeader` keeps its
  existing Dashboard/Systems/Fleet-only links, unchanged).
- Market fetch: `GET /systems/:systemSymbol/waypoints/:waypointSymbol/market`
  via a new `getMarket(systemSymbol, waypointSymbol)` in
  `features/markets/api/market.ts`, using the existing `request()` client
  (same pattern as `getSystem`/`getShip`/`getWaypoint`). `systemSymbol` is
  derived from the route's `waypointSymbol` with the existing
  `systemSymbolFromWaypoint` helper (the route only carries the waypoint
  symbol, matching the build plan's URL shape). Loading (skeleton) and error
  (retry) states, same visual language as `SystemDetailView`/
  `FleetDetailView`.
- Header: waypoint symbol, back link to `/systems/:systemSymbol` (the parent
  system, same derivation).
- Traded goods table merging `exports`/`imports`/`exchange` (each tagged with
  its list as a type: `EXPORT`/`IMPORT`/`EXCHANGE`) with `tradeGoods` (buy
  price, sell price, trade volume, supply, activity) matched by `symbol`.
  Filter by name/type, sortable columns, readable text for type/supply/
  activity via the existing `toReadableText` helper. No pagination (the
  endpoint returns every good at once) - a plain `primevue/datatable`, same
  raw-table approach `SystemDetailView` already uses for its own table, not
  `shared/ui/DataTable.vue`.
- "Limited info" state when `tradeGoods` is absent from the response: a
  warning banner explaining an agent ship must be present at the waypoint to
  see pricing, and the goods table renders name + type only (no price/
  volume/supply/activity columns).
- Colocated schema `features/markets/api/market.schema.ts`
  (`marketSchema`, `tradeGoodInfoSchema`, `marketTradeGoodSchema`).

## Out of scope

- Buying/selling goods, or any write/mutation call - this app is read-only
  end to end (project overview: out of scope v2+).
- `transactions` (present in the live API response but explicitly "not
  prioritized for MVP display" per the project overview's Market section) -
  not modeled in the schema.
- A direct top-nav entry or a markets list screen - reached only by
  drill-down (project overview: "`/markets/:waypointSymbol` - drill-down
  only, no direct nav entry").
- A dedicated `useQuery` composable test - same precedent as Fleet detail
  (#12): the project caps composable tests at the one paginated-list shape
  already covered by Systems list (`specs-techniques.md`: "1 ou 2, pas un
  par ecran"); this is a single-resource `useQuery`, the same untested shape
  Dashboard/System detail/Fleet detail already use.
- Migrating this table onto `shared/ui/DataTable.vue` - that component is
  built around server-side pagination (page/limit/total + `Paginator`); this
  endpoint has none, and forcing fake pagination props through it isn't a
  current requirement.

## Build loop

Each step below is small and reviewed before the next starts
(`workflow.stepReview: every`). On approval, commit that step as a
checkpoint on `feature/market` before moving on (`workflow.checkpointCommits:
enabled`). `/complete` still creates the final feature commit and archive.

## Build steps

- [x] 1. Add the market schema and API function. Create
      `market.schema.ts`: `tradeGoodInfoSchema` (`symbol`, `name`),
      `marketTradeGoodSchema` (`symbol`, `tradeVolume`, `supply`, `activity`
      optional, `purchasePrice`, `sellPrice`), and `marketSchema` (`symbol`,
      `exports`, `imports`, `exchange`: `tradeGoodInfoSchema[]`,
      `tradeGoods`: `marketTradeGoodSchema[]` optional). Add
      `getMarket(systemSymbol, waypointSymbol, options?)` to `market.ts`
      using the existing `request()` client. Add `market.schema.test.ts`:
      one valid payload with `tradeGoods` present, one valid payload with
      `tradeGoods` absent, one contract-breaking case.
      **Done when:** `npm run test:unit` and `npm run type-check` pass.

- [x] 2. Add the route and header. Wire `{ path: '/markets/:waypointSymbol',
      name: 'market', component: MarketView, beforeEnter: requireAuth }` in
      `router/index.ts`. Add `MarketView.vue` fetching
      `getMarket(systemSymbolFromWaypoint(waypointSymbol), waypointSymbol)`
      via `useQuery`, rendering the header (waypoint symbol) and a back link
      to `/systems/:systemSymbol`, loading skeleton and error+retry state
      mirroring `SystemDetailView`/`FleetDetailView`.
      **Done when:** navigating from a `MARKETPLACE` waypoint badge (System
      detail) or a ship's market link (Fleet detail) to
      `/markets/:waypointSymbol` shows the header with the waypoint symbol
      and a working back link to its system; loading and error states both
      render; `npm run type-check` passes.

- [x] 3. Traded goods table. Merge `exports`/`imports`/`exchange` into rows
      tagged by type (`EXPORT`/`IMPORT`/`EXCHANGE`), matched against
      `tradeGoods` by `symbol` when present. Render a `primevue/datatable`
      (name, type, buy price, sell price, trade volume, supply, activity
      columns, sortable) with a filter input (name/type) above it, same
      visual pattern as `SystemDetailView`'s waypoints table but without a
      `Paginator`. When `tradeGoods` is absent, show a warning banner
      ("Limited market info: an agent ship must be present at this waypoint
      to see prices, volume, supply and activity.") and the table renders
      only the name and type columns.
      **Done when:** a market with `tradeGoods` shows the full table with
      working filter and sort; a market without `tradeGoods` shows the
      banner and the name/type-only table; `npm run type-check` passes.

## Files / areas

- `src/router/index.ts` - new route
- `src/features/markets/views/MarketView.vue` - new
- `src/features/markets/api/market.ts` - new, `getMarket`
- `src/features/markets/api/market.schema.ts` - new
- `src/features/markets/api/market.schema.test.ts` - new
- `src/shared/lib/spacetraders.ts` - no changes; reuse `toReadableText`,
  `systemSymbolFromWaypoint`

## Data / contracts

- `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}/market` ->
  `{ data: Market }`, validated by `marketSchema`, fetched via `request()`
  (no pagination - the same single-resource pattern as `getSystem`/
  `getShip`/`getWaypoint`).
- `systemSymbol` for the request is derived from `waypointSymbol` via the
  existing `systemSymbolFromWaypoint` helper (the same technique
  `FleetDetailView` already uses for its market-link lookup) - the route
  only carries `:waypointSymbol`, per the build plan's URL shape.
- `tradeGoods` is optional in the schema (absent unless an agent ship is
  present at the waypoint, per the project overview's Market section).
  `transactions` is present in the live API response but intentionally left
  out of the schema - Zod's default object parsing ignores unrecognized
  keys, so omitting it doesn't reject real payloads.
- `exports`/`imports`/`exchange` entries carry `symbol` + `name` only
  (the API also returns a `description`, unused here - same
  omit-unused-fields precedent as the `Waypoint`/`System` schemas).

## Testing

- `market.schema.test.ts`: valid payload with `tradeGoods`, valid payload
  without `tradeGoods` (optional-field boundary), one contract-breaking
  case - following the existing `waypoint.schema.test.ts` pattern.
- No new composable or component test (see Out of scope).

## Notes for the AI

- Mirror `SystemDetailView.vue`'s loading/error visual language (skeleton
  block, danger banner + retry button) for the primary market query.
- Mirror `SystemDetailView`'s raw `primevue/datatable` usage, not
  `shared/ui/DataTable.vue` - see Out of scope for why.
- `type`/`supply`/`activity` values render through `toReadableText`; none of
  the currently known SpaceTraders values for these fields contain an
  underscore, so this is a safe no-op today and matches the project's
  blanket "convert SNAKE_CASE API values" convention if a future value did.
- Keep the three build steps in order; each must leave `npm run type-check`
  (and `npm run test:unit` for step 1 and 3's schema/table logic) passing
  before moving to the next.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":8662,"specSha256":"9bfba2dfb07f201dc9a785863e70b8f00e1410161f4c48533097c8cc75cb6e80","branch":"refs/heads/feature/market","head":"2c9212346f8cf8bda63a7fc31905c4f2304301a8","baseRef":"refs/heads/main","baseCommit":"b73bf6eb2477fc5969bc8d6792e802f273cde96a","sourceTree":"3ad27747fc3378f43111f1108a39be61409fed2a","absentOptional":[]} -->
