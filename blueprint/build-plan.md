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

- [x] 1. **CI/CD pipeline** - GitLab CI with 5 stages in order: `npm audit`
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

- [x] 2. **Shared API client** (`shared/api/http.ts`) - foundation HTTP
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
      redirect — both used only by the login validation call (#4), never
      logged, same as the store token. Domain schemas
      (`Agent`, `System`, `Ship`, `Market`) are **not** built here — they
      ship colocated with their own feature below. SpaceTraders API base URL
      read from a Vite env var (`VITE_API_BASE_URL`, `.env`/`.env.example`)
      rather than hardcoded, per `securite.md`. - Tests: `Authorization` header injection (store token and
      `options.token` override), 401 → redirect (and 401 with
      `skipAuthRedirect` not redirecting), pagination logic; `request<T>()`
      itself tested against a hand-mocked `fetch` (not `vi.mock()`, which
      would bypass the layer under test).

- [x] 3. **Design system setup** (`src/assets/main.css`, `src/main.ts`) -
      port the Tailwind v4 `@theme` block from `identite-visuelle.md` / the
      design system PDF into the real stylesheet: 3 surfaces + `line` +
      `fg`/`muted` + 4 signal colors (`accent`/`warn`/`info`/`danger`), 4
      border radii (`xs`/`sm`/`md`/full), `--font-mono`; plus `@layer base
body` (background, color, font-family, `font-variant-numeric:
tabular-nums`). No custom spacing tokens needed — the design system's
      4px scale already matches Tailwind's default spacing utilities
      (`p-1`…`p-10`). Adds `@fontsource/ibm-plex-mono` (400/500/600/700) as a
      new dependency to self-host IBM Plex Mono — the design docs specify
      the typeface but not a loading mechanism, and self-hosting avoids an
      external Google Fonts request. Configures PrimeVue's global unstyled
      pass-through (`app.use(PrimeVue, { pt: {...} })`) for the two
      components a currently planned feature actually uses and the design
      system already gives exact `pt` objects for: `DataTable` + `Paginator`
      (table/pagination classes) and `ProgressBar` (fuel/cargo/condition
      gauge threshold coloring) — set once here so no later feature repeats
      them. Does not configure `Dialog` (no planned feature uses a modal
      yet) and does not extract Badge/Button/Card as shared Vue components;
      those stay Tailwind utility-class recipes applied per-usage in the
      feature that needs them first, per `specs-techniques.md` ("pas de
      composant partagé conçu à l'avance") — the same principle that defers
      the DataTable extraction to #10. `Dialog`'s pass-through gets added by
      whichever future feature introduces the first modal. - Tests: none (CSS tokens and plugin configuration, no logic to
      assert).

- [x] 4. **Auth: login + token store** (`features/auth`) - `/login` route:
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
      `credits`, `headquarters`, `startingFaction`, `shipCount`). - Tests: `agentSchema` valid + contract-breaking case via
      `safeParse()`; Pinia store login/logout.

- [x] 5. **Authenticated layout** (header/nav) - top nav bar (Dashboard,
      Systems, Fleet — no submenus), active item highlighted by current
      route; logout button clears the token and redirects to `/login`.
      Shown on all authenticated routes, absent on `/login` and the 404
      page. Depends on the token store (#4) for the logout action.

- [x] 6. **Dashboard** (`/`) - 4 same-size tiles (identity + faction badge,
      credits, ship count, starting system with link to
      `/systems/:systemSymbol`, all from `Agent`), fleet preview mini-table
      (symbol/status/position — status as a readable-text badge, e.g.
      `IN_ORBIT` → "IN ORBIT", per `identite-visuelle.md`) with a "View full
      fleet" link to `/fleet`. Loading (skeleton/spinner) and error (retry)
      states. - **Dependency note**: the fleet preview reuses the same
      `GET /my/ships` call as the `/fleet` list (#11). Since #6 is built
      before #11, this item introduces `features/fleet/api/ship.schema.ts`
      and the ships API function — but with only the fields the preview
      needs (`symbol`, `status`, `waypointSymbol`), not the full `Ship`
      shape. #11 and #12 progressively extend this same schema with the
      fields they each need, rather than #6 front-loading all of it. - Tests: `useQuery` composable for a single resource (`Agent`) —
      success/loading/error states. First genuine `useQuery` consumer in
      build order (Auth's login call is a direct call, not a `useQuery`).

- [x] 7. **Systems list** (`/systems`) - `GET /systems`, paginated
      DataTable: symbol (link to detail), name (falls back to symbol),
      sector, star type, waypoint count. Filter by symbol/sector, sort by
      star type and waypoint count, server-side pagination. Loading/error
      states. First table in the app — built directly in this feature per
      `specs-techniques.md` ("pas de composant partagé conçu à l'avance").
      Colocated schema: `features/systems/api/system.schema.ts`. - Tests: `useQuery` composable for a paginated list (`Systems`) —
      success/loading/error states. Second and last `useQuery` composable
      test per `specs-techniques.md` ("1 ou 2, pas un par écran") — later
      screens (System detail, Fleet list/detail, Market) reuse this same
      paginated-list shape without their own dedicated composable test.

- [x] 8. **System detail** (`/systems/:systemSymbol`) - header (symbol,
      name, sector, constellation, star type, x/y); waypoints table
      (`GET /systems/:systemSymbol/waypoints`, paginated separately from
      `System.waypoints`): symbol, type, trait badges as readable text
      (`MARKETPLACE` links to `/markets/:waypointSymbol`, `SHIPYARD`
      flagged). Filter by
      type/trait, sort, server-side pagination, loading/error states, back
      link to `/systems`. Colocated schema:
      `features/systems/api/waypoint.schema.ts`.

- [x] 9. **Systems list: search by symbol** (`/systems`) - search field next
      to the existing filter/sort controls on the Systems list (#7), plus an
      "Explore"/validate button. Field input is validated against the exact
      system symbol format (`SECTOR-SYSTEM`, e.g. `X1-DF55`) with Zod as the
      user types or on submit, case-insensitively — the schema normalizes
      the input (e.g. uppercases it) before checking the pattern and before
      the lookup, so `x1-df55` and `X1-DF55` both validate and resolve to
      the same system; the button stays disabled until the format is valid.
      On click: button shows a loading icon, then "Ready for exploration !" text
      for a short delay, then redirects to `/systems/:systemSymbol` (#8) —
      only an exact symbol match is accepted (aside from case), no
      partial/fuzzy search. Placed directly after System detail in the
      build order (rather than appended at the end) since the two are the
      core "explore a system" flow together. - Tests: `symbolSchema` valid/invalid format cases via `safeParse()`,
      including mixed-case input normalizing to a match; button disabled
      state tied to validation.

- [x] 10. **Extract shared DataTable** (`shared/ui/DataTable`) - pull the
      sort/search/pagination logic out of the Systems list (#7) table into a
      shared component, informed by both Systems list's real usage and the
      Fleet list's spec'd needs (#11) as the second consumer. Migrate Systems
      list onto it. No user-visible behavior change — verified by Systems
      list's existing coverage plus new tests on the extracted logic. Per
      `specs-techniques.md`: no component designed ahead of time, extracted
      only once a second real need is known ("2e occurrence").

- [x] 11. **Fleet list** (`/fleet`) - `GET /my/ships`, built on
      `shared/ui/DataTable` (#10): symbol (link to detail), role, status as a
      readable-text badge (IN_ORBIT/DOCKED/IN_TRANSIT), current position,
      ETA (if IN_TRANSIT), cargo (units/capacity), fuel (current/capacity).
      Filter by
      role/status, sort, server-side pagination, loading/error states.
      Extends `features/fleet/api/ship.schema.ts` (introduced in #6) with
      `role`, `cargo`, `fuel`, `route.arrival`.

- [x] 12. **Fleet detail** (`/fleet/:shipSymbol`) - header (symbol, role,
      status as a readable-text badge, current position — link to
      `/markets/:waypointSymbol` if that waypoint has a market, ETA if
      IN_TRANSIT, fuel level, cooldown); cargo table (item/quantity vs.
      capacity); crew (current/required/capacity, morale, rotation, wages);
      components (frame/reactor/engine — name + condition, modules/mounts
      as readable-text badges); back link to `/fleet`. Extends
      `features/fleet/api/ship.schema.ts` (introduced in #6, extended in
      #11) with `crew`, `frame`, `reactor`, `engine`, `modules`, `mounts`,
      `cooldown`.

- [x] 13. **Market** (`/markets/:waypointSymbol`) - header (waypoint symbol,
      back link to parent system); traded goods table (name, type
      import/export/exchange, buy price, sell price, trade volume, supply,
      activity). Filter by name/type, sort by price/volume. "Limited info"
      state when `tradeGoods` is absent (API only returns it when an agent
      ship is present on the waypoint) — show goods without price columns
      plus an explanatory message. No pagination (endpoint returns
      everything at once). Loading/error states. Colocated schema:
      `features/markets/api/market.schema.ts`.

- [x] 14. **404 page** - catch-all Vue Router route
      (`/:pathMatch(.*)*`), "page not found" message + link back to `/`.
      Distinct from the per-screen "error (retry)" states, which cover API
      call failures rather than a nonexistent route. No header/nav (same as
      `/login`).

- [x] 15. **Documentation (README)** - required deliverable per `brief.md`
      ("Documentation claire") and `todo.md` ("Qualité"): general README
      covering setup, running locally, and the stack. Per-feature/fix
      documentation is already produced by `/complete` archiving each item
      under `blueprint/history/`, so this item is the general README itself
      — written once the feature set above is stable enough to describe
      accurately.

- [x] 16. **Accessibility fixes** - `blueprint/specs/post-release-improvements.md`
      step 1. `<html lang="">` → `lang="en"`; wrap `<RouterView />` in a
      `<main>` landmark; promote each page's main title from `<h2>` to
      `<h1>`; `aria-label` on filter fields and the "Explore system symbol"
      field; `TypewriterText` exposes full text in an `sr-only` span
      alongside the animated `aria-hidden` one; verify gauges expose a
      `progressbar` role with accessible name; keyboard navigation and
      focus order check; Lighthouse/axe audit before and after, score
      recorded.

- [x] 17. **Prettier in CI, `--fix` local-only** - `blueprint/specs/post-release-improvements.md`
      step 2 (closes F-05). Split `lint` into read-only `lint:oxlint` /
      `lint:eslint` plus a separate `lint:fix`; add `format:check`; format
      the existing 16 unformatted files in their own commit; add a
      `format` CI job so a format failure shows separately from lint;
      update the README scripts table and CI paragraph.

- [x] 18. **Remove AI Blueprint tooling from the repo, rewrite README** -
      `blueprint/specs/post-release-improvements.md` step 3. Untrack
      (not delete) `.agents/`, `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`,
      `blueprint/context/findings.md`; decide which remaining
      `blueprint/` files are generated vs. real documentation to keep;
      rewrite the README's AI-workflow section to stay honest without
      referencing removed tooling/commands, add Architecture, Decisions,
      and Tests sections, and make the PrimeVue license key explicitly
      optional. Verify with a fresh clone that `npm ci`/`dev`/`build`
      still work without `.claude/`/`.agents/`.

- [x] 19. **Lazy-load routes** - `blueprint/specs/post-release-improvements.md`
      step 4 (closes F-04, also breaks the router↔http import cycle).
      Convert every static view import in `src/router/index.ts` to
      `component: () => import(...)`; confirm the single 800 kB chunk
      splits into per-route chunks and the build's size warning clears;
      re-run `http.router.test.ts` and a manual pass over every route.

- [x] 20. **Typed `ApiError` + `QueryClient` configuration** -
      `blueprint/specs/post-release-improvements.md` step 5 (closes
      F-01, F-03, F-08). New `ApiError` class with a `kind` discriminant
      (`auth`/`not-found`/`rate-limit`/`client`/`server`/`network`/
      `invalid-response`); `http.ts` maps fetch/status/JSON/Zod failures
      onto it and drops its direct coupling to the router and token
      store; new `plugins/vue-query.ts` with `shouldRetry`, backoff
      `retryDelay`, and a `QueryCache` `onError` that logs out and
      redirects on `auth`; `getErrorMessage(error, fallback)` for
      per-kind UI text; `LoginView` uses it instead of one hardcoded
      message.

- [x] 21. **Query `staleTime`, cache purge on logout, reactive query keys** -
      `blueprint/specs/post-release-improvements.md` step 6. Named
      `staleTime` constants per resource; query-key factories used
      instead of duplicated key arrays; detail views derive their route
      param as a `computed` so the query key reacts to navigating between
      two instances of the same route; `keepPreviousData` on paginated
      queries; a shared `logout(queryClient)` that cancels in-flight
      queries, clears the cache, then clears the token store, called from
      the header, the 401 handler, and on login; remove the
      `enabled: !!system.value` cascade on the waypoints query.

- [x] 22. **Extract duplicated components, reuse `DataTable` everywhere** -
      `blueprint/specs/post-release-improvements.md` step 7. Extract
      `QueryErrorBanner`, `SkeletonBlock`, `FilterInput`,
      `ShipStatusBadge`, `formatEta`, `Pill`, `DetailField`, `InfoPanel`,
      `BackLink`, and `PageHeader`; extend `DataTable` to support
      optional pagination, a custom item label, and a compact/no-filter
      mode; migrate `SystemDetailView` and `MarketView` onto it and
      decide `DashboardView`'s approach; add the missing text-size and
      letter-spacing design tokens to `main.css` and replace the
      arbitrary Tailwind values they replace.

- [ ] 23. **Router: `meta.requiresAuth` guard** - `blueprint/specs/post-release-improvements.md`
      point A. Replace the 7 repeated `beforeEnter` guards with a single
      `router.beforeEach` driven by route meta, preserving the
      `/login?redirect=…` destination. *Independent of the numbered
      steps above — not a priority.*

- [ ] 24. **Zod schema robustness for API enums** - `blueprint/specs/post-release-improvements.md`
      point B. Loosen display-only enum fields (`ship.nav.status`,
      `supply`, `activity`, waypoint/system `type`, ship `role`) so an
      unknown value from the API degrades gracefully instead of failing
      `safeParse()` for the whole list; keep strict validation only where
      a field drives logic; also fix the `MarketView` O(n·m) `find`-in-
      `map` by indexing trade goods into a `Map`. *Independent of the
      numbered steps above — not a priority.*

- [ ] 25. **Animation cleanup** - `blueprint/specs/post-release-improvements.md`
      point C. Move `useCountUp` from a `setTimeout`/`Date.now()` loop to
      `requestAnimationFrame` (matching `useGaugeReveal`), update its
      tests, and limit `CountUpNumber` so it doesn't run 20 simultaneous
      timers on the systems table. *Independent of the numbered steps
      above — not a priority.*

- [ ] 26. **Clarify filter/sort scope in the UI** - `blueprint/specs/post-release-improvements.md`
      point D. The filter and sort intentionally only apply to the
      currently loaded page, not the full dataset (decided 2026-09-17);
      adjust the placeholder text or add a short note so this doesn't
      read as a global search. *Independent of the numbered steps above
      — not a priority.*

- [ ] 27. **v2 scope candidates** - `blueprint/specs/post-release-improvements.md`
      point E. Auto-refresh (`refetchInterval` while a ship is
      `IN_TRANSIT`, ETA/cooldown countdowns); a waypoint detail page
      (traits, orbitals, faction, market); a markets index (today a
      market is only reachable via a waypoint badge); the first mutation
      (`orbit`/`dock` via `useMutation` with cache invalidation), noting
      the MVP was deliberately kept read-only (decided 2026-09-18).
      *Independent of the numbered steps above — not a priority, deferred
      to v2.*

## Out of scope for this build plan (v2+)

See `project-plan.md` section 3 for the full list and rationale: real-time
notifications, market buy/sell, ship navigation/piloting, faction
management, contracts/shipyard purchases, mobile-optimized responsive design.
