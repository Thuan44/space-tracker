# Feature: Extract duplicated components, reuse DataTable everywhere

**From build-plan:** feature 22
**Build attempt:** 1
**Status:** verified
**Branch:** feature/extract-duplicated-components-reuse-datatable-everywhere

## Goal

`DataTable.vue` was extracted in feature 10, but `SystemDetailView` and
`MarketView` still talk to PrimeVue directly, and `DashboardView` hand-rolls
its own table. Ten small UI patterns (error banner, skeleton, filter input,
status badge, ETA formatting, pill badges, detail fields, info panels, back
links, page headers) are copy-pasted 2-8 times each. `main.css` has no text
size or letter-spacing tokens, so 13px/12px/11px text and `0.09em` tracking
appear as ~90 arbitrary Tailwind values instead of named tokens. This is a
pure internal refactor: extract the leaf components, extend `DataTable` to
cover the remaining cases, migrate every view onto the shared pieces, then
add the missing design tokens. No product behavior changes except one
explicit improvement: error banners start using the existing
`getErrorMessage(error, fallback)` helper (kind-aware text, Retry hidden for
`auth`/`not-found`) instead of a single hardcoded string with Retry always
shown.

## In scope

- New shared components: `QueryErrorBanner`, `SkeletonBlock`, `FilterInput`,
  `PillBadge`, `DetailField`, `InfoPanel`, `BackLink`, `PageHeader`
  (`src/shared/ui/`).
- New fleet-scoped pieces: `ShipStatusBadge.vue`
  (`src/features/fleet/components/`) and `formatEta(ship)`
  (`src/features/fleet/lib/eta.ts`), replacing the 3 duplicated
  `statusBadgeClasses` maps and 2 duplicated `eta()` functions.
- Extending `DataTable.vue`: optional `total`/`limit`/`page` (paginator
  hidden when absent, for the unpaginated Market table), optional
  `itemLabel` for the paginator caption, and using the new
  `QueryErrorBanner`/`SkeletonBlock`/`FilterInput` internally instead of its
  own inline markup.
- Migrating `SystemDetailView` and `MarketView` onto the shared `DataTable`.
- Migrating every touched view onto the new leaf components:
  `DashboardView`, `SystemsView`, `SystemDetailView`, `FleetView`,
  `FleetDetailView`, `MarketView`.
- Adding `--text-data`, `--text-label` (11px), `--text-label-lg` (12px), and
  `--tracking-label` tokens to `src/assets/main.css`'s `@theme`, and
  replacing every arbitrary `text-[13px]` / `text-[11px]` / `text-[12px]` /
  `tracking-[0.09em]` value in the codebase with the generated classes.
- Factoring the 4 identical `first`/`prev`/`next`/`last` paginator
  pass-through strings in `src/plugins/primevue.ts` into one constant.
- Final verification pass (type-check, lint, format:check, tests, build,
  bundle size, full manual page-by-page pass, residual-duplicate grep,
  accessibility re-check against the feature 16 baseline).

## Out of scope

- `FleetDetailView`'s cargo table stays a native `<table>` (explicitly
  named in the source checklist as not moving to `DataTable`).
- `DashboardView`'s fleet-preview table stays a native `<table>` (see
  Notes for the AI for the reasoning); only its status badge and error
  banner move to the shared components.
- Any new product feature, API call, schema, or route.
- Feature 24's Zod enum loosening (a defensive "unknown status" fallback
  class is added to `ShipStatusBadge` per the source checklist, but the
  schema itself is not touched here).
- Points A-E in `post-release-improvements.md` (router guard consolidation,
  Zod enum robustness, animation cleanup, filter/sort copy, v2 scope) —
  each is its own build-plan item (23-27).

## Build loop

Work through Build steps in order, one at a time. After each step: run the
project's type-check, lint, and test commands; fix any failure before
continuing. Stop after each step and wait for review before starting the
next (per `workflow.stepReview: every`). On approval, create a checkpoint
commit for that step (per `workflow.checkpointCommits: enabled`) before
moving on.

