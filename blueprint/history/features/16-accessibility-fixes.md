# Feature: Accessibility fixes

**From build-plan:** feature 16
**Build attempt:** 1
**Branch:** feature/accessibility-fixes
**Status:** verified

## Goal

Fix the accessibility defects catalogued in
`blueprint/specs/post-release-improvements.md` step 1: missing page language,
no landmark structure, page titles that start at `<h2>`, filter/search inputs
with no accessible name, a letter-by-letter typewriter effect that reads as
fragments to a screen reader, and gauges that may lack an accessible name.
This is markup-and-template-only work — no data, schema, or route contract
changes.

## In scope

- `index.html`: set `<html lang="en">`.
- `App.vue`: wrap `<RouterView />` in a `<main>` landmark.
- Promote each authenticated page's main title from `<h2>` to `<h1>`, keeping
  its existing classes: Dashboard ("Agent"), Systems, Fleet, System detail,
  Fleet detail, Market.
- Keep sibling section titles that were already `<h2>` (Dashboard's "Fleet
  preview") at `<h2>` — don't push them down a level.
- Where a subsection title was one level below the promoted title (`<h3>`
  directly under the old `<h2>`), move it to `<h2>` so the page still reads
  `h1 → h2` with no skipped level: System detail's "Waypoints", Fleet
  detail's "Crew", "Cargo · …", and "Components". This is a tag-only change;
  classes stay as-is.
- Accessible names on filter/search inputs that currently rely on placeholder
  text alone:
  - `shared/ui/DataTable.vue`'s filter input (shared by Systems list and
    Fleet list) — add `aria-label` bound to the existing `filterPlaceholder`
    prop, no new prop.
  - System detail's waypoints filter input.
  - Market's filter input.
  - Systems list's "Explore system symbol" input — add a distinct
    `aria-label="Explore system symbol"`.
- `TypewriterText.vue`: render the complete text in a `sr-only` span and the
  letter-by-letter animated text in a separate `aria-hidden="true"` span, so
  a screen reader announces the whole string once instead of fragments.
