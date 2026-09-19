# Feature: Lazy-load routes

**From build-plan:** feature 19
**Build attempt:** 1
**Branch:** feature/lazy-load-routes
**Status:** verified

## Goal

`src/router/index.ts` statically imports every view, so the whole app ships as
one 800.47 kB (205.91 kB gzip) chunk and the production build warns about it.
That static import chain is also what closes the `router` ↔ `http.ts` module
cycle flagged as F-04 (`router/index.ts` → `LoginView.vue` → `agent.ts` →
`http.ts` → `@/router`) — benign today only because the cycle happens to
resolve at call time, not module-init time. Converting each route's
`component:` to a dynamic `() => import(...)` splits the bundle per route and
breaks that cycle, with no user-visible behavior change.

## In scope

- `src/router/index.ts`: replace all 8 static view imports (Login, Dashboard,
  Systems, SystemDetail, Fleet, FleetDetail, Market, NotFound) with
  `component: () => import('...View.vue')`.
- Confirm the production build actually splits into per-route chunks and the
  "chunks larger than 500 kB" warning clears; compare the new entry-chunk size
  against the recorded baseline (800.47 kB / 205.91 kB gzip, one chunk).
- If PrimeVue (`DataTable`/`Paginator`, used by Systems and Fleet) ends up
  duplicated across more than one per-route chunk, add an explicit shared
  vendor chunk in `vite.config.ts` so it's extracted once.
- Keep `src/shared/api/http.router.test.ts` green against lazily-loaded route
  components, adjusting its waits if the existing assertions need it.
- Close F-04 in the local `blueprint/context/findings.md` (gitignored per
  build-plan feature 18 — not part of the feature's git diff).

## Out of scope

- `ApiError`/`QueryClient` config (build-plan #20), `staleTime`/cache-purge/
  reactive query keys (#21), and shared-component extraction (#22) — later,
  independent build-plan items.
- Any loading indicator for the async chunk fetch: the plan is explicit that
  the router simply waits for the chunk before showing the view, matching Vue
  Router's default async-component behavior.
- Consolidating the 7 repeated `beforeEnter` guards into a single
  `meta.requiresAuth` guard (#23) — a separate, independent, low-priority item.
  This feature keeps every existing `beforeEnter: redirectIfAuthenticated` /
  `beforeEnter: requireAuth` exactly as-is.

## Build loop

Build one small step at a time. `workflow.stepReview` is `every`, so pause for
review after each step below. `workflow.checkpointCommits` is `enabled`, so
offer a checkpoint commit after each approved step. `/complete` makes the
final feature commit.

## Build steps

- [x] **Step 1 - Lazy-load the 8 route components** - in
      `src/router/index.ts`, delete the 8 static
      `import XView from '...View.vue'` lines and change each route's
      `component: XView` to `component: () => import('...View.vue')`,
      preserving every path, name, and `beforeEnter` guard unchanged. *Done
      when:* `src/router/index.ts` has no remaining static view import, all 8
      routes use a dynamic `import()`, `npm run type-check` passes, and
      `npm run test:unit` passes (including `http.router.test.ts`, adjusting
      its `vi.waitFor` usage only if the existing assertion turns out to need
      it against an async component).

- [x] **Step 2 - Verify and tune the production bundle split** - run
      `npm run build-only`; record the new entry-chunk size and per-route
      chunk sizes against baseline (800.47 kB / 205.91 kB gzip, one chunk) in
      the step's commit message. Check whether PrimeVue is emitted into more
      than one route chunk; if so, add a shared vendor chunk in
      `vite.config.ts` (via `build.rolldownOptions.output`, grouping
      `vue`/`vue-router`/`pinia`/`primevue`/`@tanstack/vue-query`/`zod`) and
      rebuild to confirm it's deduplicated. Update F-04's `Resolution` field
      in `blueprint/context/findings.md` (local-only, gitignored — do not
      stage it). *Done when:* `npm run build-only` no longer warns about a
      chunk larger than 500 kB, multiple per-route chunks are present, and
      PrimeVue appears in at most one shared chunk across routes (verified,
      not assumed).

## Files / areas

- `src/router/index.ts` (primary change).
- `vite.config.ts` (only if Step 2 finds PrimeVue duplicated per-chunk).
- `blueprint/context/findings.md` (local bookkeeping only, gitignored, not
  part of the feature commit).

## Data / contracts

None. This is internal routing and build configuration only — no schema,
API, or persisted-data changes.

## Testing

- A test runner is configured, but this feature changes how components are
  loaded, not any parser/formatter/validator/id-builder logic, so the Testing
  gate's in-scope-logic rule adds no new unit test. The existing
  `http.router.test.ts` already drives the
  real router against a live 401 flow; it's integration-level (exempted from
  the "ship a test with the step" gate) but must keep passing unmodified in
  behavior, adjusted only if lazy-loading introduces a timing gap its current
  `vi.waitFor` doesn't already cover.
- Verify with: `npm run type-check`, `npm run test:unit`, `npm run build-only`
  per step above. Manual per-route browser verification (Login, Dashboard,
  Systems, System detail, Fleet, Fleet detail, Market, 404 — confirming each
  loads and the Network tab shows a chunk per navigation) is `/check`'s job,
  since no browser-test harness is configured yet; it is not an implement
  build step.

## Notes for the AI

- Don't introduce a loading spinner, suspense boundary, or any other UI for
  the async chunk fetch — the router already waits for the component before
  rendering, and the plan explicitly says not to add anything on top of that.
- Leave every `beforeEnter` guard exactly as it is; guard consolidation is a
  separate, independent build-plan item (#23), not this one.
- `findings.md` is gitignored (build-plan #18) — editing F-04's Resolution is
  local record-keeping, never staged or committed.
- Baseline for the Step 2 size comparison: 800.47 kB / 205.91 kB gzip, one
  chunk (recorded in `blueprint/specs/post-release-improvements.md`).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":6183,"specSha256":"1662c767443e92fd5ca4cb0327ea4430426cc80444a5cc9b8baf2e5a298b3c58","branch":"refs/heads/feature/lazy-load-routes","head":"b508a985a8019931d9150a3aee0dc45c73efabea","baseRef":"refs/heads/post-release-improvement","baseCommit":"b508a985a8019931d9150a3aee0dc45c73efabea","sourceTree":"8a5867b6d4e2ef6b81d24e71337e56a952b93b56","absentOptional":[]} -->
