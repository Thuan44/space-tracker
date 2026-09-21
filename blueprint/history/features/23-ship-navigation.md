# Feature: Ship navigation

**From build-plan:** feature 23
**Build attempt:** 1
**Branch:** feature/ship-navigation
**Status:** verified

## Goal

Enable players to control their ships through the SpaceTraders API: orbit, dock, navigate to waypoints, and refuel. Add real-time polling to show live status updates (position, ETA, fuel) across Fleet Detail, Fleet List, and Dashboard views when ships are in transit.

This feature activates the core gameplay loop: navigate ships to markets to prepare for future trading operations. The MVP was deliberately kept read-only to meet the 1-week delivery window; v2 now adds the first write operations.

## In scope

**HTTP mutations foundation:**
- Extend `src/shared/api/http.ts` with a new `mutate<T>(url, schema, options)` function supporting POST/PATCH/PUT requests
- Add `MutateOptions` interface with `method` and `body` fields
- Include `Content-Type: application/json` header and `JSON.stringify(body)`
- Reuse all existing `ApiError` infrastructure (kinds, status codes, retry logic)

**Ship navigation API layer:**
- New file `src/features/fleet/api/navigation.schema.ts` with three separate response schemas:
  - `shipNavActionResponseSchema` (orbit/dock endpoints) → captures only `nav` object
  - `navigateResponseSchema` (navigate endpoint) → captures `nav` + `fuel`
  - `refuelResponseSchema` (refuel endpoint) → captures `agent` (updated credits) + `fuel` + `transaction`
  - Reuse existing `nav` and `fuel` schemas from `ship.schema.ts` rather than duplicating
- New file `src/features/fleet/api/navigation.ts` with four functions:
  - `orbitShip(shipSymbol)` → POST `/my/ships/{shipSymbol}/orbit`
  - `dockShip(shipSymbol)` → POST `/my/ships/{shipSymbol}/dock`
  - `navigateShip(shipSymbol, waypointSymbol)` → POST `/my/ships/{shipSymbol}/navigate` with body `{waypointSymbol}`
  - `refuelShip(shipSymbol)` → POST `/my/ships/{shipSymbol}/refuel`

**TanStack Query mutations:**
- New composable `src/features/fleet/composables/useShipNavigation.ts` with four `useMutation` calls
- Cache invalidation on success:
  - orbit/dock/navigate: invalidate `shipKeys.detail()` and `shipKeys.preview()`
  - refuel: also invalidate `agentKeys.detail()` (credits are deducted)
- Return mutation objects with `mutate`, `isPending`, `isError` for UI binding

**Real-time polling:**
- Add conditional `refetchInterval` to existing ship queries:
  - `FleetDetailView`: poll every 10s when ship status is `IN_TRANSIT`, otherwise `false`
  - `FleetView`: poll every 10s when `.some(ship => ship.nav.status === 'IN_TRANSIT')`, otherwise `false`
  - `DashboardView`: same logic as FleetView for the fleet preview
- Uses TanStack Query's built-in polling (auto-pauses on hidden tab, stops when status changes)
- No UI changes beyond the `refetchInterval` option — these views already display status/ETA

**FleetDetailView UI:**
- Add navigation section under existing position/ETA/fuel display
- Status-conditional action buttons:
  - `DOCKED`: show orbit button + refuel button (refuel only if `fuel.current < fuel.capacity`)
  - `IN_ORBIT`: show dock button + navigate button
  - `IN_TRANSIT`: show status message with ETA, no action buttons
- Waypoint selector dropdown (PrimeVue Select, unstyled + Tailwind):
  - Fetch current system's waypoints via existing `getWaypoints` API
  - Filter out ship's current position
  - Display `MARKETPLACE` badge in dropdown options (reuse existing `PillBadge`)
- Navigate button with loading state
- Wire mutations with `useShipNavigation` composable
- Disable all buttons during `isPending`
- Error handling: update `getErrorMessage()` helper with generic client error message for 400 responses

**Error messages:**
- Update `src/shared/api/error-message.ts` (or equivalent) with a `'client'` kind message: "Action not allowed. Check ship status and try again."
- Covers fuel insufficient, cooldown active, invalid waypoint, and other 4xx API errors

## Out of scope

