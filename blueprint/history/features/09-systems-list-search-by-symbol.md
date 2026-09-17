# Feature: Systems list: search by symbol

**From build-plan:** feature 9
**Build attempt:** 1
**Branch:** feature/systems-list-search-by-symbol
**Status:** verified

## Goal

Let the player jump straight to a known system by typing its exact symbol
(`SECTOR-SYSTEM`, e.g. `X1-DF55`) next to the existing filter/sort controls on
the Systems list (`src/features/systems/views/SystemsView.vue`), instead of
paging/filtering through the table to find it. This is a pure client-side
format check and redirect into System detail (feature 8) - there is no lookup
call against the API to confirm the system exists; an invalid destination
surfaces through System detail's own existing error state, the same way its
symbol links from the table already can.

## In scope

- A new Zod schema, `symbolSchema` (`src/features/systems/lib/symbol.schema.ts`):
  trims the input, uppercases it, then validates it matches exactly two
  alphanumeric segments joined by one hyphen (`^[A-Z0-9]+-[A-Z0-9]+$`) - the
  `SECTOR-SYSTEM` shape from the build plan (`X1-DF55`). Zod's `.trim()` and
  `.toUpperCase()` string transforms perform the normalization before the
  regex check runs, so `x1-df55` and `X1-DF55` both parse to the same
  uppercased value. A waypoint symbol (`X1-DF55-A1`, three segments) fails
  this pattern, since only a system symbol is a valid destination here.
- A search input + "Explore" button pair on `SystemsView.vue`, placed after the
  existing filter input, wrapped in their own `<form>` so Enter in the field
  submits it the same way clicking the button does (covers the build plan's
  "as the user types or on submit").
- Live validation: every input change runs the current value through
  `symbolSchema.safeParse`; the Explore button is `disabled` whenever that
  parse fails (empty input included).
- On submit with a valid symbol: the button enters a `loading` phase (spinner,
  see Notes for the AI), then a `ready` phase showing "Ready for exploration !"
  in place of the button label, then `router.push` to
  `/systems/${normalizedSymbol}` using the schema's uppercased output. Both
  phases use a fixed, named delay constant (not user-configurable) so the
  sequence is visible rather than instant.
- While either phase is running, the input and button stay disabled so a
  second submit can't interrupt the sequence.

## Out of scope

- Any API call to confirm the symbol resolves to a real system - explicitly
  not part of this feature (see Goal); System detail's existing error/retry
  state already covers a symbol that doesn't exist.
- Partial/fuzzy matching against known systems - this field is exact-format
  only and independent of the existing `filterText` client-side table filter,
  which keeps filtering the loaded page as it already does.
- Any change to `shared/ui/DataTable` extraction (build-plan item 10) or to
  the Systems table's existing columns, sorting, or pagination.
- A new icon dependency for the loading spinner - built from a plain
  Tailwind-styled element (see Notes for the AI), matching this project's
  "no new dependency without a current requirement" rule.
- An inline error message for an invalid/incomplete symbol - the build plan
  only specifies the button staying disabled; no additional validation-message
  UI is described, so none is added.

## Build loop

Per-step review is enabled for this feature: stop after each build step below
and wait for approval before starting the next one. On approval, create a
checkpoint commit on `feature/systems-list-search-by-symbol` for that step
alone. `/complete` creates the final feature commit and archives this spec; it
is not run by this skill.

## Build steps

- [x] 1. Add `symbolSchema` and its tests.
      - Create `src/features/systems/lib/symbol.schema.ts` exporting
        `symbolSchema` (`z.string().trim().toUpperCase().regex(/^[A-Z0-9]+-[A-Z0-9]+$/)`)
        and `type SystemSymbol = z.infer<typeof symbolSchema>`.
      - Create `src/features/systems/lib/symbol.schema.test.ts` covering:
        a valid uppercase symbol (`X1-DF55`), a mixed-case symbol that
        normalizes and matches the same value (`x1-df55` -> `X1-DF55`), and
        invalid cases via `safeParse` - no hyphen (`X1DF55`), a waypoint-style
        three-segment symbol (`X1-DF55-A1`), and an empty string.
      - Done when: `npm run test:unit` passes, including the new file.

