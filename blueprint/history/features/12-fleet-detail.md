# Feature: Fleet detail

**From build-plan:** feature 12
**Build attempt:** 1
**Branch:** feature/fleet-detail
**Status:** verified

## Goal

A `/fleet/:shipSymbol` detail page showing everything the API knows about one
ship: header status/position/fuel/cooldown, cargo inventory, crew, and ship
components — the richest single screen in the app.

## In scope

- Route `/fleet/:shipSymbol` → `FleetDetailView.vue`, guarded by `requireAuth`,
  header/nav shown (same as every other authenticated route).
- Single-ship fetch: `GET /my/ships/:shipSymbol` via a new `getShip(shipSymbol)`
  in `features/fleet/api/ship.ts`, using the existing `request()` client (same
  pattern as `getSystem`). Loading (skeleton) and error (retry) states, same
  visual language as `SystemDetailView`.
- Header: symbol, role (readable text), status badge (readable text, same
  color mapping as Fleet list), current position (waypoint symbol), ETA when
  `IN_TRANSIT`, fuel (current/capacity + gauge, reusing `ProgressBar` +
  `percentOf` as in Fleet list), cooldown (`remainingSeconds`).
- Position becomes a link to `/markets/:waypointSymbol` only when that
  waypoint has a market. Determined by fetching the single waypoint
  (`GET /systems/:systemSymbol/waypoints/:waypointSymbol`, new `getWaypoint`
  helper in `features/systems/api/waypoint.ts`, reusing the existing
  `waypointSchema`) and checking its `traits` for `MARKETPLACE` — the same
  check `SystemDetailView` already does for the waypoints table. The system
  symbol is derived from the ship's waypoint symbol with the existing
  `systemSymbolFromWaypoint` helper. While that lookup is pending, or if it
  fails, the position renders as plain text (this is a decorative enhancement
  on top of the primary ship data, not a second blocking error state).
- Cargo table: item symbol, item name, units — no sort/filter/pagination (a
  fixed-size embedded list from the ship response, not a paginated resource;
  matches the project's "no shared component ahead of a second real need"
  rule from `specs-techniques.md`).
- Crew section: current/required/capacity, morale, rotation (readable text),
  wages.
