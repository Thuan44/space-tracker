# Feature: Typed ApiError + QueryClient configuration

**From build-plan:** feature 20
**Build attempt:** 1
**Status:** verified
**Branch:** feature/typed-apierror-queryclient-configuration

## Goal

Replace `http.ts`'s single generic `throw new Error('Request failed')` with a
typed `ApiError` (`kind`: `auth` / `not-found` / `rate-limit` / `client` /
`server` / `network` / `invalid-response`), move the 401 → logout/redirect
behavior out of `http.ts` and into a configured `QueryClient`'s `QueryCache`,
and give the login form a real per-failure message instead of a hardcoded
"Invalid token". Closes findings F-01 (malformed JSON on a 2xx bypasses the
error contract), F-03 (every login failure reads as "invalid token", even
offline), and F-08 (401 clear-decision and credential-selection use different
falsiness rules).

## In scope

- `src/shared/api/api-error.ts`: `ApiError extends Error` with `status: number
  | null`, `kind`, optional `retryAfterMs`.
- `src/shared/api/http.ts`: map every failure path (rejected `fetch`, non-ok
  status, invalid JSON on a 2xx, failed Zod parse) onto `ApiError`; drop its
  `@/router` and `tokenStore.logout()` coupling and the `skipAuthRedirect`
  option.
- `src/plugins/vue-query.ts`: `shouldRetry`, `retryDelay` (exponential
  backoff, respects `retryAfterMs`), a `QueryCache` that logs out and
  redirects to `/login` on an `auth`-kind error, and the exported
  `queryClient`; wired into `main.ts`.
- `src/shared/lib/error-message.ts`: `getErrorMessage(error, fallback)` for
  per-kind UI text.
- `LoginView.vue` uses `getErrorMessage` instead of one hardcoded string.
- Closing F-01, F-03, F-08 in `blueprint/context/findings.md`.
- Updating the README's Architecture paragraph describing the 401 path.

## Out of scope

