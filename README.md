# Space Tracker

A web control panel for a [SpaceTraders](https://spacetraders.io/) agent:
authenticate with an agent token, browse fleet, systems, and market data, and
send ships to orbit, dock, navigate, and refuel — with live status updates and
toast notifications — without hitting the raw API by hand.

SpaceTraders exposes a full game API (fleet, systems/waypoints, markets,
contracts, factions) but ships no first-party web UI. Space Tracker is a
single-page dashboard over one agent's status, fleet, known systems, and
market data. It's a client-only SPA with no backend — each browser session
holds its own token and sees only that agent's data.

## Features

- **Dashboard** - agent identity, credits, ship count, starting system, and a
  fleet preview that live-updates while any ship is in transit
- **Systems** - browse and search known systems
- **System detail** - a system's waypoints, with links to markets
- **Fleet** - list of your ships with status, position, cargo, and fuel;
  live-updating while any ship is in transit
- **Fleet detail** - a ship's cargo, crew, fuel, and components; orbit, dock,
  navigate, and refuel actions with toast feedback and an arrival
  notification
- **Markets** - traded goods, prices, and supply/activity at a waypoint

## Prerequisites

- Node.js `^22.18.0` or `>=24.12.0` (see `engines` in `package.json`)
- A SpaceTraders agent token — register one at
  [my.spacetraders.io/login](https://my.spacetraders.io/login)

## Setup

```sh
npm install
```

Copy `.env.example` to `.env` and fill in both variables:

```sh
cp .env.example .env
```

- `VITE_API_BASE_URL` - the SpaceTraders API base URL
  (`https://api.spacetraders.io/v2`)
- `VITE_PRIMEUI_LICENCE_KEY` - **optional**. A PrimeVue community license key,
  generated at [primeui.dev/licenses](https://primeui.dev/licenses) (sign in,
  create a free community license, copy the generated key). It only silences
  PrimeVue's unlicensed-usage badge in the running app - no paid features are
  used, and everything works without it.

`.env` is gitignored; never commit real secrets to `.env.example`.

## Running locally

```sh
npm run dev
```

Open the app and sign in on `/login` with the agent token from
[my.spacetraders.io/login](https://my.spacetraders.io/login). The token is
kept in `sessionStorage` for the duration of the tab session, is never
logged, and is sent only via the `Authorization` header — never in a URL or
query string. It is still visible in DevTools, an accepted risk for a
backend-less SPA; a future backend/BFF issuing an `httpOnly` cookie would
close that gap but is out of scope for this project.

## Available scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the Vite dev server                  |
| `npm run build`        | Type-check and build for production        |
| `npm run preview`      | Preview the production build locally       |
| `npm run type-check`   | Type-check with `vue-tsc`                  |
| `npm run test:unit`    | Run unit tests with Vitest                 |
| `npm run lint`         | Lint with oxlint then ESLint (read-only)   |
| `npm run lint:fix`     | Lint with oxlint then ESLint, both `--fix` |
| `npm run format`       | Format `src/` with Prettier                |
| `npm run format:check` | Check `src/` formatting without writing    |

GitLab CI runs `npm audit` (non-blocking) → lint + format check →
type-check → tests → build on every push to `main`, so every merge produces
a visible pipeline run. `lint` and `format` only verify in CI — they never
rewrite files there, so a passing pipeline means the pushed code is actually
clean; use `npm run lint:fix` / `npm run format` locally to fix issues before
pushing. Changes land on `main` with a direct `git push`, without opening a
GitLab merge request, which is why the pipeline triggers on push rather than
on merge-request events. A real-world project with a team would instead gate
merge requests before they land on `main` — running on push here is a
solo-project trade-off to keep every change visible without that overhead.

## Tech stack

- **Vue 3** + TypeScript (Composition API)
- **Vue Router**
- **Pinia** - client-only state (token/session), never server data
- **TanStack Query (Vue Query)** - server-state fetching and caching
- **Zod** - API response validation at the boundary
- **Tailwind CSS 4** - styling
- **PrimeVue (unstyled)** - interaction logic (sortable/paginated tables,
  dropdowns) and toast notifications
- **@fontsource/ibm-plex-mono** - self-hosted IBM Plex Mono
- **Vitest** - unit tests
- ESLint + oxlint + Prettier
- **GitLab CI/CD**

Code is organized by domain (`auth`, `systems`, `fleet`, `markets`) with a
`shared/` folder for cross-cutting UI, utilities, and the API client.

## Not included (by design)

Space Tracker isn't a full way to play the game. On purpose, it doesn't
cover: buying/selling on markets, contracts or shipyard purchases, or
faction management. A mobile-optimized layout is also out of scope — the
data-dense tables need a dedicated redesign, not just breakpoints.

## Architecture

Code is organized by domain under `src/features/` (`auth`, `dashboard`,
`systems`, `fleet`, `markets`, `not-found`); each domain has a `views/`
folder and, when it fetches data or has logic worth sharing, its own `api/`
and/or `composables/`. `src/shared/` holds cross-cutting UI components,
composables, utilities, and the API client used across domains.

Data flows both ways:

**View to server** (queries and mutations):

```
view (.vue) → useQuery/useMutation → api/*.ts → shared/api/http.ts → Zod schema
```

A view calls TanStack Query's `useQuery` or `useMutation` directly, or through
a small domain composable when one exists (e.g. `useSystemsQuery`,
`useAgentQuery`, `useShipNavigation`) — either way, the query/mutation function
is a domain `api/*.ts` function. That function calls `shared/api/http.ts`'s
`request`/`requestPage`/`mutate`, which fetches from the SpaceTraders API,
validates the JSON response against a Zod schema, and throws a typed `ApiError`
(`shared/api/api-error.ts`) rather than a generic `Error` for any failure — a
rejected `fetch`, a non-2xx status, a malformed body, or a schema mismatch each
get their own `kind` (`auth`/`not-found`/`rate-limit`/`client`/`server`/`network`/`invalid-response`),
so callers can tell them apart instead of catching one opaque message.
`shared/lib/error-message.ts`'s `getErrorMessage(error, fallback)` turns that
`kind` into user-facing copy (used by `LoginView` and fleet navigation actions).

**Server to view** (live updates and notifications):

TanStack Query's automatic refetch and polling keep views current as server
state changes. Fleet views (`DashboardView`, `FleetView`, `FleetDetailView`)
poll their queries while any ship is in transit, so tables and status badges
update live as ships move. `FleetDetailView` watches the loaded ship's
`nav.status` and fires a PrimeVue toast notification when a ship arrives at
its destination. Navigation actions (orbit, dock, navigate, refuel) also
trigger immediate success/error toasts.

State is split by kind, not by convenience: **Pinia** (`src/stores/`) holds
client-only state — currently just the agent token/session — and never
server data; **TanStack Query** owns all server data (fleet, systems,
markets), including its fetching, caching, and loading/error states.

Auth is a single choke point, but it no longer lives in `http.ts`: the
`QueryClient` configured in `plugins/vue-query.ts` retries a query only for
the `ApiError` kinds where retrying can help (`network`, `server`,
`rate-limit`, with backoff that respects a 429's `Retry-After` header), and
its `QueryCache` logs out and redirects to `/login` whenever any query fails
with kind `auth` (`src/router/guards.ts` handles the reverse case — an
authenticated visit to `/login` redirects away). `http.ts` itself only
attaches the stored token as a `Bearer` header and maps failures to
`ApiError`; it has no router or store-logout dependency. There is no
separate auth service; any query can trigger this path.

## Decisions

- **Zod at the API boundary** - the SpaceTraders API is external and
  unversioned from this project's point of view; validating every response
  against a Zod schema turns a silent shape mismatch into a thrown error at
  the one place it's easy to trace, instead of a `TypeError` deep in a
  component.
- **TanStack Query for server state** - fetching, caching, loading/error
  state, and mutations for fleet/systems/market data are TanStack Query's job,
  so components and Pinia stores don't reimplement request de-duplication,
  cache invalidation, or optimistic updates. Polling with `refetchInterval`
  keeps fleet views live while ships are in transit.
- **`sessionStorage` for the token** - the token is treated as sensitive as a
  password. `sessionStorage` clears itself when the tab closes, unlike
  `localStorage`, which would outlive the session; it's still visible in
  DevTools, an accepted risk for a backend-less SPA.
- **PrimeVue unstyled + Tailwind** - PrimeVue supplies interaction logic
  (sortable/paginated tables, toast notifications) while Tailwind drives 100%
  of the visuals, avoiding a fight between two styling systems.
- **Polling over WebSockets** - live status updates use TanStack Query's
  `refetchInterval` polling rather than WebSockets. This keeps the
  architecture simple (no persistent connection, no server-side state) while
  still providing near-real-time updates for ship movements. The SpaceTraders
  API doesn't expose WebSockets, so polling is the only option for live data.

## Tests

Unit tests use **Vitest** and are colocated next to the code they cover as
`*.test.ts` (e.g. `src/shared/api/http.test.ts`). Coverage is pure logic:
schemas, composables, and utilities — no component mounting.

```sh
npm run test:unit
```

## Built with an AI workflow

This project was built with the support of an AI coding agent, using a
spec-first workflow: each feature was turned into a written spec, reviewed,
implemented step by step against that spec, and verified before moving on.
Every feature and fix in this repo's history has its own written record of
what changed and why, archived under `blueprint/history/`, not just a commit
message.