- Components section: frame, reactor, engine — each as name + condition
  gauge (reusing `ProgressBar` + `percentOf`, condition treated as a 0–1
  ratio like `percentOf(component.condition, 1)`). Modules and mounts as
  badges showing the API's own `name` field, same visual treatment as
  waypoint trait badges in `SystemDetailView` (no `MARKETPLACE`/`SHIPYARD`
  color coding — plain badge style, since modules/mounts aren't traits).
- Back link to `/fleet`.
- Extend `features/fleet/api/ship.schema.ts` (`shipSchema`) with `crew`,
  `frame`, `reactor`, `engine`, `modules`, `mounts`, `cooldown`, and
  `cargo.inventory`.

## Out of scope

- Any ship action (navigate, dock, refuel, extract, jettison, etc.) — this
  app is read-only end to end.
- A dedicated `useQuery` composable test for this screen — the project caps
  composable tests at the one paginated-list shape already covered by
  Systems list (`specs-techniques.md`: "1 ou 2, pas un par écran"); this is a
  single-resource `useQuery`, the same shape Dashboard's agent query already
  uses untested.
- Any new shared component. Cargo/crew/component sections are plain markup,
  not a second consumer of anything extractable yet.
- Color-coding modules/mounts by symbol prefix — the design system only
  defines signal colors for status/trait badges already covered elsewhere.

## Build loop

Each step below is small and reviewed before the next starts
(`workflow.stepReview: every`). On approval, commit that step as a checkpoint
on `feature/fleet-detail` before moving on (`workflow.checkpointCommits:
enabled`). `/complete` still creates the final feature commit and archive.

## Build steps

- [x] 1. Add the route and the single-ship fetch. Extend `shipSchema` with
      `cooldown: { remainingSeconds: number }` only (the smallest useful
      slice). Add `getShip(shipSymbol)` to `ship.ts`. Add
      `FleetDetailView.vue` rendering just the header: symbol, readable
      role, status badge (reuse the same badge color map as `FleetView`),
      plain-text position, ETA when `IN_TRANSIT`, fuel gauge, cooldown text
      (`Cooldown: Xs` when `remainingSeconds > 0`, else `None`), loading
      skeleton, error+retry, back link to `/fleet`. Wire
      `{ path: '/fleet/:shipSymbol', name: 'fleet-detail', component:
      FleetDetailView, beforeEnter: requireAuth }` in `router/index.ts`.
      Extend `ship.schema.test.ts` with the new `cooldown` field (valid case
      + one contract-breaking case).
      **Done when:** navigating from the Fleet list to a ship shows the
      header with live data, loading and error states both render, and
      `npm run test:unit` / `npm run type-check` pass.

- [x] 2. Make the position a market link when applicable. Add `getWaypoint`
      to `features/systems/api/waypoint.ts`. In `FleetDetailView`, run a
      second `useQuery` (enabled once the ship loads) for
      `getWaypoint(systemSymbolFromWaypoint(ship.nav.waypointSymbol),
      ship.nav.waypointSymbol)`; render the position as a `RouterLink` to
      `/markets/:waypointSymbol` when its `traits` include `MARKETPLACE`,
      otherwise keep it as plain text.
      **Done when:** a ship docked/orbiting/in a system whose waypoint has a
      `MARKETPLACE` trait shows a working link to that market; a ship at a
      waypoint without one shows plain text; `npm run type-check` passes.

- [x] 3. Cargo table. Extend `shipSchema.cargo` with `inventory: { symbol,
      name, units }[]`. Render a plain table (item name, units) below the
      header — empty-inventory state shows a "Cargo hold is empty" message
      instead of an empty table. Extend `ship.schema.test.ts` for the new
      `cargo.inventory` field.
      **Done when:** a ship with cargo shows its inventory rows, a ship with
      empty cargo shows the empty-state message, and
      `npm run test:unit` / `npm run type-check` pass.

- [x] 4. Crew section. Extend `shipSchema` with `crew: { current, required,
      capacity, morale, rotation, wages }`. Render current/required/capacity,
      morale, rotation (readable text), wages. Extend
      `ship.schema.test.ts`.
      **Done when:** crew data renders correctly for a live ship and
      `npm run test:unit` / `npm run type-check` pass.

- [x] 5. Components section. Extend `shipSchema` with `frame`, `reactor`,
      `engine: { name, condition }` and `modules`, `mounts: { symbol,
      name }[]`. Render each component as name + condition gauge; modules
      and mounts as badges (API `name` field, plain badge style). Extend
      `ship.schema.test.ts` for all five fields together (one valid payload
      covering the full extended shape, one contract-breaking case).
      **Done when:** components, modules, and mounts render for a live ship,
      and `npm run test:unit` / `npm run type-check` pass.

## Files / areas

- `src/router/index.ts` - new route
- `src/features/fleet/views/FleetDetailView.vue` - new
- `src/features/fleet/api/ship.ts` - `getShip`
- `src/features/fleet/api/ship.schema.ts` - schema extension (across steps
  1, 3, 4, 5)
- `src/features/fleet/api/ship.schema.test.ts` - matching test extension
- `src/features/systems/api/waypoint.ts` - `getWaypoint` (cross-feature
  import from `fleet`, same pattern Dashboard already uses importing
  `fleet/api/ship`)
- `src/shared/lib/spacetraders.ts` - no changes; reuse `percentOf`,
  `toReadableText`, `systemSymbolFromWaypoint`

## Data / contracts

- `GET /my/ships/:shipSymbol` → same envelope as every other single-resource
  endpoint (`{ data: Ship }`), validated by the extended `shipSchema`.
- `GET /systems/:systemSymbol/waypoints/:waypointSymbol` → `{ data: Waypoint
  }`, reusing the existing `waypointSchema` unchanged.
- New `shipSchema` fields are all `z.number()`/`z.string()` (no enums added)
  except the already-established `nav.status` enum — matching this schema's
  existing precedent of strict enums only for the small, already-proven
  status set, and loose strings elsewhere (`crew.rotation`, module/mount
  `name`) since their full value sets aren't otherwise established in this
  repo.
- `condition` (frame/reactor/engine) is treated as a 0–1 ratio for the
  percent gauge (`percentOf(condition, 1)`). Confirmed against a live
  `GET /my/ships/:shipSymbol` reply during step 5 (a fresh ship's
  components returned `condition: 1`, rendering correctly as 100%) — no
  gauge math adjustment needed.
- `cooldown` is modeled as `{ remainingSeconds: number }` only — no
  `totalSeconds`/`expiration`, since nothing in this feature displays them.

## Testing

- `ship.schema.test.ts`: one valid-payload case and one contract-breaking
  case per step that extends the schema (steps 1, 3, 4, 5), following the
  existing file's pattern.
- No new composable or component tests (see Out of scope).

## Notes for the AI

- Mirror `SystemDetailView.vue`'s loading/error visual language (skeleton
  block, danger banner + retry button) for the primary ship query; mirror
  `FleetView.vue`'s status-badge color map and `ProgressBar` usage for fuel
  and component-condition gauges.
- The market-link waypoint query is a secondary, non-blocking enhancement —
  never let its loading/error state block or dim the primary ship data.
- Keep the five build steps in order; each must leave `npm run type-check`
  and `npm run test:unit` passing before moving to the next.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9545,"specSha256":"870f15ff16846aaadae6ebe5c4ab071177a1e2d4d6d864689f634d7282496e88","branch":"refs/heads/feature/fleet-detail","head":"dd9f1410b7e43de9ce9cfba1e843853a15b1572f","baseRef":"refs/heads/main","baseCommit":"dd9f1410b7e43de9ce9cfba1e843853a15b1572f","sourceTree":"e83e2e794401f3ad224be9ce09066bfb327dcd42","absentOptional":[]} -->
