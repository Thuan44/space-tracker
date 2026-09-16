# Build Plan

List the features that make up your project, high level and in rough build order.
Keep each item to one line; the details come later in `/feature`.

Plain bullets are fine. When both planning docs are ready, run `/overview`.
It adds tracking numbers and checkboxes to your feature list before generating
the project overview.

Run `/feature` to spec the next unchecked item, or `/feature 2` to pick one.
Keep completed items checked and append new features as the project grows.
Do not renumber completed features; their archived specs refer to those IDs.

Scaffolding the app and prototyping its look are pre-build steps, not features.
Start with your first real slice of functionality.

Ordered by dependency, not by page/route number. The current source tree
(`src/`) is still the default Vite scaffold (empty router, default counter
store, default `App.vue`): every item below is genuinely not started.

## Your features

- [ ] 1. **CI/CD pipeline** - GitLab CI with 5 stages in order: `npm audit`
      (non-blocking, dependency vulnerabilities only — per `securite.md`
      "Dépendances") → lint (ESLint) → type-check (`vue-tsc`) → tests
      (Vitest) → build (`vite build`), the last four blocking each other in
      sequence. `npm audit` runs first because it only reads
      `package-lock.json` — cheapest, most independent check, fails fastest
      on a known vulnerable dependency without waiting on the rest of the
      pipeline; kept non-blocking since no source doc sets a severity
      threshold to gate merges on. Triggered on Merge Requests only
      (`workflow: rules` / `$CI_PIPELINE_SOURCE == "merge_request_event"`),
      no deploy stage. Must exist before any feature branch can merge to
      `main`, per the git workflow in `specs-techniques.md`.

