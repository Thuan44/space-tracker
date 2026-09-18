# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] unverified - Malformed JSON on a 2xx response bypasses the documented error-log/throw contract

**File:** src/shared/api/http.ts:31
**Found:** 2026-09-16 by /audit (scope: current; lens: security, quality)
**Why it matters:** The spec states any failed parse should `console.error` the detail then throw `new Error('Request failed')`. `fetchJson` calls `response.json()` directly on the success path with no `try/catch`. If a 2xx response body is not valid JSON, or the `fetch()` call itself rejects (network failure), the promise rejects with a raw `SyntaxError`/`TypeError` instead of the documented generic error, and nothing is logged. Callers built on top of this (TanStack Query, per the project overview) still surface an error state regardless of the rejection's shape, so no reachable user-facing defect exists today; this is a narrow divergence from the documented contract, not a confirmed break.
**Suggested fix:** Wrap `response.json()` (and optionally the `fetch()` call) in a try/catch that logs and rethrows the same `Error('Request failed')`, mirroring the existing Zod-parse branch. Low priority since SpaceTraders' documented API always returns valid JSON on a 2xx response.
**Resolution:**

### F-02 [P2] open - Token field does not opt out of browser spellcheck and autofill

**File:** src/features/auth/views/LoginView.vue:43
**Found:** 2026-09-16 by /audit (scope: current; lens: security)
**Why it matters:** The project overview treats the agent token as "as sensitive as a password" and deliberately keeps it out of `localStorage` so it never outlives the browser session. The token is entered into a plain `type="text"` input with no `spellcheck="false"`, `autocomplete`, `autocorrect`, or `autocapitalize` opt-out. Browser features that read ordinary text fields therefore see the full credential: Chrome's Enhanced Spellcheck and Edge's MS Editor transmit non-password field contents to remote servers, and password managers or autofill heuristics may offer to retain the value. `@submit.prevent` blocks the classic form-history path, so this is an exposure gap rather than a confirmed leak, but the mitigation is one line of markup and the spec's "no masking is specced" note is about the visual `type`, not about these attributes.
**Suggested fix:** Add `spellcheck="false"`, `autocomplete="off"` (or `autocomplete="one-time-code"`), `autocorrect="off"`, and `autocapitalize="off"` to the token input. This changes no behavior and keeps `type="text"` as the wireframe and spec require.
**Resolution:**

### F-03 [P3] open - Every submit failure is reported to the user as an invalid token

**File:** src/features/auth/views/LoginView.vue:26
**Found:** 2026-09-16 by /audit (scope: current; lens: quality)
**Why it matters:** `handleSubmit` catches every rejection from `getAgent` and renders "Invalid token. Please check and try again." `shared/api/http.ts` throws the same opaque `Error('Request failed')` for a 401, a 429 rate limit, a 5xx, a network failure, and a Zod contract mismatch. A player who is merely offline or rate limited (SpaceTraders rate limits aggressively) is told their valid token is wrong, and the natural reaction is to discard a working credential. The spec does prescribe this exact copy, so this is a spec-level wording decision rather than an implementation slip, and it is not a blocker.
**Suggested fix:** Either soften the copy to a genuinely generic "Could not verify that token. Please try again." or, when the shared client later distinguishes status codes, branch on 401 versus everything else. No behavior beyond the message text needs to change.
**Resolution:**

### F-04 [P3] open - Static route import creates a router/http circular module graph

**File:** src/router/index.ts:2
**Found:** 2026-09-16 by /audit (scope: current; lens: quality)
**Why it matters:** `router/index.ts` now statically imports `LoginView.vue`, which imports `features/auth/api/agent.ts`, which imports `shared/api/http.ts`, which imports `@/router` for the centralized 401 redirect. That closes a cycle. It is benign today because every use of the `router` binding sits inside a function body, so the live binding is initialized before it is read, and `type-check`, `test:unit`, and `vite build` all pass. It stays benign only by accident: one top-level `router.` reference in `http.ts`, or any future eager route module that touches the API client at module scope, turns it into a temporal-dead-zone `ReferenceError` at boot with no compile-time warning. Every later feature adds another route to this file.
**Suggested fix:** Register routes with a lazy component (`component: () => import('@/features/auth/views/LoginView.vue')`), the Vue Router default for view modules. That breaks the cycle and keeps the route table free of view-side imports. No current requirement is lost.
**Resolution:**

### F-05 [P3] open - LoginView.vue is not formatted with the project's Prettier config

**File:** src/features/auth/views/LoginView.vue:43
**Found:** 2026-09-16 by /audit (scope: current; lens: quality)
**Why it matters:** `npx prettier --check src/` reports `src/features/auth/views/LoginView.vue` as unformatted (the multi-attribute `<input>`, `<a>`, and `<button>` tags exceed the configured `printWidth: 100` and are wrapped by hand rather than by Prettier). `npm run format` is a declared project command, so the next person who runs it produces an unrelated diff on this file. ESLint will not catch it because `eslint-config-prettier` disables formatting rules, so nothing in CI guards this.
**Suggested fix:** Run `npm run format` and commit the result. `src/shared/api/http.ts` is also unformatted from an earlier feature and can be swept in the same pass.
**Resolution:**

### F-06 [P3] fixed - Vitest lint rules now apply to zero files

