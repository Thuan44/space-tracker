# Feature: Auth: login + token store

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/auth-login-token-store
**Status:** verified

## Goal

A player can enter their SpaceTraders agent token on `/login`, have it
validated against the live API, and land on the app with the token held in
client-side session state - the entry point every later authenticated screen
depends on.

## Design reference

`blueprint/reference/design/wireframes/wireframe_login.png` - title, token
input with placeholder, "Create an agent" link, primary submit button. Wireframe
colors are placeholders; use the real design tokens from `src/assets/main.css`
(dark surfaces, `accent` for the primary button, IBM Plex Mono) instead of the
wireframe's light theme.

## In scope

- Extend `src/stores/token.ts` (already a stub used by feature 2) into the
  real token store: `login(token)` / `logout()` actions, persisted to
  `sessionStorage`.
- Colocated `Agent` schema and a `getAgent` API call in `src/features/auth/api/`.
- `/login` view: token input, link to create an agent, submit button with a
  loading state, inline error on an invalid token.
- Registering the `/login` route and giving the app a real `<RouterView />`
  (currently `App.vue` is still the unmodified Vite scaffold, so nothing is
  reachable yet).
- Removing the stale scaffold test that asserts `App.vue`'s placeholder text.
- Redirecting away from `/login` to `/` when a token is already in the store
  (e.g. a direct visit or back-navigation after logging in), so an already
  authenticated session doesn't see the login form again.

## Out of scope

- Any route other than `/login` (dashboard, systems, fleet, markets, 404) -
  later features.
- The authenticated top nav / logout button - feature 5.
- Route guards that redirect an unauthenticated visitor away from a protected
  route - there are no protected routes to guard yet, and
  `specs-techniques.md` defers routing-redirect tests to v2 (needs component
  mounting).
- `useQuery` - the build plan calls this out explicitly as a one-shot direct
  API call, not a reactive per-screen resource.

## Build loop

Per `blueprint/config.json` (`workflow.stepReview: "every"`,
`workflow.checkpointCommits: "enabled"`): implement one build step, run the
checks named in its `Done when`, then stop for review. On approval, create a
checkpoint commit on this feature branch before starting the next step.
`/complete` creates the final feature commit.

## Build steps

- [x] 1. **Token store: persistence + login/logout actions**
   - Extend `src/stores/token.ts`: initialize `token` from
     `sessionStorage.getItem('token')`; add `login(token: string)` (sets the
     ref, writes `sessionStorage`) and `logout()` (clears the ref, removes the
     `sessionStorage` entry).
   - Add `src/stores/token.test.ts`: `login` sets the token and writes
     `sessionStorage`; `logout` clears the token and removes the
     `sessionStorage` entry; a store created with an existing `sessionStorage`
     value initializes from it.
   - Done when: `npm run test:unit` and `npm run type-check` pass.

- [x] 2. **Agent schema + API call**
   - Add `src/features/auth/api/agent.schema.ts`: `agentSchema` (`symbol`
     string 3-14 chars, `credits` int, `headquarters` non-empty string,
     `startingFaction` non-empty string, `shipCount` non-negative int) and
     `export type Agent = z.infer<typeof agentSchema>`.
   - Add `src/features/auth/api/agent.ts`: `getAgent(options?: RequestOptions)`
     calling `request('/my/agent', agentSchema, options)` from
     `shared/api/http.ts`.
   - Add `src/features/auth/api/agent.schema.test.ts`: a valid payload parses;
     a contract-breaking payload (e.g. `credits` as a string) fails
     `safeParse()`.
   - Done when: `npm run test:unit` and `npm run type-check` pass.