- Toast notifications (moved to feature #24)
- Arrival detection via `watch` (moved to feature #24)
- Market buy/sell operations (future v2+ feature)
- Ship navigation to other systems (requires jump drive, out of MVP scope)
- Auto-refresh/countdown timers for ETA (feature #24 covers this via polling)
- Browser tests (no Browser tests command configured yet, manual e2e only)

## Build loop

Per `workflow.stepReview: "every"` and `workflow.checkpointCommits: "enabled"` in config: pause for review after each step below, create optional checkpoint commits after approved steps, and create the final feature commit via `/complete`.

## Build steps

- [x] 1. **HTTP mutations foundation** — Extend `src/shared/api/http.ts` with `mutate<T>()` function and `MutateOptions` interface. Add `Content-Type: application/json` header, serialize body with `JSON.stringify`, reuse existing `ApiError` infrastructure. **Done when:** `mutate()` function exists and can POST with a body, type-check passes. **Tests:** Add `http.test.ts` cases for POST with body, verify header injection.

- [x] 2. **Ship navigation schemas** — Create `src/features/fleet/api/navigation.schema.ts` with `shipNavActionResponseSchema`, `navigateResponseSchema`, and `refuelResponseSchema`. Reuse `nav` and `fuel` schemas from `ship.schema.ts`. Export TypeScript types via `z.infer`. **Done when:** Three schemas defined, type-check passes. **Tests:** Add `navigation.schema.test.ts` with valid/invalid cases for each schema via `safeParse()`.

- [x] 3. **Ship navigation API functions** — Create `src/features/fleet/api/navigation.ts` with `orbitShip`, `dockShip`, `navigateShip`, `refuelShip`. All use `mutate()` from step 1. **Done when:** Four API functions exist, type-check passes. **Tests:** Add `navigation.test.ts` mocking `mutate()` and verifying correct URL/method/body for each function.

- [x] 4. **Ship navigation mutations composable** — Create `src/features/fleet/composables/useShipNavigation.ts` with four `useMutation` calls. Invalidate `shipKeys.detail()` and `shipKeys.preview()` on success for orbit/dock/navigate; also invalidate `agentKeys.detail()` for refuel. **Done when:** Composable exports four mutation objects, type-check passes. **Tests:** Add `useShipNavigation.test.ts` verifying cache invalidation logic.

- [x] 5. **Real-time polling** — Add conditional `refetchInterval` to `FleetDetailView`, `FleetView`, and `DashboardView` ship queries. Poll every 10s when any ship is `IN_TRANSIT`, otherwise `false`. **Done when:** All three views poll conditionally, type-check passes, manual verification shows polling starts/stops correctly. **Tests:** No new tests (query option only, behavior verified manually).

- [x] 6. **FleetDetailView navigation UI** — Add navigation section to `FleetDetailView.vue` with status-conditional buttons (orbit/dock/refuel/navigate), waypoint selector dropdown (fetch via `getWaypoints`, filter current position, show `MARKETPLACE` badge), loading states, disabled during `isPending`. Wire to `useShipNavigation` mutations. **Done when:** UI renders correctly for all three ship statuses, buttons trigger mutations, type-check passes, manual e2e test per verification section below. **Tests:** No new tests (component tests deferred per `specs-techniques.md`).

- [x] 7. **Error message for client errors** — Update `getErrorMessage()` helper (or equivalent) with a `'client'` kind handler: "Action not allowed. Check ship status and try again." **Done when:** Client errors show user-friendly message, type-check passes, manual verification with invalid action (e.g., navigate while docked). **Tests:** No new tests (manual verification sufficient).

## Files / areas

**New files:**
- `src/shared/api/http.ts` (extend with `mutate()`)
- `src/features/fleet/api/navigation.schema.ts` (new)
- `src/features/fleet/api/navigation.ts` (new)
- `src/features/fleet/composables/useShipNavigation.ts` (new)
- `src/shared/api/http.test.ts` (extend)
- `src/features/fleet/api/navigation.schema.test.ts` (new)
- `src/features/fleet/api/navigation.test.ts` (new)
- `src/features/fleet/composables/useShipNavigation.test.ts` (new)

**Modified files:**
- `src/features/fleet/views/FleetDetailView.vue` (add navigation UI)
- `src/features/fleet/views/FleetView.vue` (add `refetchInterval`)
- `src/features/dashboard/views/DashboardView.vue` (add `refetchInterval`)
- `src/shared/api/error-message.ts` or equivalent (add client error message)

## Data / contracts

**API contracts** (SpaceTraders API):
- POST `/my/ships/{shipSymbol}/orbit` → `{data: {nav: {...}}}`
- POST `/my/ships/{shipSymbol}/dock` → `{data: {nav: {...}}}`
- POST `/my/ships/{shipSymbol}/navigate` with body `{waypointSymbol: string}` → `{data: {nav: {...}, fuel: {...}}}`
- POST `/my/ships/{shipSymbol}/refuel` → `{data: {agent: {...}, fuel: {...}, transaction: {...}}}`

**Client state:**
- TanStack Query cache: invalidated on mutation success to trigger refetch
- No new Pinia stores (ship navigation is server state, not client state)

**Error responses:**
- 400 (client error): insufficient fuel, cooldown active, invalid waypoint, ship not in correct status
- 401 (auth error): handled by existing QueryClient `onError` (logout + redirect)
- 429 (rate-limit): handled by existing retry logic
- 5xx (server error): handled by existing retry logic

## Testing

Per `workflow.verification.logicTests: "when-configured"` and test command `npm run test:unit` in `AGENTS.md`:

**Unit tests (Vitest):**
- `src/shared/api/http.test.ts`: `mutate()` function with POST/body, header injection
- `src/features/fleet/api/navigation.schema.test.ts`: valid/invalid cases for all three schemas via `safeParse()`
- `src/features/fleet/api/navigation.test.ts`: API functions with mocked `mutate()`, verify URL/method/body
- `src/features/fleet/composables/useShipNavigation.test.ts`: mutations + cache invalidation logic

**Manual e2e test** (no Browser tests command configured):
1. Start dev server: `npm run dev`
2. Login and navigate to Fleet Detail view (`/fleet/:shipSymbol`)
3. Test orbit action (from `DOCKED` status)
4. Test navigate action (from `IN_ORBIT` status, select waypoint from dropdown)
5. Verify polling: status + ETA update every 10s while `IN_TRANSIT`
6. Navigate to Fleet List (`/fleet`) — verify polling continues, table updates
7. Navigate to Dashboard (`/`) — verify polling continues, preview updates
8. Wait for arrival or dock manually
9. Test dock action (from `IN_ORBIT` status)
10. Test refuel action (from `DOCKED` status, only if fuel < capacity)
11. Test error case: try navigate without selecting waypoint (should disable button or show error)

**Verify command:**
- Run `npm run type-check && npm run test:unit && npm run lint && npm run build` before review and before `/complete`

## Notes for the AI

- **Reuse existing patterns**: Button styles from `LoginView.vue`, badge component from `SystemDetailView.vue`, dropdown from existing PrimeVue Select usage
- **PrimeVue Select**: Use unstyled mode + Tailwind classes matching design system (`identite-visuelle.md`), same approach as `DataTable`
- **Waypoints API**: Use existing `getWaypoints(systemSymbol, options)` from `src/features/systems/api/waypoint.ts` to populate dropdown
- **System symbol extraction**: Use existing `systemSymbolFromWaypoint(waypointSymbol)` helper from `@/shared/lib/spacetraders`
- **Query keys**: Use existing `shipKeys` factory from `src/features/fleet/api/ship.ts` and `agentKeys` from `src/features/auth/api/agent.ts`
- **Error handling**: `ApiError` class and `getErrorMessage()` helper already exist, extend them rather than creating new error types
- **Polling interval**: 10 seconds is chosen because SpaceTraders API doesn't expose WebSocket/SSE; transits take multiple minutes, so 10s is responsive without overloading the API
- **Toast notifications are out of scope**: Feature #24 adds PrimeVue Toast, mutation feedback, and arrival detection via `watch`. This feature only adds the mutations and polling infrastructure.
- **Composable location**: Per `coding-standards.md`, composables go in `src/composables/` by default, but domain-specific composables like `useShipNavigation` are colocated with the feature (`src/features/fleet/composables/`)
- **No backwards compatibility needed**: This is new functionality, not a refactor, so no migration or deprecation handling required

## Open questions

None — all product decisions are resolved. The technical plan in `blueprint/specs/plan-navigation-notifications.md` provides complete implementation guidance.

<!-- blueprint:completion {"schemaVersion":1,"specBytes":12568,"specSha256":"6baa672c30ab9ada73b8b726f0b50ce19fb9b121db634740fed2e2e54f7019ae","branch":"refs/heads/feature/navigation","head":"2783fa41d291f5be37208c384a758ebfcc1b243a","baseRef":"refs/heads/main","baseCommit":"8ca9b6e59cdd58ef5c9e2fc78ca46cab69626724","sourceTree":"4d27b8d0150f8b832f02c64c867883c4014e7583","absentOptional":[]} -->

## Findings

### 23/F-01 [P3] closed - Malformed JSON on a 2xx response bypasses the documented error-log/throw contract

**File:** src/shared/api/http.ts:31
**Found:** 2026-09-16 by /audit (scope: current; lens: security, quality)
**Why it matters:** The spec states any failed parse should `console.error` the detail then throw `new Error('Request failed')`. `fetchJson` calls `response.json()` directly on the success path with no `try/catch`. If a 2xx response body is not valid JSON, or the `fetch()` call itself rejects (network failure), the promise rejects with a raw `SyntaxError`/`TypeError` instead of the documented generic error, and nothing is logged. Callers built on top of this (TanStack Query, per the project overview) still surface an error state regardless of the rejection's shape, so no reachable user-facing defect exists today; this is a narrow divergence from the documented contract, not a confirmed break.
**Suggested fix:** Wrap `response.json()` (and optionally the `fetch()` call) in a try/catch that logs and rethrows the same `Error('Request failed')`, mirroring the existing Zod-parse branch. Low priority since SpaceTraders' documented API always returns valid JSON on a 2xx response.
**Resolution:** Re-examined during the ship-navigation (feature 23) independent review, which required reading `src/shared/api/http.ts` in full. Both the current `HEAD` (f44ec07) and its merge base (8ca9b6e) already wrap `response.json()` in a `try/catch` that throws `new ApiError('invalid-response', ...)` (`http.ts:70-74`); the network `fetch()` call is likewise wrapped (`http.ts:47-56`). The gap this finding described no longer exists in the file, fixed by an earlier, untracked feature. Confirmed by direct inspection, not by a new test.

### 23/F-08 [P3] invalid - The 401 clear-decision and the credential-selection use different falsiness rules, so an empty-string override wipes an untested token

**File:** src/shared/api/http.ts:22
**Found:** 2026-09-16 by /audit (scope: current; lens: security, quality)
**Why it matters:** `fetchJson` picks the credential with `options?.token ?? tokenStore.token` (nullish), but decides whether the store's token was the one that failed with `!options?.token` (falsy). The two rules agree for every value except `''`. With `options.token === ''` the request carries no `Authorization` header at all, so the store's token is never sent, yet a 401 still takes the `!options?.token` branch and calls `tokenStore.logout()`, destroying a credential the server never rejected. Verified against the real module: the stubbed `fetch` received `{ headers: {} }` and `tokenStore.token` was `null` afterwards. Not reachable today - `LoginView.vue:23` is the only caller that passes an override, and the input carries `required`, so the browser blocks an empty submit before `handleSubmit` runs. It is a latent trap for the next caller rather than a live defect, which is why it is P3 and not higher.
**Suggested fix:** Decide from the credential that was actually used, not from the option's truthiness: hoist the existing `const token = options?.token ?? tokenStore.token` decision into a single flag (for example `const usedStoreToken = options?.token === undefined`) and branch the `logout()` on that. No new machinery, one expression changed; no current requirement is lost.
**Resolution:** Re-examined during the ship-navigation (feature 23) independent review, which required reading `src/shared/api/http.ts` in full. The `!options?.token` decision this finding describes is gone: `fetchJson` (http.ts:34-56) no longer calls `tokenStore.logout()` at all, on a 401 or otherwise. An earlier, untracked feature (the `fc6833e` "add per-resource staleTime, cache purge on logout, and reactive query keys" change, already on `main` at this feature's base commit) relocated 401 handling to `src/plugins/vue-query.ts:38-44`, an unconditional `QueryCache.onError` that logs out on any `kind === 'auth'` error regardless of which token was used. The specific falsy/nullish mismatch this finding pointed at no longer exists in the code. See finding F-11 for a related but different gap introduced by this feature's mutations.

### 23/F-11 [P1] closed - Ship mutations that fail with a 401 bypass the app's only auth-error handler, leaving an invalid token active

**File:** src/plugins/vue-query.ts:30-45
**Found:** 2026-09-21 by /audit independent (scope: current; lens: security, quality)
**Why it matters:** The `queryClient` in `vue-query.ts` registers auth handling only on `queryCache.onError` (`if (error instanceof ApiError && error.kind === 'auth') { logout(queryClient).then(() => router.push('/login')) }`); no `mutationCache` is configured. This feature adds the app's first `useMutation` calls (`orbit`, `dock`, `navigate`, `refuel` in `src/features/fleet/composables/useShipNavigation.ts`), all built on `mutate()` in `shared/api/http.ts`, which throws the same `ApiError('auth', 401, ...)` as any query on a 401 response (`http.ts:14-19`). When one of these mutations gets a 401 (a real, documented SpaceTraders behavior: agent tokens are invalidated on a game-world reset), the error only reaches `FleetDetailView`'s `navigationError` banner ("Invalid token. Please check and try again.") - the centralized logout-and-redirect the project overview and every read path relies on never fires, because mutation errors never reach `QueryCache`. The stale token stays in the Pinia store and keeps being sent on every subsequent request until an unrelated query happens to 401 and trips the query-level handler. No test exercises a 401 through a mutation; `useShipNavigation.test.ts` only asserts the success/invalidation path.
**Suggested fix:** Add a `mutationCache: new MutationCache({ onError(error) { if (error instanceof ApiError && error.kind === 'auth') logout(queryClient).then(() => router.push('/login')) } })` alongside the existing `queryCache` in `vue-query.ts`, reusing the same `logout()` helper and `ApiError` check already written for queries. No new machinery, just extending the existing pattern to the new mutation surface.
**Resolution:** Applied the suggested fix: extracted the shared `handleAuthError` function and wired it to both `queryCache.onError` and a new `mutationCache: new MutationCache({ onError: handleAuthError })` in `vue-query.ts`. Added a regression test in `vue-query.test.ts` ("logs out and redirects to /login when a real useMutation hits a 401") mirroring the existing query-level test, driving a real `mutate()` call through the real `queryClient`/router. Verified with `npm run type-check`, `npm run test:unit` (149/149 passing), and `npm run lint`.
Re-verified fresh during the feature-23 re-review (independent, target `2783fa4`): read `src/plugins/vue-query.ts` in full - `handleAuthError` is a single function shared by both `queryCache.onError` and `mutationCache.onError`, so any `ApiError('auth', ...)` from a query or a mutation now routes through the same `logout(queryClient).then(() => router.push('/login'))`. The regression test in `src/plugins/vue-query.test.ts` drives a real `useMutation` over the real `mutate()` against a stubbed `fetch` returning 401, and asserts both the router lands on `/login` and the token store is cleared. `npm run test:unit -- --run` reproduces 149/149 passing. The original gap (mutation 401s never reaching a logout handler) is gone and the fix introduces no new issue. Closed.

### 23/F-12 [P2] closed - The waypoint navigate dropdown silently caps at the system's first 20 waypoints, with no way to reach the rest

**File:** src/features/fleet/views/FleetDetailView.vue:62-71
**Found:** 2026-09-21 by /audit independent (scope: current; lens: quality)
**Why it matters:** `waypointsPage = ref(1)` is passed into `getWaypoints(..., { page: waypointsPage.value, limit: 20 })` and into the query key, but nothing in the component ever changes `waypointsPage`. `waypointOptions` (line 74) maps only `waypointsData.value.data`, i.e. page 1. A system with more than 20 waypoints (common in SpaceTraders, which is the entire point of the navigate feature) has waypoints beyond the first page permanently absent from the dropdown, with no page indicator, "load more," or search to reach them - the player cannot navigate there through this UI at all. The `waypointsPage` ref reads like unfinished pagination wiring rather than an intentional limit.
**Suggested fix:** Either wire a "load more" control that increments `waypointsPage` and merges pages into `waypointOptions`, or use PrimeVue `Select`'s built-in filter with a debounced server-side symbol search if the API supports it. If a 20-waypoint cap is an accepted MVP limitation, drop the unused `waypointsPage` ref and document the limit instead of leaving dead pagination scaffolding.
**Resolution:** Added `getAllWaypoints(systemSymbol)` in `waypoint.ts`, which fetches page 1, computes the remaining page count from `meta.total`/`meta.limit`, and fetches the rest in parallel, flattening into one array. `FleetDetailView.vue`'s dropdown query now uses this (via a new `waypointKeys.all()` key) instead of a single fixed page, so every waypoint in the system is available for navigation. Added two tests in `waypoint.test.ts` covering the single-page and multi-page cases. Verified with `npm run type-check`, `npm run test:unit` (149/149 passing), `npm run lint`, and `npm run build`.
Re-verified fresh during the feature-23 re-review: read `src/features/systems/api/waypoint.ts:11-22` in full - `getAllWaypoints` fetches page 1, derives `pageCount` from `meta.total`/`meta.limit`, short-circuits when there is only one page, and otherwise fetches the remaining pages in parallel and flattens them, returning every waypoint rather than only the first 20. `FleetDetailView.vue:65-70` now queries `waypointKeys.all(waypointsSystemSymbol)` with `getAllWaypoints`, and `waypointOptions` maps over the full result. The two new tests in `waypoint.test.ts` (single-page and forced-multi-page-via-small-limit) both assert the correct fetch count and flattened symbol order, and pass under `npm run test:unit -- --run`. The original 20-item cap is gone and no new defect was introduced (unverified performance note: a system with a very large waypoint count would fire one parallel `fetch` per remaining page with no concurrency limit; SpaceTraders systems in practice stay well under a scale where this matters, so this is not raised as a new finding, only noted under Remaining risk). Closed.

### 23/F-13 [P3] closed - `any` type in the waypoint option template bypasses the project's "no `any`" standard

**File:** src/features/fleet/views/FleetDetailView.vue:252
**Found:** 2026-09-21 by /audit independent (scope: current; lens: quality)
**Why it matters:** `coding-standards.md` states "No `any` types - use proper typing or `unknown`." The `#option` slot template for the waypoint `Select` writes `option.traits.some((t: any) => t.symbol === 'MARKETPLACE')`. `wp.traits` already carries a real type from the waypoint schema through `waypointOptions` (line 74-83), so the explicit `any` annotation throws away type-checking on `t.symbol` for no reason (PrimeVue's generic `Select` slot typing is the actual source of the loose `option` type, but `t` here is a plain array element that did not need to be widened). ESLint's `no-explicit-any` did not catch it because this project's ESLint config does not type-check `.vue` `<template>` expressions, so this passed `npm run lint` clean.
**Suggested fix:** Give `t` its real trait type (the same type `wp.traits` elements already have) instead of `any`, or destructure/rename so the option type is inferred instead of re-annotated. Small, localized change; no behavior changes.
**Resolution:** Replaced `(t: any)` with `(t: WaypointTrait)`, importing the type already exported from `waypoint.schema.ts`. Verified with `npm run type-check`.
Re-verified fresh during the feature-23 re-review: `FleetDetailView.vue:250` now reads `option.traits.some((t: WaypointTrait) => t.symbol === 'MARKETPLACE')`, with `WaypointTrait` imported from `@/features/systems/api/waypoint.schema` (line 12). No `any` remains in the file. `npm run type-check` and `npm run lint` both pass clean. Closed.

### 23/F-14 [P3] accepted - Ship-list cache invalidation uses a hardcoded `['ships']` key literal instead of the existing `shipKeys` factory

**File:** src/features/fleet/composables/useShipNavigation.ts:17,25,32,40
**Found:** 2026-09-21 by /audit independent (scope: current; lens: quality)
**Why it matters:** Every mutation's `onSuccess` calls `queryClient.invalidateQueries({ queryKey: ['ships'] })` (with a comment explaining it's meant to catch every key with that prefix) instead of importing and using `shipKeys.preview()` (`['ships', 'preview']`, from `src/features/fleet/api/ship.ts:15`) as the spec's build step 4 calls for. It happens to work today because TanStack Query invalidates by key prefix, so the raw `'ships'` literal also matches `shipKeys.list(page)` and `shipKeys.preview()` - but it is a second, un-derived source of truth for the ship query key shape. If `shipKeys` is ever renamed or namespaced (for example nested under a versioned key), this literal silently stops matching and nothing points back at it.
**Suggested fix:** Replace `queryKey: ['ships']` with `queryKey: shipKeys.all` (add an `all: () => ['ships'] as const` entry to the `shipKeys` factory if one does not already exist) or, if only `detail()` and `preview()` need invalidating per the spec, call both explicitly. No behavior change intended either way.
**Resolution:** Accepted as-is, by the user's explicit decision: the `['ships']` literal is intentional, to invalidate every query key sharing that prefix (both `shipKeys.list(page)` and `shipKeys.preview()`) in one call. Not changing it.

## Independent review

**Status:** passed
**Target commit:** 2783fa41d291f5be37208c384a758ebfcc1b243a
**Base commit:** 8ca9b6e59cdd58ef5c9e2fc78ca46cab69626724
**Base ref:** main
**Spec hash:** 6baa672c30ab9ada73b8b726f0b50ce19fb9b121db634740fed2e2e54f7019ae
**Spec snapshot:** blueprint/.state/review-specs/2783fa41d291f5be37208c384a758ebfcc1b243a-6baa672c30ab9ada73b8b726f0b50ce19fb9b121db634740fed2e2e54f7019ae.md
**Prepared by:** claude
**Builder model:** claude-sonnet-5
**Requested reviewer:** claude
**Requested model:** claude-sonnet-5
**Requested execution:** automatic
**Requested at:** 2026-09-21T09:36:14Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-sonnet-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-21T09:40:38Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npm run type-check`: pass
- `npm run test:unit -- --run`: pass (149/149 tests, 31 files)
- `npm run lint`: pass (oxlint, then eslint)
- `npm run build`: pass

## Evidence

- Full `8ca9b6e5..2783fa4` delta reviewed (24 files, +1116/-83): `src/shared/api/http.ts` (`mutate()`), `src/features/fleet/api/navigation.ts`/`navigation.schema.ts`, `src/features/fleet/composables/useShipNavigation.ts`, `src/plugins/vue-query.ts`, `src/features/systems/api/waypoint.ts`, `src/features/fleet/views/FleetDetailView.vue`, `src/features/fleet/views/FleetView.vue`, `src/features/dashboard/views/DashboardView.vue`, `src/shared/lib/error-message.ts`, `src/shared/lib/with-min-duration.ts`, `src/shared/ui/ActionButton.vue`, and all associated test files, read against `blueprint/context/current-feature.md` (feature 23, status `verified`) and `coding-standards.md`.
- F-11 re-verified: `src/plugins/vue-query.ts` now registers one `handleAuthError` on both `queryCache.onError` and a new `mutationCache.onError`; `src/plugins/vue-query.test.ts` drives a real `useMutation`/`mutate()` through a stubbed 401 `fetch` and asserts logout + redirect to `/login`.
- F-12 re-verified: `src/features/systems/api/waypoint.ts:11-22` (`getAllWaypoints`) fetches page 1, derives remaining page count from `meta.total`/`meta.limit`, fetches the rest in parallel, and flattens; `FleetDetailView.vue:65-70` wires this via a new `waypointKeys.all()` query key so the navigate dropdown is no longer capped at 20 waypoints. Two new tests in `waypoint.test.ts` cover single- and multi-page cases.
- F-13 re-verified: `FleetDetailView.vue:250` uses `(t: WaypointTrait)` instead of `any`, with the type imported from `waypoint.schema.ts`.
- F-14 left untouched: still `accepted` by the user's explicit prior decision; out of scope for this pass.

## Findings

- F-11, F-12, F-13 moved from `fixed` to `closed` (re-examined against the new code, original defects confirmed gone, no new defect introduced by the repairs)
- No new P0/P1 findings from a fresh pass across quality, security, performance, and tests
- Minor observation (not filed as a new finding): `getAllWaypoints` issues one parallel `fetch` per remaining waypoint page with no concurrency cap; proportional for realistic SpaceTraders system sizes, noted under Remaining risk rather than raised as a defect
- Minor observation (not filed as a new finding): commits `8375056` (button-transition polish, `withMinDuration`) and `08228d6` (no-fuel warning banner) add small UI details not explicitly itemized in the approved spec's build steps or the linked technical plan, but they stay within the same in-scope navigation UI and do not touch anything on the spec's explicit out-of-scope list (toasts, arrival-`watch`, market ops, cross-system nav, ETA countdown, browser tests)

## Remaining risk

- Manual e2e test plan in the spec's Testing section (steps 1-11: live orbit/dock/navigate/refuel against the running app, polling observed across Fleet Detail/List/Dashboard) was not independently browser-verified; no browser automation tool is available in this review environment, and Check was not required for this request. This mirrors the same disclosed limitation as the prior independent review.
- `getAllWaypoints`'s unbounded parallel page-fetch (see Findings) is a proportionality note, not a confirmed defect, since no SpaceTraders system in practice approaches a page count where this would matter.
- The two small UI-polish commits noted above were not present in the previous review's checkpoint and were only surfaced by re-reviewing the complete branch delta as required; they read as reasonable in-scope refinements, not scope creep, but are called out for the record.