- `GaugeBar.vue`: add an optional `label` prop and apply it as `aria-label`
  on the underlying PrimeVue `ProgressBar` (its root already renders
  `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
  via `ptmi('root')`, which merges through fallthrough attributes — verified
  by reading `node_modules/primevue/progressbar/ProgressBar.vue`). Pass:
  - `"Fuel"` from Dashboard's fleet-preview table and Fleet list's Fuel
    column.
  - `"Cargo"` from Fleet list's Cargo column.
  - `"Fuel"` from Fleet detail's single fuel gauge.
  - `` `${component.label} condition` `` (e.g. "Frame condition") from Fleet
    detail's frame/reactor/engine condition gauges.
- `AppHeader.vue`: add `aria-label="Main navigation"` to the `<nav>`.
- Manual verification pass (no code change unless it surfaces a regression):
  keyboard-only walkthrough of every page, plus a Lighthouse or axe
  accessibility audit on each page with before/after scores recorded.

## Out of scope

- Skip link ("Skip to content") — the source doc marks it optional; no
  established requirement pulls it in now.
- `eslint-plugin-vuejs-accessibility` — the source doc leaves it an open
  "decide later" item and it would add a new lint dependency with no proven
  current need; deferred.
- Any change to data fetching, schemas, routing behavior, or visual design
  tokens (steps 2-7 of `post-release-improvements.md` cover those
  separately, as build-plan features 17-22).
- Fixing whatever the closing audit might find beyond this feature's listed
  items — a new finding becomes a follow-up `/fix`, not silent extra scope
  here.

## Build loop

Per `blueprint/config.json`: review after every step (`workflow.stepReview:
"every"`), with an optional checkpoint commit after each approved step
(`workflow.checkpointCommits: "enabled"`). `/complete` creates the final
feature commit; this spec does not prescribe commit messages.

## Build steps

- [x] 1. **Page language and main landmark** — `index.html`: `<html lang="">`
      → `<html lang="en">`. `App.vue`: wrap `<RouterView />` in `<main>`.
      Done when: viewing page source shows `lang="en"`, and the DOM on any
      authenticated route shows a `<main>` element wrapping the routed view;
      existing routes still render with no visual change; `npm run
      type-check` and `npm run test:unit` pass.

- [x] 2. **Promote page titles to `<h1>` without a level skip** — change the
      main title element from `<h2>` to `<h1>` (keeping its classes) on
      Dashboard, Systems, Fleet, System detail, Fleet detail, and Market;
      keep Dashboard's "Fleet preview" at `<h2>`; move System detail's
      "Waypoints" and Fleet detail's "Crew"/"Cargo · …"/"Components" from
      `<h3>` to `<h2>` (classes unchanged). Done when: each of those six
      pages has exactly one `<h1>` and no heading level is skipped, checked
      in the browser's accessibility tree (DevTools → Accessibility, or an
      axe scan); no visual change; `npm run type-check` and `npm run
      test:unit` pass.

- [x] 3. **Accessible names for filter and search inputs** — add
      `aria-label` to `DataTable.vue`'s filter input (bound to its existing
      `filterPlaceholder` prop), System detail's waypoints filter input,
      Market's filter input, and Systems list's "Explore system symbol"
      input (`aria-label="Explore system symbol"`). Done when: each of
      those four inputs shows a non-empty accessible name in DevTools →
      Accessibility distinct from relying on the placeholder alone; Systems
      list and Fleet list filtering still work by typing in the input;
      `npm run type-check` and `npm run test:unit` pass.

- [x] 4. **`TypewriterText` screen-reader-safe rendering** — render the full
      `text` prop inside a `sr-only` span and the existing animated
      character-by-character output inside a sibling `aria-hidden="true"`
      span. Done when: inspecting a rendered `TypewriterText` (System
      detail's symbol heading, Fleet detail's symbol heading, or Market's
      symbol heading) shows both spans in the DOM, DevTools → Accessibility
      reports the complete string as the element's accessible name/text
      rather than a partial one mid-animation, the visible animated text is
      unchanged, and toggling "Reduce motion" in the header still snaps to
      the full text instantly; `npm run type-check` and `npm run test:unit`
      pass (existing `useTypewriter` tests untouched).

- [x] 5. **Accessible names for gauges** — add an optional `label` prop to
      `GaugeBar.vue` and pass it as `aria-label` to the inner `ProgressBar`;
      supply `"Fuel"`/`"Cargo"` from Dashboard's fleet preview and Fleet
      list's table columns, `"Fuel"` from Fleet detail's fuel gauge, and
      `` `${component.label} condition"` `` from Fleet detail's
      frame/reactor/engine gauges. Done when: every rendered gauge's
      `role="progressbar"` element has a non-empty accessible name in
      DevTools → Accessibility (e.g. "Fuel", "Cargo", "Frame condition");
      gauges without a passed `label` still render exactly as before; `npm
      run type-check` and `npm run test:unit` pass.

- [x] 6. **Nav landmark name** — add `aria-label="Main navigation"` to
      `AppHeader.vue`'s `<nav>`. Done when: the `<nav>` element has that
      accessible name in DevTools → Accessibility; no visual change; `npm
      run type-check` and `npm run test:unit` pass.

- [x] 7. **Manual accessibility verification** — keyboard-only walkthrough
      of Login, Dashboard, Systems, System detail, Fleet, Fleet detail,
      Market, and 404: tab order, DataTable sort/filter/pagination
      operable without a mouse, visible focus throughout, reasonable focus
      after navigating between pages. Then run Lighthouse's Accessibility
      category (or an axe scan) on each of those eight pages and record the
      score before and after this feature. Done when: the keyboard
      walkthrough finds no trap and focus is always visible, and a
      before/after score is recorded for all eight pages with no
      regression; any new issue the audit surfaces that isn't already
      covered by steps 1-6 is logged as a follow-up rather than fixed
      silently in this step.

      **Status:** completed by code review only, not a live browser pass —
      the Claude in Chrome extension was unavailable in this session, and
      the user explicitly chose (over connecting it or testing manually
      themselves) to proceed on code review alone. Verified from source:
      DataTable's sort/filter/pagination and Paginator are stock PrimeVue
      behavior, which stays keyboard-accessible in unstyled mode per this
      project's own `coding-standards.md` ("PrimeVue components in
      unstyled mode ... for behavior/accessibility"); no custom keyboard
      handling exists anywhere this feature touched. `src/assets/main.css`
      sets no global `outline: none`, so default browser focus rings are
      intact everywhere except five pre-existing inputs that already used
      `focus:outline-none` with a `focus:border-accent` replacement before
      this feature (`LoginView`, `MarketView`, `SystemsView`,
      `SystemDetailView`, `DataTable`) — unrelated to this feature's scope,
      not fixed here, worth a future `/fix` if a live audit flags it.
      **Not captured:** actual Lighthouse/axe before/after scores for the
      eight pages — this needs a live browser pass the user can run anytime
      via Chrome DevTools' Lighthouse panel (or the axe DevTools extension)
      against `npm run dev`.

## Files / areas

- `index.html`
- `src/App.vue`
- `src/shared/ui/AppHeader.vue`
- `src/shared/ui/DataTable.vue`
- `src/shared/ui/TypewriterText.vue`
- `src/shared/ui/GaugeBar.vue`
- `src/features/dashboard/views/DashboardView.vue`
- `src/features/systems/views/SystemsView.vue`
- `src/features/systems/views/SystemDetailView.vue`
- `src/features/fleet/views/FleetView.vue`
- `src/features/fleet/views/FleetDetailView.vue`
- `src/features/markets/views/MarketView.vue`

## Data / contracts

None. No API, schema, route, or query-key changes. All changes are template
markup, one new optional Vue prop (`GaugeBar`'s `label: string | undefined`),
and reused existing props (`DataTable`'s `filterPlaceholder`).

## Testing

This is markup-only work with no new pure logic function, consistent with
the project's existing convention (Vitest covers pure logic, not component
mounting — see `useTypewriter.test.ts` / `useGaugeReveal.test.ts`, which stay
untouched). No new automated tests are added. Verification is: the existing
suite (`npm run test:unit`) and `npm run type-check` staying green after
every step, plus the manual keyboard and axe/Lighthouse pass in step 7.

## Notes for the AI

- Tailwind v4 ships `sr-only` as a core utility (confirmed: no existing
  custom definition in `src/assets/main.css`, and `@import 'tailwindcss'` is
  present) — no new CSS needed for step 4.
- PrimeVue's unstyled `ProgressBar` sets `inheritAttrs: false` and merges
  `$attrs` onto its root element itself via `ptmi('root')` (see
  `node_modules/primevue/progressbar/ProgressBar.vue` and
  `_useAttrs`/`ptmi` in `@primevue/core/basecomponent`), so passing
  `aria-label` directly as an attribute on `<ProgressBar>` lands on the
  `role="progressbar"` div — no `pt` config change needed in
  `src/plugins/primevue.ts`.
- Keep every heading's existing Tailwind classes untouched when changing its
  tag — only the element name changes.
- Don't touch `useCountUp`/`CountUpNumber`, filter/sort scope wording, or
  the router guard shape — those are separate build-plan items (25, 26, 23).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11734,"specSha256":"42e26baccf3ed9c7638177e760dd5b86a4ac1549313a179ca3da86d1bb5eb45b","branch":"refs/heads/feature/accessibility-fixes","head":"21eb75b7b3a84b767b0c45a363a6f92ec368983b","baseRef":"refs/heads/post-release-improvement","baseCommit":"936505bc0b41cd68093d7c8b7fb4828b6e14599d","sourceTree":"3815729be4c2a3cd259001eca5642a84b029ee6b","absentOptional":[]} -->
