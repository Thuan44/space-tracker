# Project Plan

> One of the two planning docs you provide. Use as much detail as the project
> needs, including rationale, constraints, examples, edge cases, and explicit
> exclusions that should guide later feature work. Draft it directly, develop it
> through any AI conversation, or optionally run `/discovery` for a guided deep
> planning session. The content is always yours to direct. When it is filled in,
> run `/overview` to generate the project overview from this plus `build-plan.md`.

Source of truth: the Obsidian vault under `blueprint/specs/` (`brief.md`,
`specs-techniques.md`, `identite-visuelle.md`, `securite.md`) and
`blueprint/reference/` (wireframes, design system, entity diagram). This file
summarizes and cross-references those documents; it does not replace them.

## 1. Problem - What problem are we solving?

Space Tracker is a web control interface for a [SpaceTraders](https://spacetraders.io/openapi)
space-trading-game agent. SpaceTraders exposes a full game API (fleet
management, systems/waypoints exploration, markets, contracts, factions) but
no first-party web UI. Space Tracker gives a player a single-page dashboard to
authenticate with their agent token, see their agent's status, browse the
stellar systems they know about, inspect their fleet, and check market data —
without hitting the raw API directly.

## 2. Users - Who is this for?

SpaceTraders players/agents who want to manage their fleet and commercial
operations from a web interface instead of calling the API directly. In
practice, for this project's lifetime that's a single self-service user per
running instance: whoever enters their own agent token on `/login`. There is
no multi-user account system — the app is a personal control panel over one
agent's data at a time (see [Usage model](#9-usage-model-and-constraints-optional)).

## 3. Features - What does the MVP need?

In-scope MVP features, from `brief.md` section "Fonctionnalités / périmètre",
cross-referenced with the route breakdown in `specs-techniques.md`:

1. **Authentication / Agent** — enter and validate an agent token
   (`GET /my/agent`), store it, display agent info.
   - Routes: `/login`, agent tiles on `/`.
2. **Stellar systems exploration** — list known systems, drill into a
   system's detail page (which includes its waypoints).
   - Routes: `/systems`, `/systems/:systemSymbol`.
3. **Fleet management** — list the agent's ships and their info, drill into
   a single ship's detail.
   - Routes: `/fleet`, `/fleet/:shipSymbol`.
4. **Markets** — view a waypoint's traded goods and (when available) their
   prices.
   - Route: `/markets/:waypointSymbol`, reached by drill-down from a system's
     waypoint list or a ship's current position — no direct nav entry.

Supporting, non-domain routes required to make the above usable:

- `/` — dashboard (agent summary tiles + fleet preview).
- `/:pathMatch(.*)*` — 404 page.

All MVP read paths are read-only: no ship navigation, no market buy/sell, no
contract handling.

### Out of scope (v2+)

From `brief.md` "Hors scope (v2+)":

1. **Real-time notifications/events** (optional in the brief) — not needed to
   demonstrate the core features within the delivery window.
2. **Commercial action planning (buy/sell on a market)** — the brief's
   product-context paragraph mentions it, but the actual evaluated feature
   list only asks for market _display_. The `Market` data model and API
   client are designed to be extensible toward this later
   (`specs-techniques.md` "Couche API"), but no mutation endpoint ships in
   the MVP.
3. **Ship navigation / piloting** — explicitly considered and rejected:
   navigating a ship is a real mutation with side
   effects (fuel cost, `IN_TRANSIT` state, same-system-only without a jump
   module, new error cases). Demo data variety is achieved instead by a
   handful of manual `navigate` calls (curl/Postman) outside the app before
   recording a demo, not by an in-app feature.
4. **Faction management** — `Agent.startingFaction` is displayed as a static,
   informational badge only; no faction-specific screens or logic.
5. **Contracts, Shipyard purchases** — noted in the entity diagram
   (`relations-entites.png`) as secondary entities outside the MVP's
   evaluated scope.
6. Mobile-optimized responsive design — desktop/tablet only (see
   [UI/UX](#7-uiux---how-should-this-look-and-feel)).

## 4. Data - What are we storing?

Server data (SpaceTraders API), fetched and cached via TanStack Query —
never duplicated into Pinia (`specs-techniques.md` "Données serveur vs état
applicatif"):

- **Agent** (`GET /my/agent`) — `symbol`, `credits`, `headquarters`,
  `startingFaction`, `shipCount`.
- **System** (`GET /systems`, `GET /systems/:systemSymbol`) — `symbol`,
  `name`, `sectorSymbol`, `constellation`, `type`, `waypoints`, `x`, `y`,
  `factions`.
- **Waypoint** (`GET /systems/:systemSymbol/waypoints`) — `symbol`, `type`,
  `traits`.
- **Ship** (`GET /my/ships`, `GET /my/ships/:shipSymbol`) — `symbol`,
  `registration.role`, `nav.status`, `nav.waypointSymbol`,
  `nav.route.arrival`, `cargo.units`/`capacity`/`inventory`,
  `fuel.current`/`capacity`, `frame`, `reactor`, `engine`, `modules`,
  `mounts`, `crew`, `cooldown`.
- **Market** (`GET /systems/:systemSymbol/waypoints/:waypointSymbol/market`)
  — `symbol`, `exports`, `imports`, `exchange`, `tradeGoods` (conditional on
  agent ship presence), `transactions` (present in the model, not prioritized
  for MVP display).

Client state (Pinia, not server data):

- **Session/token** — the agent's SpaceTraders API token, `sessionStorage`
  via a dedicated Pinia store. See [Security](#9-usage-model-and-constraints-optional)
  for storage rationale.

All server responses are validated at the boundary with Zod schemas
(`features/<domain>/api/*.schema.ts`), one per domain, colocated with the
code that uses them — no centralized `schemas/` folder. TypeScript types are
derived via `z.infer`, so the schema is the single source of truth.

## 5. Tech - What stack are we using?

From `specs-techniques.md`, already scaffolded in this repo:

- **Vue 3** + TypeScript (Composition API)
- **Pinia** — client-only state (token/session)
- **Vue Router**
- **Vitest** — unit tests (pure logic only for MVP, see Testing below)
- **Zod** — API response validation + inferred types
- **Tailwind 4** — all styling
- **PrimeVue (unstyled)** — interaction logic for complex components
  (sortable/paginated `DataTable`, dropdowns, modals, keyboard a11y) with
  Tailwind driving 100% of the visuals
- **TanStack Query (Vue Query)** — server-state fetching/caching, one basic
  `useQuery` per screen/resource, default `staleTime`, no mutations
- ESLint + oxlint + Prettier (already configured)
- GitLab CI/CD (see [CI/CD](#8-deployment---where-and-how-will-this-ship))

**Code structure**: by domain (`auth`, `systems`, `fleet`, `markets`) rather
than by file type, with a `shared/` folder for cross-cutting code (generic UI,
common types/utils, base API client). Chosen for scalability if new domains
are added later.

**API layer**: centralized HTTP client in `shared/api/http.ts` — no scattered
`fetch` calls in features. Injects the `Authorization` header from the Pinia
token store automatically, centralizes 401 handling (redirect to `/login`),
and handles the API's list pagination in the client rather than per-consumer.
Built around a generic `request<T>(url, schema, options?)` function that pipes
every response through its Zod schema via `safeParse()`, logging the detail
(`result.error.format()`) before throwing a generic error — no new UI state,
contract failures land in the same per-screen "error (retry)" state as
network failures. `options.token` is an optional override used only by the
login validation call (`features/auth`): at that point the token isn't in the
Pinia store yet (it's only stored after `GET /my/agent` succeeds), so this is
the one caller that supplies the just-entered token explicitly instead of
relying on the automatic store lookup. That same call also skips the
centralized 401 → `/login` redirect (already on `/login`; an invalid token
surfaces as the form's own inline error per feature #3, not a redirect).

**Testing** (Vitest, pure logic only for MVP — no `@vue/test-utils`/component
mounting this iteration, per `specs-techniques.md` "Tests"):

- One representative Zod schema (`Agent`): valid case + contract-breaking
  case via `safeParse()`.
- API client (`shared/api/http.ts`): `Authorization` header injection, 401
  redirect, pagination logic. `request<T>()` itself is tested against a
  hand-mocked `fetch` (not `vi.mock()`, which would bypass the layer under
  test) — MSW considered only if this need grows.
- 1–2 `useQuery` composables: success/loading/error states.
- Pinia token/session store: login stores the token, logout clears it.
- Mocking strategy elsewhere: `vi.mock()` on `features/<domain>/api/*`
  modules (`mockResolvedValue`/`mockRejectedValue`).

Deferred to v2 (needs `@vue/test-utils`): conditional `tradeGoods`
rendering on `/markets/:waypointSymbol`, generic `DataTable` behavior
(sort/search/pagination events), routing tests (no-token redirect, 404).

## 6. Monetize - How will this make money?

Not applicable — no monetization model exists or is planned in any spec
document.

## 7. UI/UX - How should this look and feel?

**UI copy language: English.** Per `specs-techniques.md` ("Langue de
l'interface") — all displayed text (labels, buttons, messages, titles) is in
English. The specs themselves stay written in French as the authoring
language; that's separate from the shipped app's copy.

Full detail in `identite-visuelle.md`; visual references in
`blueprint/reference/design/` (design system PDF, wireframes, dashboard
mockup — see note below on binary assets).

**Concept**: a spacecraft control-room console — near-black background,
fully monospace with tabular numerals (columns of digits align without
per-cell utilities), dense data-first reading (tiles, tables, gauges). Three
surface levels + a single 1px border weight + two font weights: hierarchy
comes from size/weight/tracking, not a gray scale. Four signal colors
(accent/warn/info/danger) carry all business meaning (ship status, supply
levels, links, errors) — no decorative color outside those four tokens.

**Palette** (measured ≥ AA contrast on `surface-0`):

| Token       | Hex       | Role                                                                                |
| ----------- | --------- | ----------------------------------------------------------------------------------- |
| `surface-0` | `#0B0F14` | Page background                                                                     |
| `surface-1` | `#111820` | Card, panel, thead                                                                  |
| `surface-2` | `#1A222C` | Hover, elevated state, skeleton                                                     |
| `line`      | `#26303C` | All 1px borders                                                                     |
| `fg`        | `#E8EDF2` | Primary text (16.2:1)                                                               |
| `muted`     | `#8A97A5` | Secondary text/labels (6.4:1)                                                       |
| `accent`    | `#2EE6A6` | Primary/positive — section titles, primary button, `DOCKED`, `HIGH`, healthy gauges |
| `warn`      | `#F5A623` | Medium — `IN_TRANSIT`, `MODERATE`, `WEAK`, 20–49% gauges                            |
| `info`      | `#5AC8E8` | Informational — links, `IN_ORBIT`, `IMPORT`, `MARKETPLACE`, cargo                   |
| `danger`    | `#F0554D` | Error/critical — error banners, `LOW`, <20% gauges                                  |

Fill rule: `bg-{token}/10` + `border-{token}/30` + `text-{token}` for badges/
banners/highlights — no other opacities.

**Badge text**: raw API values (`nav.status`, `waypoint.type`, `traits`,
`tradeGoods.type`, ...) come back `SNAKE_CASE` (e.g. `IN_ORBIT`,
`MARKETPLACE`). Always convert to readable text before display — underscore
to space, e.g. `IN_ORBIT` → `IN ORBIT` — per `identite-visuelle.md`. Visual
uppercasing is already handled by the Label token's `uppercase` class, so
this is a data-formatting step, not a styling one. **Exception**: `symbol`
fields (agent, system, waypoint, ship, e.g. `X1-DF55`, `MYSHIP-1`) are
identifiers, not enum values — always displayed as-is, never converted.

**Typography**: single family, IBM Plex Mono (400/500/600/700),
`font-variant-numeric: tabular-nums` on `body`. Six size steps, with a
deliberate jump from the 13px "data" size straight to the 44px "metric" size
so hero numbers dominate without a second family. Full type scale and
Tailwind classes are in `identite-visuelle.md`.

**Primitives**: 4 radius steps (2/4/6px + full for gauge bars only), 4px-base
spacing scale (6 through 40), and a fixed set of control dimensions (40px
control height, 32px compact, 64px app header, 48px table row, 8px gauge
bar). See `identite-visuelle.md` for the full list.

**Layout/Header**: a top nav bar (not a sidebar — 3 items: Dashboard,
Systems, Fleet, no submenus) shown on all authenticated routes (`/`, `/systems`,
`/systems/:systemSymbol`, `/fleet`, `/fleet/:shipSymbol`,
`/markets/:waypointSymbol`), absent on `/login` and the 404 page. Active nav
item highlighted by current route. Logout button on the right clears the
token (Pinia/`sessionStorage`) and redirects to `/login`. No login button in
the header — auth only happens on `/login`.

**Responsive**: desktop and tablet only. Mobile is explicitly out of MVP
scope — the app is a desktop-oriented SaaS control interface, and its heavy
`DataTable` usage (fleet/systems/markets) would need a dedicated redesign
(cards, conditional columns) rather than simple Tailwind breakpoints to be
genuinely usable on mobile. Minimum bar below tablet: no gross breakage
(e.g., no overflowing horizontal scroll). Tailwind's standard breakpoints
(640/768/1024/1280/1536px) are used where responsive behavior is addressed
at all.

**Reference assets** (binary files under `blueprint/reference/`, not
machine-read by this pass — noted here so `build-plan.md`/`/feature` can
point to them):

- `relations-entites.png` — entity-relationship diagram (Agent, Ship,
  System, Waypoint, Market as primary entities; Faction, Contract, Shipyard
  as secondary/out-of-scope).
- `flux-utilisateur.png` — user flow diagram.
- `design/wireframes/wireframe_login.png`, `wireframe_dashboard.png`,
  `wireframe_systems.png`, `wireframe_system-detail.png` — low-fidelity
  wireframes.
- `design/design-system/Space Tracker Design System.pdf` — full design
  system (tokens + component specs: buttons, badges, gauges, tables, cards,
  banners, icons, skeletons).
- `design/maquette_dashboard.png` — high-fidelity dashboard mockup.

## 8. Deployment - Where and how will this ship?

No hosting/deployment target. Per `brief.md` "Livrables attendus", the
deliverable is a versioned repo with a clean commit history, clear docs, and
a project that runs locally — not a deployed instance. `specs-techniques.md`
confirms the CI/CD pipeline has no deploy stage.

**CI/CD** (GitLab CI): `npm audit` (non-blocking, per `securite.md`
"Dépendances") first — cheapest check, reads only `package-lock.json`, so it
fails fastest on a known vulnerable dependency — then 4 blocking stages in
order per `specs-techniques.md`: lint (ESLint) → type-check (`vue-tsc`) →
tests (Vitest) → build (`vite build`). Triggered on Merge Requests only
(`workflow: rules` / `$CI_PIPELINE_SOURCE == "merge_request_event"`), not on
every branch push.

**Git workflow**: one `feature/xxx` branch per feature, pushed to the
remote to open an MR; pipeline must be green before merging to `main`;
squash-merge on integration (one commit per feature on `main`, no "wip"/"fix
typo" noise); remote branch deleted on merge (local branch may be kept).

**Documentation**: required deliverable per `brief.md` ("Documentation
claire"), broken down in `todo.md` ("Qualité"): a general README (setup, run
locally, stack) plus per-feature/fix documentation. The Blueprint workflow
already covers the latter — `/complete` archives each shipped feature/fix
under `blueprint/history/` — so the general README is the piece to write and
keep current explicitly.

**Env vars / secrets**: no backend, so no server secrets to configure for
deployment. The agent token is entered by the end user at runtime via
`/login` and never stored in `.env` or committed (see
[Security](#9-usage-model-and-constraints-optional)). The SpaceTraders API
base URL (e.g. `VITE_API_BASE_URL`) is read from a Vite env var rather than
hardcoded, per `securite.md` ("Secrets & configuration") — kept out of the
code so it can vary (staging, local mock, SpaceTraders-side change) without
a code change, even though it isn't itself a secret.

## 9. Usage model and constraints (optional)

- **Scale**: single agent/session at a time, no concurrent multi-user access
  to shared state — each browser session holds its own token and only ever
  sees that one agent's data.
- **Operation**: runs locally for the deliverable (see Deployment); client-
  only SPA, no backend/BFF.
- **Trust**: the running user is trusted (they enter their own token to see
  their own data) — there is no cross-user data boundary to defend, because
  there is no multi-user concept at all.
- **Security posture on the token** (`securite.md`): the agent API token is
  as sensitive as a password (full account access) and this is a
  backend-less SPA, so it is inherently visible in browser DevTools
  (Network tab) to anyone with access to the user's machine — accepted,
  documented risk. Mitigations actually in place:
  - Stored in `sessionStorage` via a dedicated Pinia store (survives
    refresh, cleared on tab close, not shared across tabs) — chosen over
    `localStorage` (persists indefinitely, same XSS exposure but no time
    bound) and over pure in-memory (strongest against persistent theft, but
    lost on every refresh). None of these options defend against XSS itself;
    only an `httpOnly` cookie via a backend would, and that's out of scope
    (see below).
  - Never logged (`console.log`, network error handlers, monitoring tools).
  - Never placed in a URL/query string — `Authorization` header only.
  - No `v-html` on API-sourced data (rely on Vue's default escaping).
  - `.env`/equivalent gitignored with a secret-free `.env.example`
    (also holds the API base URL, see Deployment); diff checked before each
    commit for stray secrets (public repo).
  - Lockfile committed (`package-lock.json`, already present); `npm audit`
    runs as a non-blocking first CI stage per `securite.md` (see CI/CD
    above).
- **Out of scope for security** (v2+): backend/BFF issuing an `httpOnly`
  cookie (the only real XSS-proof option), token rotation/expiration.
- **Compliance/audit**: none specified — not applicable to this project.
