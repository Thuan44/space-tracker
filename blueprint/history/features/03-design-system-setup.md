# Feature: Design system setup

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/design-system-setup
**Status:** verified

## Goal

Replace the default Vite/Tailwind scaffold styling with the real Space Tracker
design system: the Tailwind v4 `@theme` tokens (surfaces, text, signal colors,
radii, font), the self-hosted IBM Plex Mono font, and PrimeVue's global
unstyled pass-through for the two components a planned feature already needs
(`DataTable`+`Paginator`, `ProgressBar`). Every later screen builds on top of
this instead of default Tailwind/PrimeVue looks.

## In scope

- `src/assets/main.css`: the full `@theme` block and `@layer base body { ... }`
  from the design system source, replacing the current bare
  `@import 'tailwindcss';`.
- `src/main.ts`: self-hosted IBM Plex Mono weight imports
  (`@fontsource/ibm-plex-mono`, 400/500/600/700).
- `src/plugins/primevue.ts`: PrimeVue global `pt` config for
  `DataTable`+`Paginator` and `ProgressBar`, exported as `primeVueOptions` and
  passed to `app.use(PrimeVue, primeVueOptions)` in `main.ts`.
- `package.json` / `package-lock.json`: add `@fontsource/ibm-plex-mono` as a
  dependency.

## Out of scope

- `Dialog` pass-through - no planned feature uses a modal yet; added by
  whichever future feature introduces the first one.
- Extracting `Badge`/`Button`/`Card` as shared Vue components - these stay
  Tailwind utility-class recipes applied per-usage in the feature that needs
  them first (`specs-techniques.md`: no shared component designed ahead of
  need).
- Custom spacing tokens - the design system's 4px scale already matches
  Tailwind's default spacing utilities.
- A custom "full" radius token - gauge bars use Tailwind's built-in
  `rounded-full` utility, not a project token.
- Any visible screen, route, or component - this feature only wires tokens
  and plugin config that later features consume.

## Build loop

Each step below is reviewed before the next starts (`workflow.stepReview:
every`). An approved step gets an optional checkpoint commit
(`workflow.checkpointCommits: enabled`). `/complete` creates the final
feature commit; no step commits directly to `main`.

## Build steps