- [x] 3. **Login view and wiring**
   - Add `src/features/auth/views/LoginView.vue`: "Space Tracker" title,
     labeled token input, "Don't have a token? Create an agent" link to
     `https://my.spacetraders.io/login` (`target="_blank" rel="noopener"`),
     submit button.
     - On submit: call `getAgent({ token, skipAuthRedirect: true })` (the
       token isn't in the store yet, so it must be passed explicitly; the
       central 401 handler must not fire for this form's own validation
       failure). While pending, disable the input/button and show a loading
       label. On success, call the token store's `login(token)` then
       `router.push('/')`. On failure, show an inline error
       (`role="alert"`) below the input and re-enable the form; clear the
       error as soon as the user edits the input again.
     - Error handling is a local try/catch around the direct call, not
       TanStack Query state - this screen is the one documented exception in
       the build plan (a one-shot form action, not a `useQuery` resource).
   - Register the route in `src/router/index.ts`:
     `{ path: '/login', name: 'login', component: LoginView }`.
   - Replace `src/App.vue`'s scaffold markup with `<template><RouterView
     /></template>` (no script needed).
   - Delete `src/__tests__/App.spec.ts` (asserted the scaffold's "You did it!"
     placeholder, which no longer exists; `App.vue` has no logic left to
     test - per the Testing standard, UI components are verified by running
     the app, not a mount test).
   - Delete `src/stores/counter.ts` (unused Vite scaffold store, no
     references anywhere in `src/`; bundled here since this step already
     touches the scaffold).
   - Done when: `npm run test:unit` and `npm run type-check` pass; running
     `npm run dev` and visiting `/login` shows the form; submitting a valid
     token (checked against the live API) navigates to `/`; submitting an
     invalid token shows the inline error and stays on `/login`.

- [x] 4. **Redirect an already-authenticated visit away from `/login`**
   - Add `src/router/guards.ts`: `redirectIfAuthenticated()`, a route
     `beforeEnter`-shaped guard that reads `useTokenStore()` and returns `'/'`
     when a token is present, `undefined` otherwise. Colocated in its own file
     (rather than inline in `router/index.ts` or inside `LoginView.vue`) so it
     stays unit-testable as pure logic, without mounting a component or a full
     router harness.
   - Wire it as `beforeEnter: redirectIfAuthenticated` on the `/login` route
     in `src/router/index.ts`.
   - Add `src/router/guards.test.ts`: redirects to `/` when the store has a
     token; returns `undefined` (allows navigation) when it doesn't.
   - Done when: `npm run test:unit` and `npm run type-check` pass.

- [x] 5. **Fix: 401 handling no longer clears an invalidated token (F-07)**
   - Independent review found that step 4's guard treats "a token exists in
     the store" as "the session is authenticated." The existing 401 handler
     in `shared/api/http.ts` (feature 2) redirects to `/login` but never
     clears the now-invalid token from the store, so the guard immediately
     bounces the redirect back to `/` - a session with a revoked/wrong token
     could never reach the login form again.
   - Fix in `src/shared/api/http.ts`: on a 401, call `tokenStore.logout()`
     whenever the request used the store's token (`!options?.token`), before
     the existing redirect. An explicit `options.token` override (the login
     form's own validation call) means the store's token wasn't the one that
     failed, so it's left untouched.
   - Add two tests to `src/shared/api/http.test.ts`: a 401 using the store's
     token clears it (state + `sessionStorage`); a 401 with an explicit
     `options.token` override leaves the store's token untouched.
   - Done when: `npm run test:unit` and `npm run type-check` pass.

## Files / areas

- `src/stores/token.ts`, `src/stores/token.test.ts` (new)
- `src/features/auth/api/agent.schema.ts` (new), `agent.ts` (new),
  `agent.schema.test.ts` (new)
- `src/features/auth/views/LoginView.vue` (new)
- `src/router/index.ts`, `src/router/guards.ts` (new), `src/router/guards.test.ts` (new)
- `src/shared/api/http.ts`, `src/shared/api/http.test.ts` (step 5 only, see
  Notes for the AI)
- `src/App.vue`
- `src/__tests__/App.spec.ts` (deleted)
- `src/stores/counter.ts` (deleted)
- `index.html` (page title, only)

`src/features/` is a new top-level folder; it follows the domain-based
structure already named in the project overview and used by
`src/shared/api/http.ts` (feature 2), not the generic `src/views` /
`src/components/[feature]` paths in `coding-standards.md`'s File Organization
section (unused by any feature so far).

## Data / contracts

`Agent` (`GET /my/agent`), colocated in `features/auth/api/agent.schema.ts`
per `specs-techniques.md`:

```ts
export const agentSchema = z.object({
  symbol: z.string().min(3).max(14),
  credits: z.number().int(),
  headquarters: z.string().min(1),
  startingFaction: z.string().min(1),
  shipCount: z.number().int().nonnegative(),
})
```

Token store shape: `{ token: Ref<string | null>, login(token: string): void,
logout(): void }`, persisted to `sessionStorage` under the key `token`. This
is the same store `shared/api/http.ts` already reads (`options.token`
override, centralized 401 handling) and that the CI/CD, shared API client, and
design system features already assume exists.

## Testing

- `src/stores/token.test.ts` - `login` stores the token (state +
  `sessionStorage`), `logout` clears both, initial state picks up an existing
  `sessionStorage` value.
- `src/features/auth/api/agent.schema.test.ts` - `agentSchema` valid case +
  one contract-breaking case via `safeParse()`.
- `src/router/guards.test.ts` - `redirectIfAuthenticated` redirects when a
  token is present, allows navigation when it isn't.
- No new component-mounting test for `LoginView.vue` - per the Testing
  standard's scope rule, UI components are verified by running the app, not
  brittle unit tests; the existing `App.spec.ts` scaffold test is removed
  rather than rewritten for the same reason.

## Notes for the AI

- `shared/api/http.ts` already implements the `options.token` override and
  `options.skipAuthRedirect` this feature depends on (built in feature 2).
  Steps 1-4 must not modify it. Step 5 is the one authorized, narrowly-scoped
  exception: a one-line fix to its 401 handler, made necessary by step 4's
  guard and confirmed by independent review (finding F-07) - do not use it
  as license for broader changes to that file.
- The token input is a plain `type="text"` field, matching the wireframe
  literally; no masking is specced.
- After a successful login there is nothing at `/` yet (Dashboard is feature
  6) - `router.push('/')` will render a blank `RouterView` until that feature
  lands. This is expected incremental build state, not a bug to work around.
- Keep the login error message generic (e.g. "Invalid token. Please check and
  try again.") - the API's failure reason isn't surfaced to the user beyond
  that, consistent with the "erreur (retry)"-style handling used elsewhere.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11036,"specSha256":"465a0c5d6e2d6a53c1dc621f9a7eef6a9a5c09f7dfe349658fb02e9c5c58cd42","branch":"refs/heads/feature/auth-login-token-store","head":"9b744edccd151c80b691bad3db7c04b82ab678d1","baseRef":"refs/heads/main","baseCommit":"8b9f685af5128d4b182fca4887ffd6e744d9514a","sourceTree":"b22a5a1cba4480becddac9f06d2a3631f9e37806","absentOptional":[]} -->

## Findings

### 4/F-07 [P1] closed - The new `/login` guard cancels the app's centralized 401 recovery, stranding a stored-but-invalid token

**File:** src/router/guards.ts:5
**Found:** 2026-09-16 by /audit (scope: current; lens: security, quality)
**Why it matters:** `redirectIfAuthenticated` treats "a token exists in the store" as "this session is authenticated", but the app's own shared client exists because those two are not the same thing: `src/shared/api/http.ts:23` answers a 401 by calling `router.push('/login')`, the centralized recovery the project overview documents for feature 2 ("centralized 401 -> `/login` redirect"). A 401 can only be raised for a request that actually carried a token, so every 401 redirect now arrives at `/login` with `tokenStore.token` set, `beforeEnter` returns `'/'`, and the navigation lands back on `/`. Verified against the installed vue-router 5.3.1 with this exact route table and guard: `push('/login')` with a token present resolves on `/`, never on `/login`. The unit suite does not catch it because `src/shared/api/http.test.ts:64` asserts the redirect against a mocked `router.push`, so the contract passes in isolation while the real router reverses it. User-visible today without any later feature: a player who saved a token that is wrong, revoked, or simply belongs to an agent they want to switch away from cannot get back to the form to replace it, since there is no logout control until feature 5, and the only escape is clearing `sessionStorage` from DevTools. Once feature 6 puts an authenticated screen at `/`, the same pair becomes a bounce loop: the screen 401s, pushes `/login`, the guard sends it straight back to `/`.
**Suggested fix:** Make an authentication failure clear the credential it just invalidated: call the token store's existing `logout()` in the 401 branch of `src/shared/api/http.ts` before `router.push('/login')`. The guard then sees no token and lets the form render, and no new machinery is needed. This touches a file the spec's "Notes for the AI" tells the builder not to modify and changes shipped feature 2 behavior, so it needs an explicit user decision rather than an automatic repair. The alternative decisions are to accept the gap until feature 5 ships a logout control, or to drop the `beforeEnter` wiring and keep only the post-login `router.push('/')`, which would lose the specced "an already authenticated session doesn't see the login form again" behavior.
**Resolution:** User approved the suggested fix. `src/shared/api/http.ts`'s 401 branch now calls `tokenStore.logout()` before redirecting, but only when the request used the store's token (`!options?.token`) rather than an explicit override - so the login form's own validation 401 (which always passes an explicit `options.token`) does not touch the store. Two tests added to `src/shared/api/http.test.ts` covering both branches (store token cleared on 401; override token leaves the store untouched). `npm run test:unit` and `npm run type-check` pass. Not yet re-reviewed - stays `fixed` until a review pass confirms it and moves it to `closed`.
Closed 2026-09-16 by independent review (pass 3, target `9b744ed`). Verified directly, not from the diff: an out-of-tree Vitest file was run against the real `src/router/index.ts` (real route table, real `beforeEnter`), the real `src/stores/token.ts`, and the real `src/shared/api/http.ts`, with only `fetch` stubbed and no mock on `@/router`. Results: (a) with a token in the store, a 401 on a store-token request leaves `tokenStore.token` null, removes the `sessionStorage` entry, and the router settles on `/login` - the loop is closed end to end; (b) the same navigation with the token left in place still resolves on `/`, reproducing the original defect and confirming the guard was its cause; (c) a `beforeEach` probe recorded the token the guard observed during the 401-triggered navigation as `null`, proving `logout()` is synchronous and strictly precedes `router.push`, so there is no ordering or race window; (d) the guard re-reads the store on every navigation attempt (allow, then redirect after `login()`, then allow again after `logout()`), so no decision is cached; (e) a 401 carrying an explicit `options.token` override leaves an existing stored token and its `sessionStorage` entry untouched. The original defect is gone and the repair is correctly scoped. One unrelated latent inconsistency in the same branch is recorded separately as F-08, and the missing regression coverage as F-09; neither keeps this finding open.

## Independent review

**Status:** passed
**Target commit:** 9b744edccd151c80b691bad3db7c04b82ab678d1
**Base commit:** 8b9f685af5128d4b182fca4887ffd6e744d9514a
**Base ref:** main
**Spec hash:** 465a0c5d6e2d6a53c1dc621f9a7eef6a9a5c09f7dfe349658fb02e9c5c58cd42
**Prepared by:** claude
**Builder model:** claude-sonnet-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5
**Requested execution:** automatic
**Requested at:** 2026-09-16T20:00:24Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-16T20:06:41Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD` / `git merge-base main HEAD` / `shasum -a 256 blueprint/context/current-feature.md` / `git status --porcelain`: pass (target, base, spec hash all match; tree clean except the two evidence files)
- `npm run type-check`: pass
- `npx vitest run`: pass (4 files, 23 tests)
- `npm run build`: pass
- `npx prettier --check src/`: fail (2 files: `src/features/auth/views/LoginView.vue`, `src/shared/api/http.ts`)
- out-of-tree Vitest trace against the real router/store/http modules (scratchpad config, no project files added): pass (6 tests)
- `npm run lint`: unavailable (both `lint:oxlint` and `lint:eslint` run with `--fix` and would rewrite the reviewed checkpoint)

