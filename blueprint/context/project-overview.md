# Space Tracker - Project Overview

<!-- blueprint:source-hash b54606cf7dfc96505e8e2aaeec2a086e1e89b0b919a32dafef13ae492c7089ba -->

> A read-only web control panel for a SpaceTraders agent: authenticate with an
> agent token, then browse fleet, systems, and market data without hitting the
> raw API directly.

## Problem

SpaceTraders exposes a full game API (fleet, systems/waypoints, markets,
contracts, factions) but ships no first-party web UI. Space Tracker gives a
player a single-page dashboard over their agent's status, fleet, known
systems, and market data instead of calling the API by hand.

## Users

Single self-service user per running instance: whoever enters their own agent
token on `/login`. No multi-user account system — the app is a personal
control panel over one agent's data at a time.

## Usage model

- **Scale**: single agent/session at a time, no shared state across users —
  each browser session holds its own token and sees only that agent's data.
- **Operation**: runs locally for the deliverable; client-only SPA, no
  backend/BFF.
- **Trust**: the running user is trusted (own token, own data) — no
  cross-user data boundary to defend.
- **Security posture (token)**: as sensitive as a password (full account
  access); inherently visible in DevTools for a backend-less SPA — accepted,
  documented risk. Mitigations: `sessionStorage` via a dedicated Pinia store
  (not `localStorage`, not pure in-memory), never logged, never in a
  URL/query string (`Authorization` header only), no `v-html` on API data,
  `.env` gitignored with a secret-free `.env.example`, `package-lock.json`
  committed, `npm audit` as a non-blocking first CI stage.
- **Out of scope (v2+)**: backend/BFF issuing an `httpOnly` cookie (the only
  real XSS-proof option), token rotation/expiration.
- **Compliance/audit**: none specified.

## Features

In build order. **Fleet management (#11-#12) is the headline feature** — the
richest data model (fuel, cargo, crew, components) and the clearest expression
of the "control-room console" concept.

1. **CI/CD pipeline** - GitLab CI: `npm audit` (non-blocking) → lint →
   type-check → tests → build, on Merge Requests only. Gates every merge to
   `main`.
2. **Shared API client** (`shared/api/http.ts`) - centralized `request<T>(url,
   schema, options?)`: Zod validation on every response, automatic
   `Authorization` injection from the Pinia token store (overridable via
   `options.token`), centralized 401 → `/login` redirect (skippable via
   `options.skipAuthRedirect`), and list pagination handling.
3. **Design system setup** (`src/assets/main.css`, `src/main.ts`) - port the
   Tailwind v4 `@theme` tokens (surfaces, signal colors, radii, font) from
   `identite-visuelle.md`/the design system PDF into the real stylesheet, add
   `@fontsource/ibm-plex-mono`, and configure PrimeVue's global unstyled
   pass-through for `DataTable`+`Paginator` and `ProgressBar` (the two
   components a planned feature actually uses).
4. **Auth: login + token store** (`/login`) - token input, validates via
   `GET /my/agent` using `options.token` (nothing is stored yet), stores on
   success, inline error on failure. Pinia store persisted to
   `sessionStorage`.
5. **Authenticated layout** - top nav (Dashboard/Systems/Fleet, no
   submenus), active item highlighted, logout clears the token.
6. **Dashboard** (`/`) - 4 agent tiles (identity/faction, credits, ship
   count, starting system) + a fleet preview mini-table linking to `/fleet`.
7. **Systems list** (`/systems`) - paginated table of known systems: symbol,
   name, sector, star type, waypoint count. First table in the app.
8. **System detail** (`/systems/:systemSymbol`) - header + paginated
   waypoints table (type/trait badges; `MARKETPLACE` links to a market,
   `SHIPYARD` flagged).
9. **Systems list: search by symbol** (`/systems`) - symbol search field +
   "Explore" button next to the existing filter/sort controls; Zod-validated
   exact system-symbol format (`SECTOR-SYSTEM`, case-insensitive), button
   disabled until valid, redirects to the matching system's detail page.
10. **Extract shared DataTable** (`shared/ui/DataTable`) - sort/search/
    pagination logic pulled out of Systems list once Fleet list is its second
    real consumer; Systems list migrated onto it, no behavior change.
11. **Fleet list** (`/fleet`) - paginated table of ships: role, status badge,
    position, ETA (if `IN_TRANSIT`), cargo (units/capacity), fuel
    (current/capacity).
12. **Fleet detail** (`/fleet/:shipSymbol`) - header (status, position, ETA,
    fuel, cooldown); cargo table; crew; frame/reactor/engine/modules/mounts.
13. **Market** (`/markets/:waypointSymbol`) - traded goods table (price,
    volume, supply, activity); "limited info" state when `tradeGoods` is
    absent (only present when an agent ship is on the waypoint). Reached only
    by drill-down, no direct nav entry.
14. **404 page** - catch-all route, "not found" + link to `/`.
15. **Documentation (README)** - setup, run locally, stack. Per-feature docs
    are already produced by `/complete` archiving under `blueprint/history/`.

## Data model

Server data is fetched and cached via TanStack Query, never duplicated into
Pinia. `Ship`'s schema builds incrementally across features 6 → 11 → 12; other
models are colocated with the single feature that introduces them.

### Agent

`GET /my/agent` — colocated in `features/auth/api/agent.schema.ts`.

- `symbol` (string)
- `credits` (number)
- `headquarters` (string, waypoint symbol)
- `startingFaction` (string) - static badge only, no faction screens (v2+)
- `shipCount` (number)

### System

`GET /systems`, `GET /systems/:systemSymbol` —
`features/systems/api/system.schema.ts`.

- `symbol` (string)
- `name` (string) - falls back to `symbol` when absent
- `sectorSymbol` (string)
- `constellation` (string)
- `type` (string) - star type
- `x`, `y` (number)
- `waypoints` (embedded, not used by the waypoints table - see below)
- `factions` (array)

### Waypoint

`GET /systems/:systemSymbol/waypoints` (paginated separately from
`System.waypoints`) — `features/systems/api/waypoint.schema.ts`.

- `symbol` (string)
- `type` (string)
- `traits` (string[]) - badges; `MARKETPLACE` links to `Market`, `SHIPYARD`
  flagged
- belongs to a `System`

### Ship

`GET /my/ships`, `GET /my/ships/:shipSymbol` —
`features/fleet/api/ship.schema.ts`, introduced minimal in #6 (`symbol`,
`status`, `waypointSymbol`), extended in #11, extended again in #12.

