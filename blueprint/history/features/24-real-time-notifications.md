# Feature: Real-time notifications

**From build-plan:** feature 24
**Build attempt:** 1
**Branch:** feature/real-time-notifications
**Status:** verified

## Goal

Give the player feedback for ship actions and arrivals via PrimeVue Toast:
success/error toasts for the four navigation mutations (orbit/dock/navigate/
refuel), and an arrival toast when a ship's status leaves `IN_TRANSIT` while
its detail view is open. Closes out the v2 navigation work started in feature
23 (`blueprint/specs/plan-navigation-notifications.md`, sections 5–8).

## In scope

- Register PrimeVue's `ToastService` and mount `<Toast />` globally.
- Style the Toast component in unstyled mode to match the design system
  (tokens already used elsewhere: `surface-*`, `line`, `fg`, `muted`,
  `accent`, `danger`).
- In `FleetDetailView`, fire a toast on success/error for each of the four
  existing mutations (orbit, dock, navigate, refuel), replacing the current
  static inline error banner (`navigationError`) with toast-based feedback.
- In `FleetDetailView`, watch the loaded ship's `nav.status` and fire an
  arrival toast when it transitions away from `IN_TRANSIT`.
- Update `README.md` to drop the now-inaccurate "read-only" framing and the
  "Not included" bullets for navigation/notifications, and describe the v2
  feature set (navigation, refuel, polling, toast notifications).

## Out of scope

- Toasts from `FleetView` or `DashboardView` — deliberate v1 scope choice
  documented in the plan (section 5); polling already keeps their tables
  current without a toast.
- Any change to `useShipNavigation.ts`'s mutation definitions or cache
  invalidation — those are done (feature 23) and unaffected by this feature.
- Any change to the four navigation API calls, schemas, or the `mutate()`
  HTTP helper — done in feature 23.
- New `getErrorMessage` message copy — the existing `kind` → message map
  already covers the errors these mutations can throw.

## Build loop

Per step: implement, then stop for review (`workflow.stepReview: "every"`).
After an approved step, create a checkpoint commit
(`workflow.checkpointCommits: "enabled"`) before starting the next step.

## Build steps

- [x] 1. **Register and style PrimeVue Toast**
  - `src/main.ts`: import `ToastService` from `primevue/toastservice`,
    `app.use(ToastService)` alongside the existing `app.use(PrimeVue, ...)`.
  - `src/App.vue`: import `Toast` from `primevue/toast` and render `<Toast />`
    once, outside the `v-if` header conditional (visible on every route,
    including `/login`).
  - `src/plugins/primevue.ts`: add a `toast` entry to the existing `pt`
    object styling `root`, `message`, `messageContent`, `messageIcon`,
    `messageText`, `summary`, `detail`, `buttonContainer`, and `closeButton`/
    `closeIcon` with the design system's existing tokens (surfaces, border,
    radius, `accent` for success, `danger` for error) — same approach as the
    existing `datatable`/`paginator`/`progressbar` entries, no new tokens.
  - Done when: `npm run type-check` and `npm run build` pass, and a manual
    check in the running dev server (triggering any mutation, e.g. orbit)
    shows a styled toast consistent with the rest of the UI.

- [x] 2. **Mutation toasts in FleetDetailView**
  - Import `useToast` from `primevue/usetoast` in `FleetDetailView.vue`.
  - Pass `{ onSuccess, onError }` callbacks on each `.mutate()` call
    (`handleOrbit`, `handleDock`, `handleNavigate`, `handleRefuel`) rather
    than touching `useShipNavigation.ts`, so the composable and its existing
    unit tests are untouched.
  - Success toasts use `severity: 'success'`, default `life` (3000 ms):
    - Orbit: "Ship in orbit" / `${symbol} is now in orbit.`
    - Dock: "Ship docked" / `${symbol} is now docked.`
    - Navigate: "Ship departed" / `${symbol} is heading to ${waypointSymbol}.`
    - Refuel: "Refueled" / `${symbol}'s fuel tank is topped up.`
  - Error toasts use `severity: 'error'`, `life: 6000`, summary describing
    the failed action (e.g. "Orbit failed"), detail from
    `getErrorMessage(error, 'Action failed. Check ship status and try again.')`.
  - Remove the now-superseded `navigationError` computed and its inline
    `role="alert"` paragraph in the template.
  - Done when: `npm run type-check` passes; manually triggering each of the
    four actions from the running app shows the matching success toast, and
    the existing `useShipNavigation.test.ts` still passes unmodified.

- [x] 3. **Arrival-detection toast in FleetDetailView**
  - Add a `watch(() => ship.value?.nav.status, (next, prev) => { ... })` that
    fires a `severity: 'success'` toast ("Arrived" /
    `${ship.value.symbol} arrived at ${ship.value.nav.waypointSymbol}.`) only
    when `prev === 'IN_TRANSIT'` and `next !== 'IN_TRANSIT'`.
  - No dedicated composable or test — matches the plan's stated choice
    (`plan-navigation-notifications.md`, section 8): this `watch` is
    covered by the manual walkthrough below, consistent with this project's
    existing gap in component-level testing (no `@vue/test-utils`).
  - Done when: manually leaving a ship `IN_TRANSIT` and waiting for arrival
    (or docking manually) shows the arrival toast exactly once, while
    staying on `FleetDetailView`.