## Build steps

- [x] 1. Add `QueryErrorBanner.vue` (props: `error: unknown`,
      `fallbackMessage: string`, optional `heightClass`; emits `retry`;
      renders `getErrorMessage(error, fallbackMessage)`, hides the Retry
      button when the error's `ApiError` kind is `auth` or `not-found`) and
      `SkeletonBlock.vue` (prop: `heightClass: string`). Replace every
      standalone loading/error block outside `DataTable.vue` with them:
      `DashboardView` (agent block, fleet-preview block),
      `SystemDetailView` (system-header block), `MarketView` (header
      block), `FleetDetailView` (header block). Leave the blocks inside
      `DataTable.vue` itself for step 7.
      **Done when:** every migrated block renders through the shared
      components with unchanged layout, error text now varies by
      `ApiError` kind (verified in the browser via an invalid token or a
      throttled request), Retry is hidden for `auth`/`not-found`; `npm run
  type-check`, `npm run lint`, `npm run test:unit` pass.

- [x] 2. Add `FilterInput.vue` (`v-model` string, required `placeholder`
      prop reused as the input's `aria-label`). Replace the raw filter
      `<input>` in `SystemDetailView` and `MarketView` with it. (The
      filter input inside `DataTable.vue` is migrated in step 7.)
      **Done when:** both filters render and filter rows identically to
      today through the shared component; type-check/lint/tests pass.

- [x] 3. Add `ShipStatusBadge.vue` (`src/features/fleet/components/`, prop
      `status: Ship['nav']['status']`, with a fallback class for a status
      value outside the current 3-value union) and `formatEta(ship)`
      (`src/features/fleet/lib/eta.ts`, replacing the two duplicated
      `eta()` functions). Replace all 3 status-badge usages
      (`DashboardView`, `FleetView`, `FleetDetailView`) and both `eta()`
      call sites (`FleetView`, `FleetDetailView`).
      **Done when:** status badges and ETA text render identically across
      all three views through the shared implementations;
      `features/fleet/lib/eta.test.ts` covers `IN_TRANSIT` and non-transit
      ship states and passes; type-check/lint/tests pass.

- [x] 4. Add `PillBadge.vue` (props: `variant: 'info' | 'accent' | 'muted' |
  'dashed'`, optional `to` — renders a `RouterLink` when present, a
      `span` otherwise). Replace `SystemDetailView`'s waypoint trait
      badges (`traitClasses` logic) and `FleetDetailView`'s module/mount
      badges and the "Market" link pill with it.
      **Done when:** every pill-shaped badge (waypoint traits, modules,
      mounts, the Market link) renders identically through the shared
      component, including the link vs. static-span distinction;
      type-check/lint/tests pass.

- [x] 5. Add `DetailField.vue` (prop `label: string`, default slot for the
      value, so it works for both plain text and embedded content like a
      `RouterLink`+`PillBadge` pair or a `GaugeBar`), `InfoPanel.vue` (props
      `title: string`, `icon` component; default slot for content), and
      `BackLink.vue` (prop `to: string`, default slot for the label text).
      Replace `SystemDetailView`'s 4 detail fields, `FleetDetailView`'s ~8
      detail fields and 3 info panels (Crew, Cargo, Components), and the 3
      back links (`SystemDetailView`, `FleetDetailView`, `MarketView`).
      **Done when:** all migrated detail fields, panels, and back links
      render identically through the shared components; type-check/lint/
      tests pass.

- [x] 6. Add `PageHeader.vue` (props: `title: string`, optional
      `typewriter?: boolean` to wrap the title in `TypewriterText`;
      `description` and `badge` slots). Replace the `<h1>` block in
      `DashboardView` ("Agent", no description), `SystemsView` ("Systems" + description), `FleetView` ("Fleet" + description), `MarketView`
      (typewriter symbol + description + the existing "Limited market
      info" notice stays separate, below the header), `SystemDetailView`
      (typewriter symbol + conditional name subtitle via the description
      slot), and `FleetDetailView` (typewriter symbol + status badge via
      the badge slot + role subtitle via the description slot).
      **Done when:** every page title renders identically, including the
      typewriter effect on the four detail-symbol titles and the status
      badge next to the ship symbol; type-check/lint/tests pass.

- [x] 7. Extend `DataTable.vue`: make `total`, `limit`, and `page` optional
      (the `Paginator` renders only when all three are provided), add an
      optional `itemLabel` prop appended to the paginator caption (e.g.
      "waypoints"), and use `QueryErrorBanner`/`SkeletonBlock`/
      `FilterInput` internally instead of its current inline markup.
      **Decision:** dropped the `hideFilter` prop the source checklist
      named ("compact mode with no filter row") — no view in this feature
      (including Market and SystemDetail in steps 8-9) ever hides the
      filter, so it would have shipped as unused code. Revisit if a real
      consumer appears later.
      **Done when:** `SystemsView` and `FleetView` (today's only
      `DataTable` consumers) render and behave identically; type-check/
      lint/tests/build pass.

- [x] 8. Migrate `SystemDetailView`'s waypoints table onto the shared
      `DataTable` with `item-label="waypoints"`, removing the duplicated
      pagination math (`Math.max(1, Math.ceil(...))`) in favor of
      `DataTable`'s own use of `getTotalPages`.
      **Done when:** the waypoints table's pagination, filter, and sort
      behavior is unchanged in the browser; the duplicated total-pages
      calculation is gone from `SystemDetailView`; type-check/lint/tests/
      build pass.

- [x] 9. Migrate `MarketView`'s goods table onto the shared `DataTable`
      with `total`/`limit`/`page` omitted (no paginator). Market keeps its
      filter, now via `DataTable`'s built-in one instead of its own raw
      input from step 2.
      **Done when:** the goods table renders identically with and without
      `tradeGoods` present (the conditional Buy/Sell/Volume/Supply/
      Activity columns), the filter still works, no paginator is shown;
      type-check/lint/tests/build pass.

- [x] 10. Add the design tokens to `src/assets/main.css`'s `@theme`:
      `--text-data: 13px`, `--text-label: 11px`, `--text-label-lg: 12px`,
      `--tracking-label: 0.09em`. Replace every arbitrary `text-[13px]`,
      `text-[11px]`, `text-[12px]`, and `tracking-[0.09em]` value across
      the codebase with the generated `text-data` / `text-label` /
      `text-label-lg` / `tracking-label` classes. Factor the 4 identical
      `first`/`prev`/`next`/`last` paginator pass-through strings in
      `src/plugins/primevue.ts` into one shared constant.
      **Done when:** `grep -rn 'text-\[13px\]\|text-\[11px\]\|text-\[12px\]\|tracking-\[0.09em\]' src`
      returns no results; visual output is unchanged across every page;
      type-check/lint/format:check/tests/build pass.

- [x] 11. Final verification: run type-check, lint, format:check,
      test:unit, and build; confirm the production bundle doesn't regress
      in size versus the current build; pass over every page in the
      browser (Login, Dashboard, Systems, System detail, Fleet, Fleet
      detail, Market, 404) checking for unintended visual changes; re-run
      the feature 16 accessibility audit and confirm the score doesn't
      regress; run
      `grep -rn 'statusBadgeClasses\|function eta\|animate-pulse\|Failed to load' src`
      and confirm no results outside the new shared components
      themselves.
      **Done when:** every command above is green, the bundle size check
      and accessibility score are recorded, and the residual-duplicate
      grep is clean.

## Files / areas

- New: `src/shared/ui/QueryErrorBanner.vue`, `SkeletonBlock.vue`,
  `FilterInput.vue`, `PillBadge.vue`, `DetailField.vue`, `InfoPanel.vue`,
  `BackLink.vue`, `PageHeader.vue`
- New: `src/features/fleet/components/ShipStatusBadge.vue`,
  `src/features/fleet/lib/eta.ts` (+ `eta.test.ts`)
- Modified: `src/shared/ui/DataTable.vue`, `src/plugins/primevue.ts`,
  `src/assets/main.css`
- Modified views: `src/features/dashboard/views/DashboardView.vue`,
  `src/features/systems/views/SystemsView.vue`,
  `src/features/systems/views/SystemDetailView.vue`,
  `src/features/fleet/views/FleetView.vue`,
  `src/features/fleet/views/FleetDetailView.vue`,
  `src/features/markets/views/MarketView.vue`

## Data / contracts

No API calls, schemas, or persisted data change. The one behavioral change
is display-only: error banners now call the existing
`getErrorMessage(error, fallback)` helper (already used by `LoginView`)
instead of a hardcoded string, so displayed text can vary by `ApiError`
kind, and the Retry button is hidden for `auth`/`not-found` errors instead
of always shown.

## Testing

Per the project's testing scope rule, only pure logic gets a unit test:
`formatEta(ship)` moves to `features/fleet/lib/eta.ts` with a colocated
`eta.test.ts` covering an `IN_TRANSIT` ship and a non-transit ship (mirrors
the two duplicated functions it replaces). The new Vue components
(`QueryErrorBanner`, `SkeletonBlock`, `FilterInput`, `ShipStatusBadge`,
`PillBadge`, `DetailField`, `InfoPanel`, `BackLink`, `PageHeader`) and the
extended `DataTable.vue` are UI-only and are not unit tested; they're
verified via the browser pass and build in step 11, consistent with how
`DataTable.vue` itself was never unit tested. No existing test's
behavioral contract changes, so the full suite must keep passing unchanged
except for the new `eta.test.ts`.

## Notes for the AI

- Follow the source order from `post-release-improvements.md` step 7:
  leaf components first, then extend `DataTable`, then migrate views, then
  add tokens, then verify.
- `DashboardView`'s fleet-preview table keeps its native `<table>` markup
  rather than moving to `DataTable`: it's a 5-row, non-interactive preview
  with no sort, filter, or pagination, so stretching `DataTable`'s contract
  to cover a case that needs none of its actual features isn't
  proportional. Only its status badge (step 3) and error/skeleton blocks
  (step 1) move to shared components, per the "keep a simple table, reuse
  `ShipStatusBadge`" option the source checklist itself offers.
  `GaugeBar` is already shared and untouched.
  - `ShipStatusBadge`'s fallback class for an unrecognized status is
    purely defensive styling asked for by the source checklist; it does
    not require or depend on feature 24's Zod enum loosening, which is a
    separate, not-yet-built build-plan item.
- `text-label` (11px) vs `text-label-lg` (12px): the source doc names both
  sizes as one ambiguous "11px / 12px" label tier because usage has
  drifted into two slightly different sizes (table/paginator captions and
  pill text at 11px; `DetailField`-style captions at 12px). Keep them as
  two named tokens rather than forcing one size, since collapsing them
  would be a visible size change this feature isn't meant to make.
- Do not touch the pre-existing `tracking-[0.02em]` on page titles (spec
  says `-0.02em`, code has a positive value) or migrate the 14px/15px/20px/
  28px/44px tiers to new tokens; the source checklist only names the
  data/label sizes and label tracking, and widening the token migration
  further is out of scope for this feature.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":15375,"specSha256":"0b1e937638f993651884eece5a77c1f45726f757edff765d6286026b4e42822b","branch":"refs/heads/feature/extract-duplicated-components-reuse-datatable-everywhere","head":"7c041e789a2601c40d3d11ed5ff309fa77ec7dfb","baseRef":"refs/heads/post-release-improvement","baseCommit":"fc6833e63638b97f1e2745471d62ea9f4af352fc","sourceTree":"46124bbb4f0da7066646ee439bc614788c784114","absentOptional":[]} -->