- `symbol` (string)
- `registration.role` (string)
- `nav.status` (string) - `IN_ORBIT` / `DOCKED` / `IN_TRANSIT`
- `nav.waypointSymbol` (string) - current position
- `nav.route.arrival` (string, timestamp) - ETA, shown only when
  `IN_TRANSIT`
- `cargo.units` / `cargo.capacity` (number), `cargo.inventory` (item +
  quantity list)
- `fuel.current` / `fuel.capacity` (number)
- `frame`, `reactor`, `engine` (object: name + condition)
- `modules`, `mounts` (string[] badges)
- `crew` (current/required/capacity, morale, rotation, wages)
- `cooldown`

### Market

`GET /systems/:systemSymbol/waypoints/:waypointSymbol/market` —
`features/markets/api/market.schema.ts`.

- `symbol` (waypoint symbol)
- `exports`, `imports`, `exchange` (trade good lists)
- `tradeGoods` (conditional - only present when an agent ship is on the
  waypoint: buy/sell price, trade volume, supply, activity)
- `transactions` (present in the model, not prioritized for MVP display)

## Tech stack

- **Vue 3** + TypeScript (Composition API)
- **Pinia** - client-only state (token/session), never server data
- **Vue Router**
- **Vitest** - unit tests, pure logic only for MVP (no component mounting)
- **Zod** - API response validation at the boundary; types via `z.infer`
- **Tailwind 4** - 100% of styling
- **PrimeVue (unstyled)** - interaction logic only (sortable/paginated
  `DataTable`, dropdowns, modals, keyboard a11y); Tailwind drives all visuals
- **@fontsource/ibm-plex-mono** - self-hosted IBM Plex Mono (400/500/600/700)
- **TanStack Query (Vue Query)** - server-state fetching/caching, one
  `useQuery` per screen/resource, no mutations
- ESLint + oxlint + Prettier
- **GitLab CI/CD** - see Deployment

Code structure: by domain (`auth`, `systems`, `fleet`, `markets`) with a
`shared/` folder for cross-cutting UI/utils/API client.

## Monetization

Not applicable — no monetization model exists or is planned.

## UI/UX

**Concept**: spacecraft control-room console — near-black background, fully
monospace (IBM Plex Mono, tabular numerals), dense data-first reading (tiles,
tables, gauges). Three surface levels, a single 1px border weight, two font
weights; hierarchy from size/weight/tracking, not a gray scale. Four signal
colors (`accent`/`warn`/`info`/`danger`, see `identite-visuelle.md`) carry all
business meaning — no decorative color outside those tokens.

**Language**: all UI copy in English. Raw `SNAKE_CASE` API values (status,
type, trait fields) are converted to readable text (`IN_ORBIT` → "IN ORBIT");
`symbol` fields are identifiers and always shown as-is.

**Routes**:

- `/login` - token entry, no header/nav
- `/` - dashboard (agent tiles + fleet preview)
- `/systems`, `/systems/:systemSymbol`
- `/fleet`, `/fleet/:shipSymbol`
- `/markets/:waypointSymbol` - drill-down only, no direct nav entry
- `/:pathMatch(.*)*` - 404, no header/nav

Top nav (Dashboard, Systems, Fleet - no submenus) shown on all authenticated
routes; logout on the right.

**Responsive**: desktop and tablet only. Mobile is out of MVP scope - the
heavy `DataTable` usage would need a dedicated redesign, not just breakpoints.

## Deployment

No hosting/deployment target. The deliverable is a versioned repo with clean
history, clear docs, and a project that runs locally — not a deployed
instance.

- **CI/CD** (GitLab CI): `npm audit` (non-blocking) → lint (ESLint) →
  type-check (`vue-tsc`) → tests (Vitest) → build (`vite build`), the last
  four blocking in sequence. Triggered on Merge Requests only.
- **Git workflow**: one `feature/xxx` branch per feature, pipeline green
  before merging to `main`, squash-merge (one commit per feature), remote
  branch deleted on merge.
- **Env vars**: `VITE_API_BASE_URL` (SpaceTraders API base) via Vite env var,
  `.env`/`.env.example`. No server secrets - no backend exists.