- [x] 4. **Update README for v2**
  - Drop "read-only" from the intro framing and the `Not included` bullets
    for "ship navigation or piloting" and "real-time notifications".
  - Add navigation/refuel/toast notifications to the `Features` list (Fleet
    detail entry) and mention `PrimeVue Toast` where the `Tech stack` section
    already lists PrimeVue.
  - Done when: README no longer contradicts current behavior; `npm run
format:check` passes on the file.

## Files / areas

- `src/main.ts` - register `ToastService`
- `src/App.vue` - mount `<Toast />`
- `src/plugins/primevue.ts` - add `toast` unstyled `pt` entry
- `src/features/fleet/views/FleetDetailView.vue` - mutation toasts, arrival
  watch, remove inline error banner
- `README.md` - v2 description update

Not touched: `src/features/fleet/composables/useShipNavigation.ts`,
`src/features/fleet/api/navigation*.ts`, `src/shared/api/http.ts`,
`src/shared/lib/error-message.ts`, `src/features/fleet/views/FleetView.vue`,
`src/features/dashboard/views/DashboardView.vue` (polling already done in
feature 23; no toast in scope there).

## Data / contracts

No new API calls, schemas, or stored state. Toast content is UI copy only:

| Trigger          | Severity | Life             | Summary           | Detail                                                                      |
| ---------------- | -------- | ---------------- | ----------------- | --------------------------------------------------------------------------- |
| Orbit success    | success  | 3000ms (default) | Ship in orbit     | `${symbol} is now in orbit.`                                                |
| Orbit error      | error    | 6000ms           | Orbit failed      | `getErrorMessage(error, 'Action failed. Check ship status and try again.')` |
| Dock success     | success  | 3000ms (default) | Ship docked       | `${symbol} is now docked.`                                                  |
| Dock error       | error    | 6000ms           | Dock failed       | same fallback as above                                                      |
| Navigate success | success  | 3000ms (default) | Ship departed     | `${symbol} is heading to ${waypointSymbol}.`                                |
| Navigate error   | error    | 6000ms           | Navigation failed | same fallback as above                                                      |
| Refuel success   | success  | 3000ms (default) | Refueled          | `${symbol}'s fuel tank is topped up.`                                       |
| Refuel error     | error    | 6000ms           | Refuel failed     | same fallback as above                                                      |
| Arrival          | success  | 3000ms (default) | Arrived           | `${symbol} arrived at ${waypointSymbol}.`                                   |

PrimeVue's unstyled `Toast`/`ToastMessage` already resolves a severity icon
internally (`Check`/`ExclamationTriangle`/`InfoCircle`/`Times`/`TimesCircle`
from `@primeicons/vue`) — no icon imports needed in application code, only
`pt` classes for `messageIcon`.

## Testing

- `npm run test:unit` - confirm `useShipNavigation.test.ts` is unaffected
  (no changes to the composable).
- No new unit tests: Toast plugin registration/styling is config, not logic
  (same "Tests: none" precedent as feature 3's PrimeVue `pt` setup); the
  mutation toast wiring and arrival `watch` are component-level UI glue that
  would need `@vue/test-utils` (not present in this project, same gap noted
  for the existing arrival-adjacent logic in feature 23's plan).
- Manual end-to-end walkthrough (`npm run dev`):
  1. Log in, open a docked ship's detail view.
  2. Trigger orbit → success toast appears, styled per the design system.
  3. From orbit, select a waypoint and navigate → success toast, ship enters
     `IN_TRANSIT`, polling updates ETA every 10s.
  4. Wait for arrival (or manually dock once `IN_ORBIT`) → arrival toast
     appears exactly once; dock success toast also appears for the dock
     action itself.
  5. Refuel while docked with fuel below capacity → success toast; refuel
     button hidden once fuel is full.
  6. Force an error path (e.g. throttle/disconnect network in devtools, then
     trigger an action) → error toast appears with 6s life, distinct styling
     from success.
  7. Confirm no toast fires if the user navigates away from
     `FleetDetailView` before a transiting ship arrives (leaves `/fleet` or
     `/`, returns after arrival — no arrival toast retroactively shown).

## Notes for the AI

- Keep `useShipNavigation.ts` untouched; pass `onSuccess`/`onError` directly
  to each `.mutate()` call in `FleetDetailView.vue` instead, so the
  composable's existing unit tests keep passing without modification.
- Reuse `getErrorMessage` for error toast `detail` text — do not add new
  per-action error copy in `error-message.ts`.
- Toast `pt` styling should reuse existing design tokens
  (`surface-0/1/2`, `line`, `fg`, `muted`, `accent`, `danger`, existing
  radius scale) — no new CSS variables.
- The inline `navigationError` computed and its template paragraph in
  `FleetDetailView.vue` are removed as part of step 2, not kept alongside
  the new toasts.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10522,"specSha256":"9fe68afda24383b5041600182aed1a933d99899247f812b51ed48db8a4ead97f","branch":"refs/heads/feature/real-time-notifications","head":"9254e2acded71045b23d137728b467adc6efa14e","baseRef":"refs/heads/main","baseCommit":"8ca9b6e59cdd58ef5c9e2fc78ca46cab69626724","sourceTree":"da5bb215429cd4f9a55769ea6995203edddce96c","absentOptional":[]} -->