## Evidence

- Delta reviewed: `8b9f685..9b744ed`, 4 commits, 15 source/markup files plus the 3 blueprint context files (excluded from the code scope).
- F-07 repair traced against the real modules, not the diff: with `@/router` unmocked and only `fetch` stubbed, a 401 on a store-token request clears `tokenStore.token` and the `sessionStorage` entry and settles the router on `/login`.
- Same harness reproduced the pre-fix defect (token left in place, `push('/login')` resolves on `/`), confirming the guard was the cause and the repair is what removes it.
- A `beforeEach` probe recorded `null` as the token visible to the guard during the 401-triggered navigation: `logout()` is synchronous and strictly precedes `router.push`, so there is no ordering or race window.
- Guard re-reads the store on every navigation attempt (allow, redirect after `login()`, allow again after `logout()`); no decision is cached.
- A 401 carrying an explicit `options.token` override leaves an existing stored token and its `sessionStorage` entry untouched.
- Credential handling swept: no `v-html`, `innerHTML`, or `eval` in `src/`; no `localStorage`; the token travels only in the `Authorization` header, never in a URL or query string; no `console.*` call receives the token, and the 401 branch logs nothing at all.
- `src/features/auth/views/LoginView.vue:23` is the only caller that passes an override, and its input carries `required`, which bounds the reachability of F-08.
- Prettier gap on `src/shared/api/http.ts` isolated to the pre-existing `console.error` call at line 29; the F-07 fix lines are themselves format-clean (`git show <base>:src/shared/api/http.ts` also fails `prettier --check`).
- Performance lens: one-shot `fetch` per submit, no loops, no repeated or unbounded work, no rendering hot path. No findings.