- [x] 1. Port the `@theme` tokens and base body styles into
      `src/assets/main.css`.
      - Add a Tailwind v4 `@theme { ... }` block defining, exactly as given in
        `blueprint/reference/design/design-system/Space Tracker Design
        System.pdf` (Tokens sheet) and cross-checked against
        `blueprint/specs/identite-visuelle.md` (both agree):
        - `--color-surface-0: #0B0F14`, `--color-surface-1: #111820`,
          `--color-surface-2: #1A222C`, `--color-line: #26303C`
        - `--color-fg: #E8EDF2`, `--color-muted: #8A97A5`
        - `--color-accent: #2EE6A6`, `--color-warn: #F5A623`,
          `--color-info: #5AC8E8`, `--color-danger: #F0554D`
        - `--radius-xs: 2px`, `--radius-sm: 4px`, `--radius-md: 6px`
        - `--font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace`
      - Add `@layer base { body { background: var(--color-surface-0); color:
        var(--color-fg); font-family: var(--font-mono);
        font-variant-numeric: tabular-nums; } }`.
      - Keep the existing `@import 'tailwindcss';` as the first line.
      - Done when: `npm run build` succeeds, and the dev server shows a
        near-black page background with light text in a monospace fallback
        (the custom font isn't loaded until step 2).

- [x] 2. Self-host IBM Plex Mono.
      - Add `@fontsource/ibm-plex-mono` to `package.json` (`npm install
        @fontsource/ibm-plex-mono`).
      - In `src/main.ts`, side-effect-import the four weight files used by
        the type scale: `@fontsource/ibm-plex-mono/400.css`,
        `/500.css`, `/600.css`, `/700.css`.
      - Done when: `npm run build` succeeds, and the dev server's page text
        visibly renders in IBM Plex Mono, confirmed in devtools' Network tab
        as a same-origin font file request (no Google Fonts or other
        external font request).

- [x] 3. Configure PrimeVue's global unstyled pass-through for `DataTable`,
      `Paginator`, and `ProgressBar`.
      - In `src/plugins/primevue.ts`, export a `primeVueOptions` object
        (`unstyled: true` plus a `pt` object) and pass it to
        `app.use(PrimeVue, primeVueOptions)` in `main.ts`, reproducing the
        classes from the design system PDF's Tables and Gauges sheets
        exactly:
        - `datatable`: `root`, `table`, `thead`, `headerRow`, `bodyRow`.
        - `column`: `headerCell`, `columnTitle`, `sortIcon`, `bodyCell` - the
          PDF's "PrimeVue DataTable + Paginator - unstyled" block lists these
          under `datatable`, but the installed PrimeVue 5 types
          (`primevue/column`) place them on the `column` pass-through
          instead; only the key moved, every class is unchanged.
        - `paginator`: `root`, `current`, `pages`, `page` (function keyed off
          `context.active`), `prev`, `next`, same block.
        - `progressbar`: `root` (`h-2 w-full rounded-full bg-surface-2
          overflow-hidden`) and `value` (function returning the
          accent/warn/danger ramp at the 50%/20% thresholds from the PDF's
          Gauges sheet).
      - Done when: `npm run type-check` and `npm run build` both succeed. No
        screen consumes these components yet (first consumers are features
        #7, #10, #12 for the table/paginator and #11 for the gauge), so there
        is no visual check for this step; correctness is verified by the
        `pt` object matching the PDF source and the type-checker accepting
        the pass-through shape against the installed PrimeVue types.

## Files / areas

- `src/assets/main.css`
- `src/main.ts`
- `package.json`, `package-lock.json`

## Data / contracts

No API or persisted-data contract. The "contract" here is the design token
source of truth: `blueprint/reference/design/design-system/Space Tracker
Design System.pdf` and `blueprint/specs/identite-visuelle.md` (both agree on
every value used above). Copy hex values, radius steps, and PrimeVue utility
classes verbatim rather than approximating them.

## Testing

None. This step is CSS custom-property tokens and plugin configuration with
no branching logic to assert, matching the build plan's own note for this
feature. Verification is `npm run type-check` and `npm run build` after each
step, plus the visual/network checks named in each step's "Done when".

## Notes for the AI

- The installed PrimeVue major version is `^5.0.1`, but the PDF's pass-through
  block is written against PrimeVue 4 section names ("Section names follow
  PrimeVue 4; confirm them against the version you pin, the classes are what
  matter" - PDF, Gauges/Tables sheets). If the installed version's `pt` key
  names or callback argument shape differ, adapt the key names and callback
  signature to what the installed types accept while preserving the exact
  utility classes and the 50%/20% color thresholds. This is an
  implementation detail, not a design decision - do not change any class or
  threshold value while doing so.
- Only two text colors exist app-wide (`fg`, `muted`) - hierarchy comes from
  size/weight/tracking utilities applied later, not from adding more color
  tokens now.
- Do not add a `--radius-full` token or any spacing tokens - both are
  explicitly out of scope (see above).
- No em dashes, en dashes, or ellipsis characters in any code comments this
  feature might touch (project writing convention).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7534,"specSha256":"b57ab2d09e021415aa98017f98ea977f1608f950f507f709331f7b11f9c9f91f","branch":"refs/heads/feature/design-system-setup","head":"51e8c00380e3257618869aeb6bc3709dcfdc2332","baseRef":"refs/heads/main","baseCommit":"51e8c00380e3257618869aeb6bc3709dcfdc2332","sourceTree":"89eee6c4727dfc8773b92b093e63e13e1762cc7d","absentOptional":[]} -->
