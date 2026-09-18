# Feature: Extract shared DataTable

**From build-plan:** feature 10
**Build attempt:** 1
**Branch:** feature/extract-shared-datatable
**Status:** verified

## Goal

Pull the loading/error/pagination boilerplate that the Systems list table
(#7) hand-rolls into a shared `src/shared/ui/DataTable.vue` component, and
migrate the Systems list onto it, with no user-visible behavior change.

## In scope

- New `src/shared/ui/DataTable.vue`: a generic wrapper around PrimeVue's
  `DataTable` + `Paginator` that owns the filter `<input>`, the loading
  skeleton, the error-with-retry block, and the page-number bookkeeping
  (1-indexed page state, total-pages calculation, the `Page X of Y` label).
  Column definitions stay with the consumer via the component's default
  slot (forwarded straight to the inner PrimeVue `<DataTable>`), so each
  screen keeps full control of its row shape and per-column templates. An
  optional `toolbar-end` slot lets a consumer place extra controls (e.g. an
  "Explore" form) beside the filter input.
- New `src/shared/lib/pagination.ts`: pure `getTotalPages(total, limit)`
  helper, extracted from the duplicated inline calculation, with a focused
  unit test.
- Migrate `src/features/systems/views/SystemsView.vue` to use the new
  `DataTable` component: replace its direct PrimeVue `DataTable`/`Paginator`
  usage and local `onPage`/`totalPages` logic, keep the existing
  `filteredRows` computed (the filter predicate stays view-specific), and
  move the Explore form into the `toolbar-end` slot.

## Out of scope

- `System detail`'s waypoints table (#8) is not migrated. The build plan
  scopes this feature to "Migrate Systems list onto it," with Fleet list
  (#11) named as the second consumer informing the component's design.
  System detail's near-identical table is left as-is; it was not named by
  this build-plan item and migrating it would be scope not requested here.
- No change to the filter *predicate* logic (which fields are matched,
  case-insensitivity, etc.) — that stays a per-view `computed` over rows,
  same as today.
- No change to PrimeVue's global `pt` pass-through configured in feature 3.
- No new component-level tests. Per `coding-standards.md`, UI components and
  integration-level surfaces are proven live (dev server / a later
  `/check`), not with brittle render assertions; the only extracted *logic*
  (`getTotalPages`) gets a focused unit test.

## Build loop

Config: `workflow.stepReview: "every"`, `workflow.checkpointCommits:
"enabled"`. Each step below stops for review before the next starts; an
approved step gets an optional checkpoint commit on
`feature/extract-shared-datatable` before continuing.

## Build steps

- [x] 1. Add `src/shared/lib/pagination.ts` exporting
      `getTotalPages(total: number, limit: number): number` (the
      `Math.max(1, Math.ceil(total / limit))` calculation currently inlined
      in `SystemsView.vue` and `SystemDetailView.vue`), plus
      `src/shared/lib/pagination.test.ts` covering an evenly-divisible
      total, a remainder, a total smaller than one page, and `total === 0`.
      **Done when:** `npm run test:unit` passes including the new tests.
- [x] 2. Add `src/shared/ui/DataTable.vue` (`<script setup lang="ts"
      generic="T">`). Props: `rows: T[]`, `dataKey: string`, `isPending:
      boolean`, `isError: boolean`, `errorMessage: string`, `total: number`,
      `limit: number`, `page: number`, `filterText: string`,
      `filterPlaceholder: string`. Emits: `update:page` (number),
      `update:filterText` (string), `retry`. Slots: default (forwarded to
      the inner PrimeVue `<Column>` content) and `toolbar-end`. Internals:
      filter input row (existing Tailwind classes from `SystemsView.vue`)
      with the `toolbar-end` slot beside it; loading skeleton block; error
      block with a Retry button that emits `retry`; otherwise the inner
      PrimeVue `DataTable` (`:value="rows" :data-key="dataKey"`, default
      slot passthrough) and `Paginator` wired to `update:page` via
      `event.page + 1`, using `getTotalPages` from step 1 for the `Page X
      of Y` label.
      **Done when:** `npm run type-check` passes (the generic component
      compiles cleanly); no consumer wired up yet.
- [x] 3. Migrate `src/features/systems/views/SystemsView.vue` onto the new
      `DataTable`: drop its direct `primevue/datatable`,
      `primevue/paginator` imports and local `onPage`/`totalPages` logic;
      bind `v-model:page="page"` and `v-model:filterText="filterText"`;
      pass `:rows="filteredRows"` (unchanged computed), `data-key="symbol"`,
      `:total="data.meta.total"`, `:limit="data.meta.limit"`,
      `error-message="Failed to load systems."`,
      `filter-placeholder="Filter by symbol, name, sector or star type"`,
      `@retry="refetch"`; keep the existing `<Column>` definitions as
      default-slot content; move the Explore `<form>` into the
      `toolbar-end` slot.
      **Done when:** `npm run type-check` and `npm run test:unit` pass, and
      `npm run dev` shows `/systems` behaving identically to before this
      feature — filter, sort, Explore, and pagination all still work, with
      no visual change.

## Files / areas

- `src/shared/lib/pagination.ts` (new)
- `src/shared/lib/pagination.test.ts` (new)
- `src/shared/ui/DataTable.vue` (new)
- `src/features/systems/views/SystemsView.vue` (migrated)

## Data / contracts

No API or schema changes. This is an internal Vue component refactor; the
`DataTable.vue` prop/emit/slot contract is fully specified in Build step 2
above.

## Testing

- `pagination.test.ts`: `getTotalPages` for an evenly-divisible total, a
  remainder, a total under one page, and `total === 0`.
- No new component test for `DataTable.vue` or `SystemsView.vue` — per
  `coding-standards.md`'s testing scope rule, UI/integration surfaces are
  proven live, not with render assertions. `useSystemsQuery.test.ts` is
  unaffected and continues to prove the data-fetching composable.
- Manual/live verification: confirm `/systems` is behaviorally unchanged
  (filter, sort, Explore button, pagination) after step 3, per that step's
  Done when.

## Notes for the AI

- Import PrimeVue's `DataTable` and `Paginator` inside the new
  `src/shared/ui/DataTable.vue` under distinct local names (e.g.
  `PrimeDataTable`) since the file itself defines a component named
  `DataTable` — no collision in practice since consumers only import the
  shared component going forward, but keep the internal import aliased for
  clarity.
- `SystemDetailView.vue`'s waypoints table has the same shape as
  `SystemsView.vue`'s did (filter input, loading/error blocks, paginator
  math) but is intentionally left untouched — see Out of scope.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":6746,"specSha256":"ce6a6c1923ba4f2839da4a2fc87340c0cdd096856151bccfa4cff2fd81a11f2f","branch":"refs/heads/feature/extract-shared-datatable","head":"f14ee1f25b935971d4053394c7c2291bd68f4b98","baseRef":"refs/heads/main","baseCommit":"a1b13e5b72833a13f8db78d398d4ac0ca9388bb8","sourceTree":"5870bec6df47c7f3ef4b35d3dd1951f7f58fea8a","absentOptional":[]} -->