## Findings

- F-07 [P1] closed (verified this pass; original defect gone, repair introduces no new defect)
- F-08 [P3] open (new): 401 clear-decision uses `!options?.token` while credential selection uses `??`, diverging on an empty-string override
- F-09 [P2] open (new): the 401 recovery path has no in-repo regression test because every test mocks the router away
- F-02 [P2], F-03 [P3], F-04 [P3], F-05 [P3], F-06 [P3] carried forward unchanged and re-confirmed as non-blocking at their recorded severities
- F-01 [P3] unverified, pre-existing from an earlier feature, untouched

## Remaining risk

- `npm run lint` could not be run: both sub-commands use `--fix` and would have rewritten the checkpoint under review. Lint-only defects in this delta are therefore unverified, and F-06 records that the vitest ruleset currently matches zero files regardless.
- No `Browser tests` command is declared, so the `/login` form's real browser behavior (submit, loading state, inline error, focus, autofill) rests on the builder's manual evidence, not on an automated run.
- No combined `Verify` command and no automatic GitHub checks exist yet, so nothing enforces this set of commands on a future change.
- `npx prettier --check src/` fails on two files (F-05); `npm run format` is a declared command, so the next person to run it produces an unrelated diff.
- Narrow, currently unreachable race: a stale in-flight request that 401s after the user has already logged in again would clear the newly stored token, because the 401 branch cannot tell which session its credential belonged to. Not reachable today - the login form's own call uses an override and no other authenticated screen exists until feature 6 - but worth re-checking when the dashboard lands.
- F-08 and F-09 remain open by design at P3/P2; neither blocks `/complete`.