- Per-view differentiated error display (`QueryErrorBanner`, "System not
  found" without a Retry button, etc.) — build-plan #22 (post-release step 7).
- `staleTime`, cache purge on logout, query-key factories, `keepPreviousData`
  — build-plan #21 (post-release step 6).
- Any mutation (`orbit`/`dock`) — out of MVP scope per the project overview
  (read-only app), deferred to v2 (build-plan #27).

## Build loop

Config: `workflow.stepReview: "every"`, `workflow.checkpointCommits:
"enabled"`. Each step below pauses for review before the next starts; an
approved step gets its own checkpoint commit. `/complete` creates the final
feature commit and merge.

No combined `Verify` command exists yet (`/ci` not run). Each step's "Done
when" runs `npm run type-check` and `npm run test:unit` directly.

## Build steps

- [x] 1. **Typed `ApiError` in `http.ts`**
  - Add `src/shared/api/api-error.ts` (`ApiError`, `kind`, `status`,
    optional `retryAfterMs`).
  - In `http.ts`'s `fetchJson`: wrap `fetch()` in try/catch → `ApiError`
    kind `network`; on a non-ok response map status → kind (401 `auth`, 404
    `not-found`, 429 `rate-limit` — read `retryAfterMs` from the
    `Retry-After` header when present — other 4xx `client`, 5xx `server`);
    a 2xx whose `response.json()` rejects → `invalid-response`. In `request`
    and `requestPage`, a failed `safeParse` → `invalid-response` (keep the
    existing `console.error(result.error.format())`).
  - Remove the `@/router` import, the `router.push('/login')` call, the
    `tokenStore.logout()` call on 401, and the `skipAuthRedirect` field from
    `RequestOptions` — this behavior moves to the `QueryCache` in step 2.
    Keep the existing `useTokenStore()` lookup that reads the token for the
    `Authorization` header; only the logout side-effect moves. Removing
    `skipAuthRedirect` is safe, not a behavior loss: its only caller,
    `LoginView`, calls `getAgent()` directly rather than through `useQuery`
    (step 3 keeps it that way), so it never reaches the `QueryCache` and
    never needed an opt-out in the first place once the redirect lives
    there. The paired `!options?.token` logout guard — the exact falsiness
    bug in F-08 — disappears the same way: it only ever protected this same
    direct login call, so dropping it (instead of patching its `??`/`!`
    mismatch) closes F-08 outright rather than papering over it.
  - Rewrite `http.test.ts`: drop the `@/router` mock and its assertions;
    assert `rejects.toMatchObject({ kind, status })` for 401/404/429/500,
    plus new cases for a rejected `fetch()` (`network`) and invalid JSON on
    a 2xx (`invalid-response`); the existing Zod-failure case now asserts
    `kind: 'invalid-response'` instead of a bare message.
  - Delete `http.router.test.ts`. Its one test (a raw `request()` call
    redirecting via the real router) tests behavior `http.ts` no longer
    performs; step 2 reintroduces the equivalent real-redirect coverage
    against the new `QueryCache` path instead.
  - Done when: `npm run type-check` and `npm run test:unit` pass; `http.ts`
    no longer imports `@/router` or references `useTokenStore().logout`.

- [x] 2. **`src/plugins/vue-query.ts`, wired into `main.ts`**
  - Pure `shouldRetry(failureCount, error)`: retry only `ApiError`s with
    kind `network`, `server`, or `rate-limit`, up to 3 attempts total; never
    retry `auth`, `not-found`, `client`, `invalid-response`, or a
    non-`ApiError`.
  - `retryDelay(failureCount, error)`: exponential backoff; when `error` is
    a `rate-limit` `ApiError` with `retryAfterMs` set, use that instead.
  - `queryClient`: `new QueryClient({ defaultOptions: { queries: { retry:
    shouldRetry, retryDelay } }, queryCache: new QueryCache({ onError }) })`.
    `onError` calls `useTokenStore()` (resolved inside the handler, not at
    module load) and, only when the error is an `ApiError` with `kind ===
    'auth'`, calls `logout()` then `router.push('/login')`.
  - `main.ts`: `app.use(VueQueryPlugin, { queryClient })`, replacing the
    bare `app.use(VueQueryPlugin)`.
  - New `vue-query.test.ts`: a case per `kind` for `shouldRetry` (including
    the `failureCount` boundary and a non-`ApiError` input), plus the
    real-redirect coverage removed in step 1 — a real `useQuery` that
    receives a 401 ends up on `/login` with the token store cleared, driven
    through this `queryClient`, not through `http.ts`.
  - Done when: `npm run type-check` and `npm run test:unit` pass; manually
    confirm that hitting an authenticated screen with an invalid token still
    lands on `/login`.

- [x] 3. **`getErrorMessage`, used by `LoginView`**
  - Add `src/shared/lib/error-message.ts`: `getErrorMessage(error: unknown,
    fallback: string): string` — fixed English text for kind `auth`
    ("Invalid token. Please check and try again."), `network` ("Could not
    reach the API. Check your connection and try again."), `rate-limit`
    ("Too many requests. Wait a moment and try again."), `not-found` ("Not
    found."); every other kind and any non-`ApiError` input returns
    `fallback`.
  - `error-message.test.ts`: one case per kind above, plus a non-`ApiError`
    input falling back.
  - `LoginView.vue`: drop `skipAuthRedirect` from the `getAgent({ token:
    tokenInput.value })` call (the option no longer exists); its catch
    block sets `error.value = getErrorMessage(err, 'Invalid token. Please
    check and try again.')`.
  - Done when: `npm run type-check` and `npm run test:unit` pass; manually
    submit an invalid token (still shows the invalid-token message) and
    simulate a network failure (offline, or a bad `VITE_API_BASE_URL`) to
    confirm the network message shows instead.

- [x] 4. **Close findings, update the README**
  - In `blueprint/context/findings.md`, mark F-01, F-03, and F-08 closed.
  - In README's "Architecture" section, replace the paragraph describing
    `http.ts` as the 401 → logout/redirect choke point: the choke point is
    now the `QueryCache`'s `onError` (`src/plugins/vue-query.ts`); mention
    `ApiError`'s `kind` discriminant and `getErrorMessage`.
  - Done when: `npm run type-check` and `npm run test:unit` pass; the
    findings and README changes are the only diff in this step.

## Files / areas

- `src/shared/api/api-error.ts` (new)
- `src/shared/api/http.ts`, `http.test.ts` (refactor)
- `src/shared/api/http.router.test.ts` (deleted; superseded by
  `vue-query.test.ts`)
- `src/plugins/vue-query.ts`, `vue-query.test.ts` (new)
- `src/main.ts` (wire `queryClient`)
- `src/shared/lib/error-message.ts`, `error-message.test.ts` (new)
- `src/features/auth/views/LoginView.vue` (update)
- `blueprint/context/findings.md`, `README.md` (doc updates, step 4)

## Data / contracts

- `ApiError.kind`: `'auth' | 'not-found' | 'rate-limit' | 'client' | 'server'
  | 'network' | 'invalid-response'`. `status` is the HTTP status when one
  exists, else `null` (network failure, invalid JSON, Zod failure all carry
  `status: null`). `retryAfterMs` is set only for a `rate-limit` error whose
  response carried a parseable `Retry-After` header (seconds → ms); absent
  otherwise.
- `RequestOptions` loses `skipAuthRedirect`; `token` is unchanged.
- `getErrorMessage(error, fallback)` returns a `string`; never throws.

## Testing

- `http.test.ts`: status → `kind`/`status` mapping (401/404/429/500),
  rejected `fetch` → `network`, invalid JSON on 2xx → `invalid-response`,
  failed Zod parse → `invalid-response` (both `request` and `requestPage`).
- `vue-query.test.ts`: `shouldRetry` table (each kind, attempt-count
  boundary, non-`ApiError`); real `useQuery` + 401 → `/login` + cleared
  token, via the `QueryCache`.
- `error-message.test.ts`: one case per mapped kind, plus a fallback case.
- No new component test for `LoginView.vue` per the project's testing scope
  rule (UI components are verified manually/by screenshot, not unit-tested);
  covered by the manual check in step 3's "Done when".

## Notes for the AI

- `fetchJson` in `http.ts` is the single place that turns a `Response`/thrown
  value into an `ApiError`; both `request` and `requestPage` call it, so the
  status-mapping logic is written once.
- Between step 1 and step 2, a real 401 briefly does not redirect anywhere
  (the old coupling is removed in step 1, the replacement lands in step 2).
  This is expected on a feature branch reviewed step by step; nothing merges
  to `main` until `/complete` after all steps pass.
- Keep `useTokenStore()` calls inside functions (not at module scope) in both
  `http.ts` and `vue-query.ts` — Pinia's store must be created after the app
  instance exists.
- Do not add per-view error-message rendering (e.g. showing `getErrorMessage`
  in `SystemDetailView` or `MarketView`) — every existing `isError` banner
  keeps its current static text until build-plan #22 (`QueryErrorBanner`).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10703,"specSha256":"f0d0dfc340f2667af0e4fc283fe4555e52d09dba78994778511099b275b61cb7","branch":"refs/heads/feature/typed-apierror-queryclient-configuration","head":"2165c696a02af54ce027b142cef8caeaf7f17940","baseRef":"refs/heads/post-release-improvement","baseCommit":"57d62047b05be55cdc5b9d55b10f519d1c055228","sourceTree":"50086dc8429b0ca8544b0475e29edcbb54687c1d","absentOptional":[]} -->