**File:** eslint.config.ts:26
**Found:** 2026-09-16 by /audit (scope: current; lens: tests)
**Why it matters:** The `@vitest/eslint-plugin` recommended block is scoped to `files: ['src/**/__tests__/*']`, but this project colocates tests as `src/**/*.test.ts` per the Testing standard. Deleting `src/__tests__/App.spec.ts` in this feature removed the last file that glob could ever match, so rules such as `vitest/no-focused-tests` and `vitest/no-disabled-tests` are now silently inactive across the whole suite. A stray `it.only` would ship green through lint and CI while quietly skipping the rest of a file. Same root cause as F-10 (the `tsconfig.vitest.json` project had the identical stale glob), just on the ESLint side instead of TypeScript's.
**Suggested fix:** Change the glob to `['src/**/*.test.ts']` (or add it alongside the existing entry) so the vitest ruleset covers the convention the project actually uses.
**Resolution:** Applied the suggested fix in `eslint.config.ts:26`. Verified with `eslint --print-config src/shared/api/http.test.ts` that 24 `vitest/*` rules now resolve for a colocated test file (previously 0), and `npx eslint .` still passes clean across the project.

### F-08 [P3] open - The 401 clear-decision and the credential-selection use different falsiness rules, so an empty-string override wipes an untested token

**File:** src/shared/api/http.ts:22
**Found:** 2026-09-16 by /audit (scope: current; lens: security, quality)
**Why it matters:** `fetchJson` picks the credential with `options?.token ?? tokenStore.token` (nullish), but decides whether the store's token was the one that failed with `!options?.token` (falsy). The two rules agree for every value except `''`. With `options.token === ''` the request carries no `Authorization` header at all, so the store's token is never sent, yet a 401 still takes the `!options?.token` branch and calls `tokenStore.logout()`, destroying a credential the server never rejected. Verified against the real module: the stubbed `fetch` received `{ headers: {} }` and `tokenStore.token` was `null` afterwards. Not reachable today - `LoginView.vue:23` is the only caller that passes an override, and the input carries `required`, so the browser blocks an empty submit before `handleSubmit` runs. It is a latent trap for the next caller rather than a live defect, which is why it is P3 and not higher.
**Suggested fix:** Decide from the credential that was actually used, not from the option's truthiness: hoist the existing `const token = options?.token ?? tokenStore.token` decision into a single flag (for example `const usedStoreToken = options?.token === undefined`) and branch the `logout()` on that. No new machinery, one expression changed; no current requirement is lost.
**Resolution:**

### F-09 [P2] open - The 401 recovery path has no in-repo regression test, because every test mocks the router away

**File:** src/shared/api/http.test.ts:7
**Found:** 2026-09-16 by /audit (scope: current; lens: tests)
**Why it matters:** `vi.mock('@/router')` replaces the router with a bare `push` spy for the whole suite, so no test in the project can observe what the real router does with that push. That is exactly why F-07, a P1 that made the app unrecoverable for a session with an invalidated token, shipped green through `test:unit` and `type-check` in the first place. The repair restores the behavior but not the ability to see it: the two new tests at `src/shared/api/http.test.ts:73` and `:84` assert store state only, and `src/router/guards.test.ts` calls the guard as a plain function with no router. Deleting the `tokenStore.logout()` line, or later adding a second `beforeEnter` that reads the store, reintroduces the same bounce with a fully green suite. The spec defers routing-redirect tests to v2 on the grounds that they "need component mounting", but that premise does not hold here: this review drove the real `router`, store, and http modules together with only `fetch` stubbed and no component mounted, and the whole file ran in 8ms.
**Suggested fix:** Add one focused test that imports the real `@/router` (no `vi.mock`) and asserts that a 401 on a store-token request settles `router.currentRoute.value.path` on `/login`. Keep it in its own file so the existing `http.test.ts` mock stays untouched. This is a test-only addition; the alternative is to accept the gap until feature 5 ships a logout control and feature 6 puts a real screen behind `/`, at which point the same pair becomes a visible bounce loop rather than a silent one.
**Resolution:**

### F-10 [P3] fixed - Vitest tsconfig project matched zero test files, so tests type-checked under the wrong (DOM-only) project

**File:** tsconfig.vitest.json:6
**Found:** 2026-09-18 by manual review (user-reported, outside /audit)
**Why it matters:** `tsconfig.vitest.json`'s `include` was scoped to `src/**/__tests__/*`, and `tsconfig.app.json` only excluded that same path. This project colocates tests as `src/**/*.test.ts` per the Testing standard - the `src/__tests__/` folder has not existed since the Vite scaffold's default `App.spec.ts` was removed early on (same root cause as F-06, on the TypeScript project-references side instead of ESLint's). So the vitest tsconfig project matched zero files, and every `*.test.ts` file was instead picked up and type-checked under the app project, using its DOM-only `lib`/`types` from `@vue/tsconfig/tsconfig.dom.json` rather than the vitest project's `"types": ["node", "jsdom"]`. `vue-tsc --build` (the `type-check` script) passed silently either way, so nothing failed CI, but the intended Node/jsdom-specific typing for tests was never actually exercised.
**Suggested fix:** Change `tsconfig.vitest.json`'s `include` to `["src/**/*.test.ts", "env.d.ts"]`, and add `"src/**/*.test.ts"` to `tsconfig.app.json`'s `exclude` alongside the now-dead `__tests__` entry, so each project matches the files it's meant to.
**Resolution:** Applied the suggested fix. Verified with `npx vue-tsc -p tsconfig.vitest.json --listFilesOnly` that all 11 colocated `*.test.ts` files are now included in the vitest project, and `npm run type-check` still passes clean after clearing the incremental `.tsbuildinfo` cache.