- [x] 2. Wire the search field and Explore button into `SystemsView.vue`.
      - Add `searchSymbol` (`ref('')`) and a `searchState` ref
        (`'idle' | 'loading' | 'ready'`), plus a computed `parsedSymbol` from
        `symbolSchema.safeParse(searchSymbol.value)`.
      - Render a `<form>` after the existing filter `<input>`: a text input
        bound to `searchSymbol` (placeholder `System symbol, e.g. X1-DF55`,
        `disabled` while `searchState !== 'idle'`) and a submit button,
        `disabled` when `!parsedSymbol.success || searchState !== 'idle'`.
      - On submit (guarded by the same disabled condition): set
        `searchState = 'loading'`, `await` a fixed `EXPLORE_DELAY_MS` (e.g.
        `400`) via a small local `delay(ms)` helper, set
        `searchState = 'ready'`, `await` the same delay again, then
        `router.push(\`/systems/${parsedSymbol.value.data}\`)`.
      - Button label: "Explore" when idle, a spinner when `loading`, "Ready
        for exploration !" when `ready`.
      - Done when: `npm run type-check` passes; manually verified in the dev
        server - an invalid symbol keeps Explore disabled, a valid symbol
        (mixed case accepted) enables it, submitting shows the spinner then
        the ready text before navigating to `/systems/<UPPERCASED-SYMBOL>`.
      - **Amended during and after this step, from direct feedback**: the
        filter input and this form now sit in a shared flex row (`SystemsView.vue`
        wraps both in `class="mt-4 flex flex-wrap items-start gap-4"`) instead
        of stacking, so they read as one control group. The button is a fixed
        `w-32` (was going to auto-size) so its width doesn't shift between
        "Explore"/spinner/ready-text. The search input is `w-96` - a plain
        fixed width, not `w-full`, because it sits inside the inner `<form>`
        (itself an un-widthed flex item), where a percentage width can't
        resolve against a shrink-to-fit container and silently fell back to
        the input's intrinsic size; `w-96` (24rem) matches the filter input's
        `max-w-sm` cap (24rem) by fixed value instead. `EXPLORE_DELAY_MS` is
        `600` (was `400`) and the ready-state label reads "System found !"
        (was "Ready for exploration !") - both later copy/timing calls, not
        format or validation changes. The spinner is
        `border-2 border-surface-0/30 border-t-surface-0` (not
        `border-line`/`border-t-accent` as first drafted), so it's visible
        against the button's `bg-accent` background instead of blending into
        it.

## Files / areas

- `src/features/systems/lib/symbol.schema.ts` - new
- `src/features/systems/lib/symbol.schema.test.ts` - new
- `src/features/systems/views/SystemsView.vue` - extend (search form, state,
  submit handler)
- `src/features/systems/views/SystemDetailView.vue` - unrelated one-line fix,
  bundled in by explicit user decision at completion: the back link's
  `inline-flex items-center gap-2` broke the hover underline into two
  disconnected segments (the arrow and the text), because flex `gap` has no
  content for `text-decoration` to render under. Removed the flex/gap so the
  arrow, a normal space, and the text form one inline run and underline
  continuously on hover. No behavior change, feature 8's own scope.

## Data / contracts

- `symbolSchema`: client-side input validation only, no server round-trip and
  no persisted state. Input -> trimmed, uppercased, regex-checked against
  `^[A-Z0-9]+-[A-Z0-9]+$`. Output type `SystemSymbol = string`.
- Navigation target: existing route `system-detail`
  (`/systems/:systemSymbol`, feature 8) - this feature only supplies the
  `systemSymbol` param value, it does not touch the route definition or guard.

## Testing

- `symbol.schema.test.ts`: valid case, mixed-case-normalizes-to-match case,
  and invalid-format cases (no hyphen, three-segment/waypoint-shaped input,
  empty string) via `safeParse`, matching the style of the project's other
  `*.schema.test.ts` files.
- No component test for `SystemsView.vue`'s new form - UI/integration surface,
  verified by running the app, consistent with this project's existing
  "pure logic only" testing scope (no `@vue/test-utils` mounting anywhere in
  the codebase, confirmed in `useSystemsQuery.test.ts` and
  `useAgentQuery.test.ts`). This also covers the loading -> ready -> redirect
  timing sequence, which is a UI affordance rather than assertable logic.
- No `Browser tests` command is declared yet, so this feature does not add
  browser coverage.

## Notes for the AI

- This field is deliberately separate from the existing `filterText` ref and
  its `filteredRows` computed - do not merge them or route this symbol through
  the table filter.
- `router` is already available via `vue-router`'s `useRouter()` in this
  codebase (see `LoginView.vue`'s `router.push('/')` after login); reuse that
  pattern rather than a `<RouterLink>`, since the destination depends on
  runtime input.
- No PrimeVue `InputText` here - the existing filter input in this same view
  is a plain styled `<input>`; match that, not a new component.
- The spinner is a plain element with Tailwind's built-in `animate-spin`, not
  a new icon package - no icon library is installed in this project
  (`package.json` has no `primeicons`/icon dependency), and none is needed for
  one spinner.
- Keep the two-phase delay (`loading` then `ready`) as a small local
  `delay(ms) => new Promise(resolve => setTimeout(resolve, ms))` helper inside
  the component; no new shared utility for a single caller.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9974,"specSha256":"8a85e3aed9fc3b325a826006c9e52183b28860d727742a1777c18a3bd9a1be83","branch":"refs/heads/feature/systems-list-search-by-symbol","head":"002b9b93173ead9a049de6b6bfc7d3ac602a0289","baseRef":"refs/heads/main","baseCommit":"06c4d18b2498373cf5b3a423e32753754055efc0","sourceTree":"eea752c8682c069dce7f3e02a37022dfa51dd7cc","absentOptional":[]} -->
