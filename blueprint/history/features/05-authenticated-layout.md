# Feature: Authenticated layout

**From build-plan:** feature 5
**Build attempt:** 1
**Branch:** feature/authenticated-layout
**Status:** verified

## Goal

Every authenticated screen gets a consistent top nav (wordmark, Dashboard/
Systems/Fleet, active item highlighted) and a working Log out control, so the
app has one place users orient themselves instead of a bare `RouterView`.

## Design reference

`blueprint/reference/design/maquette_dashboard.png` - the header at the top of
this high-fidelity dashboard mockup: wordmark left, three nav items with the
active one in a filled pill, a bordered square logout control on the far
right, 1px bottom border separating it from the page. Use the design system's
own fixed 64px header-height and 32px page-padding tokens (`h-16` / `px-8`)
rather than eyeballing the mockup's pixels. The mockup's logout control is an
icon-only button - see Notes for the AI for why this spec uses a text label
instead.

## In scope

- `AppHeader` component: wordmark linking to `/`, top nav (Dashboard -> `/`,
  Systems -> `/systems`, Fleet -> `/fleet`), active item highlighted by the
  current route's path, "Log out" button (clears the token store, redirects
  to `/login`).
- Wiring `AppHeader` into `App.vue` so it renders on every route except
  `/login`.

## Out of scope

- Hiding the header on the 404 page - that route doesn't exist yet (feature
  13); this feature only excludes `/login`, the one authenticated-layout
  exception that currently exists. Feature 13 must add its own route to the
  exclusion when it lands.
- The destination screens themselves (Dashboard #6, Systems #7, Fleet #10).
  Their nav links point at paths with no registered route yet, so visiting
  them renders the header over a blank `RouterView` - the same incremental
  state already established when feature 4's post-login redirect landed on
  an unmatched `/`.
- Sidebar navigation or a responsive nav collapse - the journal-de-bord
  decision on file is top nav only, revisited only if the item count grows
  past 5-6.
- A "Log in" button in the header - the spec is explicit that authentication
  only happens on `/login`; the header never shows one.

## Build loop

Per `blueprint/config.json` (`workflow.stepReview: "every"`,
`workflow.checkpointCommits: "enabled"`): implement one build step, run the
checks named in its `Done when`, then stop for review. On approval, create a
checkpoint commit on this feature branch before starting the next step.
`/complete` creates the final feature commit.

## Build steps

- [x] 1. **`AppHeader` component**
   - Add `src/shared/ui/AppHeader.vue` (cross-cutting UI, same `shared/`
     convention as `shared/api/http.ts` and the eventual `shared/ui/DataTable`
     named in build-plan #9):
     - Wordmark "Space Tracker" as a `RouterLink` to `/`.
     - Nav: `RouterLink`s to `/`, `/systems`, `/fleet` labeled Dashboard,
       Systems, Fleet. Active item (current `route.path` matches, with `/`
       matched exactly and the others by prefix) gets a filled pill
       (`bg-surface-2`, `text-fg`, `font-medium`); inactive items are
       `text-muted` with a `hover:text-fg`.
     - "Log out" button: calls the token store's `logout()`, then
       `router.push('/login')`.
     - Styling from the design tokens: `h-16` header, `px-8` edge padding,
       `border-b border-line`, `bg-surface-0`, `rounded-sm` on the nav pill
       and the logout button (the "buttons/inputs/pagination" 4px radius
       bucket), `cursor-pointer` on the logout button.
   - Done when: `npm run type-check` passes (no dedicated test - see Testing).

- [x] 2. **Wire it into `App.vue`**
   - `App.vue` renders `<AppHeader v-if="route.name !== 'login'" />` above
     `<RouterView />`, reading the current route via `useRoute()`.
   - Done when: `npm run type-check` passes; running `npm run dev` shows no
     header on `/login`, shows the header (with Dashboard highlighted) on any
     other path including the still-unmatched `/`, and clicking "Log out"
     from there clears the token and returns to `/login`.

## Files / areas

- `src/shared/ui/AppHeader.vue` (new)
- `src/App.vue`

## Data / contracts

None. `AppHeader` only consumes the token store's existing `logout()`
(feature 4) and `vue-router`'s current route - no new schema, no new API call.

## Testing

No new test file. This feature is presentation and navigation wiring (static
nav links, a route-path string comparison, and a two-line logout handler
already proven correct in shape by feature 4's own logout-equivalent code) -
per the Testing standard's scope rule, UI components are verified by running
the app, not a mount test, and there's no pure logic branch here worth
extracting into its own testable module the way feature 4's guard was.

## Notes for the AI

- No icon library is installed and none is named as a requirement anywhere in
  the specs. The mockup's logout control is icon-only; this spec uses the
  literal text the French spec gives ("Bouton `Log out`") instead of adding a
  dependency for one icon. Swap to an icon later only if a broader icon need
  shows up across features.
- Active-item highlighting compares `route.path`, not `route.name` - Systems
  and Fleet have no registered route yet, so this can't use named-route
  matching today, but path comparison needs no changes once features 7 and 10
  register those routes.
- Keep buttons `cursor-pointer` - established in feature 4's review.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5451,"specSha256":"6fefbda11093eb56a37db560616e3b2aa4d761e140ad7af711ff0daa5451aee4","branch":"refs/heads/feature/authenticated-layout","head":"ef2d65021f87d506c3f2308c0ef4f3f604d9e40e","baseRef":"refs/heads/main","baseCommit":"ef2d65021f87d506c3f2308c0ef4f3f604d9e40e","sourceTree":"ffc4a5f6da6e6ffe0de82e832253322f4cdb0ece","absentOptional":[]} -->