- [ ] 2. **Shared API client** (`shared/api/http.ts`) - foundation HTTP
      client every feature's API calls go through. Adds Zod as a dependency
      (already in `package.json`) and the generic `request<T>(url, schema,
      options?)` function that pipes every JSON response through its Zod
      schema via `safeParse()`, `console.error`-ing the detail
      (`result.error.format()`) before throwing a generic error. Also:
      automatic `Authorization` header injection from the Pinia token store,
      centralized 401 handling (redirect to `/login`), and list pagination
      handling in the client rather than per-consumer. `options.token` lets a
      caller override the store lookup with an explicit token, and
      `options.skipAuthRedirect` skips the centralized 401 → `/login`
      redirect — both used only by the login validation call (#3), never
      logged, same as the store token. Domain schemas
      (`Agent`, `System`, `Ship`, `Market`) are **not** built here — they
      ship colocated with their own feature below. SpaceTraders API base URL
      read from a Vite env var (`VITE_API_BASE_URL`, `.env`/`.env.example`)
      rather than hardcoded, per `securite.md`.
      - Tests: `Authorization` header injection (store token and
        `options.token` override), 401 → redirect (and 401 with
        `skipAuthRedirect` not redirecting), pagination logic; `request<T>()`
        itself tested against a hand-mocked `fetch` (not `vi.mock()`, which
        would bypass the layer under test).

- [ ] 3. **Auth: login + token store** (`features/auth`) - `/login` route:
      token input, link to https://my.spacetraders.io/login, validates via
      `GET /my/agent` (stores token on success, error message on failure),
      submit button with loading state. Validation call is a direct API-client
      call on submit, not a `useQuery` — it's a one-shot form action, not a
      reactive per-screen resource. Passes the just-entered token via the
      client's `options.token` override (#2) since nothing is in the Pinia
      store yet, and sets `options.skipAuthRedirect` so a 401 (invalid token)
      shows as this form's own inline error instead of triggering the
      centralized redirect. Token store: Pinia, persisted to
      `sessionStorage`, login stores the token / logout clears it. Colocated
      schema: `features/auth/api/agent.schema.ts` (`Agent`: `symbol`,
      `credits`, `headquarters`, `startingFaction`, `shipCount`).
      - Tests: `agentSchema` valid + contract-breaking case via
        `safeParse()`; Pinia store login/logout.

- [ ] 4. **Authenticated layout** (header/nav) - top nav bar (Dashboard,
      Systems, Fleet — no submenus), active item highlighted by current
      route; logout button clears the token and redirects to `/login`.
      Shown on all authenticated routes, absent on `/login` and the 404
      page. Depends on the token store (#3) for the logout action.

- [ ] 5. **Dashboard** (`/`) - 4 same-size tiles (identity + faction badge,
      credits, ship count, starting system with link to
      `/systems/:systemSymbol`, all from `Agent`), fleet preview mini-table
      (symbol/status/position — status as a readable-text badge, e.g.
      `IN_ORBIT` → "IN ORBIT", per `identite-visuelle.md`) with a "View full
      fleet" link to `/fleet`. Loading (skeleton/spinner) and error (retry)
      states.
      - **Dependency note**: the fleet preview reuses the same
        `GET /my/ships` call as the `/fleet` list (#9). Since #5 is built
        before #9, this item introduces `features/fleet/api/ship.schema.ts`
        and the ships API function — but with only the fields the preview
        needs (`symbol`, `status`, `waypointSymbol`), not the full `Ship`
        shape. #9 and #10 progressively extend this same schema with the
        fields they each need, rather than #5 front-loading all of it.
      - Tests: `useQuery` composable for a single resource (`Agent`) —
        success/loading/error states. First genuine `useQuery` consumer in
        build order (Auth's login call is a direct call, not a `useQuery`).

- [ ] 6. **Systems list** (`/systems`) - `GET /systems`, paginated
      DataTable: symbol (link to detail), name (falls back to symbol),
      sector, star type, waypoint count. Filter by symbol/sector, sort by
      star type and waypoint count, server-side pagination. Loading/error
      states. First table in the app — built directly in this feature per
      `specs-techniques.md` ("pas de composant partagé conçu à l'avance").
      Colocated schema: `features/systems/api/system.schema.ts`.
      - Tests: `useQuery` composable for a paginated list (`Systems`) —
        success/loading/error states. Second and last `useQuery` composable
        test per `specs-techniques.md` ("1 ou 2, pas un par écran") — later
        screens (System detail, Fleet list/detail, Market) reuse this same
        paginated-list shape without their own dedicated composable test.

- [ ] 7. **System detail** (`/systems/:systemSymbol`) - header (symbol,
      name, sector, constellation, star type, x/y); waypoints table
      (`GET /systems/:systemSymbol/waypoints`, paginated separately from
      `System.waypoints`): symbol, type, trait badges as readable text
      (`MARKETPLACE` links to `/markets/:waypointSymbol`, `SHIPYARD`
      flagged). Filter by
      type/trait, sort, server-side pagination, loading/error states, back
      link to `/systems`. Colocated schema:
      `features/systems/api/waypoint.schema.ts`.

- [ ] 8. **Extract shared DataTable** (`shared/ui/DataTable`) - pull the
      sort/search/pagination logic out of the Systems list (#6) table into a
      shared component, informed by both Systems list's real usage and the
      Fleet list's spec'd needs (#9) as the second consumer. Migrate Systems
      list onto it. No user-visible behavior change — verified by Systems
      list's existing coverage plus new tests on the extracted logic. Per
      `specs-techniques.md`: no component designed ahead of time, extracted
      only once a second real need is known ("2e occurrence").

- [ ] 9. **Fleet list** (`/fleet`) - `GET /my/ships`, built on
      `shared/ui/DataTable` (#8): symbol (link to detail), role, status as a
      readable-text badge (IN_ORBIT/DOCKED/IN_TRANSIT), current position,
      ETA (if IN_TRANSIT), cargo (units/capacity), fuel (current/capacity).
      Filter by
      role/status, sort, server-side pagination, loading/error states.
      Extends `features/fleet/api/ship.schema.ts` (introduced in #5) with
      `role`, `cargo`, `fuel`, `route.arrival`.

- [ ] 10. **Fleet detail** (`/fleet/:shipSymbol`) - header (symbol, role,
      status as a readable-text badge, current position — link to
      `/markets/:waypointSymbol` if that waypoint has a market, ETA if
      IN_TRANSIT, fuel level, cooldown); cargo table (item/quantity vs.
      capacity); crew (current/required/capacity, morale, rotation, wages);
      components (frame/reactor/engine — name + condition, modules/mounts
      as readable-text badges); back link to `/fleet`. Extends
      `features/fleet/api/ship.schema.ts` (introduced in #5, extended in
      #9) with `crew`, `frame`, `reactor`, `engine`, `modules`, `mounts`,
      `cooldown`.

- [ ] 11. **Market** (`/markets/:waypointSymbol`) - header (waypoint symbol,
      back link to parent system); traded goods table (name, type
      import/export/exchange, buy price, sell price, trade volume, supply,
      activity). Filter by name/type, sort by price/volume. "Limited info"
      state when `tradeGoods` is absent (API only returns it when an agent
      ship is present on the waypoint) — show goods without price columns
      plus an explanatory message. No pagination (endpoint returns
      everything at once). Loading/error states. Colocated schema:
      `features/markets/api/market.schema.ts`.

- [ ] 12. **404 page** - catch-all Vue Router route
      (`/:pathMatch(.*)*`), "page not found" message + link back to `/`.
      Distinct from the per-screen "error (retry)" states, which cover API
      call failures rather than a nonexistent route. No header/nav (same as
      `/login`).

- [ ] 13. **Documentation (README)** - required deliverable per `brief.md`
      ("Documentation claire") and `todo.md` ("Qualité"): general README
      covering setup, running locally, and the stack. Per-feature/fix
      documentation is already produced by `/complete` archiving each item
      under `blueprint/history/`, so this item is the general README itself
      — written once the feature set above is stable enough to describe
      accurately.

## Out of scope for this build plan (v2+)

See `project-plan.md` section 3 for the full list and rationale: real-time
notifications, market buy/sell, ship navigation/piloting, faction
management, contracts/shipyard purchases, mobile-optimized responsive design.
