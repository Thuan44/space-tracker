# Coding Standards

> Your conventions. Tuned by `/onboard` to Vue 3 + Vite + TypeScript + Tailwind
> v4 + PrimeVue (unstyled) + Pinia + TanStack Query + Zod; edit anything that
> doesn't fit as the project evolves.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define types/interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## Vue

- `<script setup lang="ts">` composition API only (no Options API, no class components)
- Keep components focused - one job per component
- Extract reusable logic into composables (`src/composables/use[Name].ts`)
- Props and emits typed with `defineProps<T>()` / `defineEmits<T>()`
- Pinia for shared/global state (`src/stores/`); local component state stays in the component
- Vue Router for navigation (`src/router/`)

## File Organization

- Views/pages: `src/views/[Name]View.vue`
- Components: `src/components/[feature]/ComponentName.vue`
- Composables: `src/composables/use[Name].ts`
- Stores: `src/stores/[name].ts`
- Types: `src/types/[feature].ts`
- Lib/Utils: `src/lib/[utility].ts`

## Naming

- Components: PascalCase (`ItemCard.vue`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS v4 for all styling: CSS-first config (`@import 'tailwindcss'` in `src/assets/main.css`, `@theme` for customization), no `tailwind.config.js`
- PrimeVue components in unstyled mode (`app.use(PrimeVue, { unstyled: true })`) for behavior/accessibility; style them with Tailwind utility classes, not PrimeVue's default themes
- No inline styles

## Data Fetching

- TanStack Query (`@tanstack/vue-query`) for server state: queries and mutations, not ad-hoc `fetch` + refs
- Validate external data (API responses, form input) with Zod schemas; derive TypeScript types from schemas with `z.infer` rather than duplicating them
- Parse untrusted input at the boundary (API responses, route params, form submissions), not deep inside components

## Error Handling

- Surface query/mutation errors from TanStack Query state (`isError`, `error`) rather than try/catch around calls
- Display user-friendly error messages in the UI

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

This project uses Vitest (`npm run test:unit`), `@vue/test-utils` for component
tests, `vi.mock()` for external dependencies, and `vi.useFakeTimers()` for
time-dependent logic.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/tests browser`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
