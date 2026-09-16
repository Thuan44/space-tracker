# Feature: Shared API client

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/shared-api-client

## Goal

A single HTTP client every future feature calls instead of raw `fetch`:
validates every response with Zod, injects the `Authorization` header from the
token store (or an explicit override), redirects to `/login` on `401` unless
told not to, and handles SpaceTraders' list-pagination envelope once instead
of per screen.

## In scope

- `request<T>(url, schema, options?)` - single-resource GET, unwraps
  SpaceTraders' `{ data }` envelope, validates with the given Zod schema.
- `requestPage<T>(url, itemSchema, options?)` - paginated-list GET, unwraps
  `{ data, meta }`, validates the array and the pagination meta.
- Automatic `Authorization: Bearer <token>` injection from a token store,
  overridable per call via `options.token`.
- Centralized `401` handling: redirect to `/login`, skippable via
  `options.skipAuthRedirect`.
- `console.error`-then-throw-generic-error on any non-ok response or failed
  Zod parse (no new UI error state - callers already plan an "error (retry)"
  state per screen).
- `VITE_API_BASE_URL` read from a Vite env var, with `.env.example`.
- A minimal Pinia token store holding just the token value, so the client has
  something to read from (see Notes for the AI).

## Out of scope

- Login form, token validation call, `sessionStorage` persistence, and the
  store's `login`/`logout` actions - all feature 4 (Auth).
- Any domain Zod schema (`Agent`, `System`, `Ship`, `Market`) - colocated with
  the feature that introduces it.
- Any write/mutation support (`POST`/`PUT`/`PATCH`/`DELETE`) - every planned
  screen only reads data; the app has no mutation feature planned.
- Retry/backoff, request cancellation, response caching - TanStack Query
  (feature 6+) owns caching; nothing here needs the rest.

## Build loop

Each step below is implemented, then stops for review before the next one
starts (`workflow.stepReview: every`). An approved step gets a checkpoint
commit on `feature/shared-api-client` (`workflow.checkpointCommits: enabled`).
`/complete` creates the final feature commit once every step is approved.

## Build steps

- [x] 1. Wire the `VITE_API_BASE_URL` env var: add `.env.example` with
      `VITE_API_BASE_URL=https://api.spacetraders.io/v2`, and extend
      `env.d.ts` with a typed `ImportMetaEnv`/`ImportMeta` augmentation so
      `import.meta.env.VITE_API_BASE_URL` is a typed `string`, not `any`.
      **Done when:** `.env.example` exists, `npm run type-check` passes.
- [x] 2. Add a minimal token store (`src/stores/token.ts`): a Pinia store
      exposing a single `token` ref, initialized to `null`. No actions, no
      persistence yet - feature 4 adds `login`/`logout` and `sessionStorage`
      persistence on this same store.
      **Done when:** the store is importable and `npm run type-check` passes.
- [x] 3. Add `src/shared/api/http.ts` with `request<T>(url, schema, options?)`:
      builds the full URL from `VITE_API_BASE_URL` + `url`, sends a `GET`,
      attaches `Authorization: Bearer <token>` when `options.token` or the
      token store has a token (the option wins), unwraps the response's
      `{ data }` envelope, and `schema.safeParse()`s the payload. On a `401`
      response, calls `router.push('/login')` unless `options.skipAuthRedirect`
      is true, then throws. On any other non-ok response or a failed parse,
      `console.error`s the detail (status + body, or `result.error.format()`)
      then throws `new Error('Request failed')`. On success, returns the
      parsed, typed data. Add `src/shared/api/http.test.ts` with a
      hand-mocked `global.fetch` (not `vi.mock()`) and a mocked `@/router`,
      covering: store-token injection, `options.token` override, no-token
      case, `401` redirect, `401` with `skipAuthRedirect` (no redirect),
      successful parse, failed parse (asserts the `console.error` call and
      the thrown error).
      **Done when:** `npm run test:unit` and `npm run type-check` pass.
- [x] 4. Extend `src/shared/api/http.ts` with
      `requestPage<T>(url, itemSchema, options?)`: same auth/error handling
      as `request` (share the internal fetch/auth/error-handling logic
      rather than duplicating it), appends `page`/`limit` query params to
      `url` only when passed in `options`, unwraps `{ data, meta }`, and
      validates `data` as `z.array(itemSchema)` and `meta` as
      `{ total: number; page: number; limit: number }`. Add matching cases to
      `http.test.ts`: query-param construction (present/omitted), array +
      meta validation, and that the shared 401/error handling still applies.
      **Done when:** `npm run test:unit` and `npm run type-check` pass.

## Files / areas

- `.env.example` - new
- `env.d.ts` - edit (typed `ImportMetaEnv`)
- `src/stores/token.ts` - new
- `src/shared/api/http.ts` - new
- `src/shared/api/http.test.ts` - new

## Data / contracts

- SpaceTraders envelope (per the official SpaceTraders v2 API, not this
  project's invention): every response wraps its payload in `{ data }`; list
  endpoints additionally return `meta: { total, page, limit }` alongside
  `data` as an array.
- `request<T>(url: string, schema: ZodType<T>, options?: { token?: string; skipAuthRedirect?: boolean }): Promise<T>`
- `requestPage<T>(url: string, itemSchema: ZodType<T>, options?: { token?: string; skipAuthRedirect?: boolean; page?: number; limit?: number }): Promise<{ data: T[]; meta: { total: number; page: number; limit: number } }>`
- Both throw `new Error('Request failed')` on a non-ok response or a failed
  Zod parse, after `console.error`-ing the detail. The token, wherever it
  comes from, is never logged.
- `src/stores/token.ts` (this feature): `useTokenStore` exposes `token: Ref<string | null>`, starts `null`. Feature 4 adds `login(token)` / `logout()` actions and `sessionStorage` persistence to this same store.
- `.env.example`: `VITE_API_BASE_URL=https://api.spacetraders.io/v2`.

## Testing

- `src/shared/api/http.test.ts` (Vitest): all cases listed in build steps 3
  and 4, `global.fetch` hand-mocked per call (not `vi.mock()`, which would
  bypass the fetch layer under test), `@/router` mocked with `vi.mock()` to
  assert `push('/login')` is/isn't called.
- No test for `src/stores/token.ts` in this feature - a single state ref with
  no actions has no logic to assert; feature 4's `login`/`logout` actions get
  the test.

## Notes for the AI

- **Token store split across features 2 and 4 is intentional.** The client's
  Authorization injection needs a store to read from *now*, but Auth (#4) is
  the feature that defines login/logout/persistence. Feature 2 creates only
  the bare `token` ref so the import is real and the project stays
  type-checked and working; feature 4 extends the same file. This mirrors
  the `Ship` schema's already-established incremental-build pattern (6 → 10
  → 11) elsewhere in this build plan.
- **`shared/` lives under `src/`** (`src/shared/api/http.ts`, imported as
  `@/shared/api/http`), matching every other source folder in this project
  (`src/stores`, `src/router`, ...) and the existing `@/*` -> `./src/*` path
  alias. The build-plan's `shared/api/http.ts` notation is relative to `src/`.
  This is a reversible file-layout detail, not a product decision.
- `request`/`requestPage` are `GET`-only by design: this is a read-only
  control panel (per the project overview's Usage model) and no planned
  feature performs a write. Do not add `method`/`body` options speculatively.
- Pagination query param names (`page`, `limit`) and the `{ data, meta }`
  envelope shape are SpaceTraders' real, documented API contract
  (https://spacetraders.io/openapi), not a guess - safe to rely on exactly as
  specified above.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7810,"specSha256":"66e7f276b6109a26a1f58815bc9759c2c2fdb81f07ee4338b2e3dce68d5fcde6","branch":"refs/heads/feature/shared-api-client","head":"3189bf0db048043c3a9981f3fef6fe3bd4cb59a2","baseRef":"refs/heads/main","baseCommit":"71fee8cb6a78337eaa96de4c6ba6098069dd26c0","sourceTree":"da334f4049fe5cc7e70c7229326499fc3507df82","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 3189bf0db048043c3a9981f3fef6fe3bd4cb59a2
**Base commit:** 71fee8cb6a78337eaa96de4c6ba6098069dd26c0
**Base ref:** main
**Spec hash:** 66e7f276b6109a26a1f58815bc9759c2c2fdb81f07ee4338b2e3dce68d5fcde6
**Prepared by:** claude
**Builder model:** claude-sonnet-5
**Requested reviewer:** claude
**Requested model:** claude-sonnet-5
**Requested execution:** automatic
**Requested at:** 2026-09-16T14:56:15Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-sonnet-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-16T14:59:49Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `npm run type-check`: pass
- `npm run test:unit -- --run`: pass (2 files, 14 tests)
- `npm run build`: pass

### Evidence

- Full `71fee8cb6..3189bf0db` delta reviewed: `.env.example`, `env.d.ts`,
  `src/stores/token.ts`, `src/shared/api/http.ts`, `src/shared/api/http.test.ts`,
  and `blueprint/context/current-feature.md` (spec).
- `src/shared/api/http.ts` implements `request<T>`/`requestPage<T>` sharing one
  internal `fetchJson` for auth-header injection, 401-redirect, and
  error-log-then-throw, matching the approved spec's contract and function
  signatures.
- Authorization header is only attached when a token is present (option
  override wins over the store), and the token itself is never passed to
  `console.error` in either failure branch (confirmed by reading both log call
  sites) - matches the project overview's "token never logged" mitigation.
- `src/shared/api/http.test.ts` hand-mocks `global.fetch` per test (not
  `vi.mock()`) and mocks `@/router` with `vi.mock()`, covering store-token
  injection, `options.token` override, no-token, 401 redirect,
  `skipAuthRedirect`, successful parse, failed Zod parse, non-401 error,
  query-param construction (present/omitted), and paginated array/meta
  validation - matching every case named in build steps 3 and 4.
- `src/stores/token.ts` matches the spec exactly: a single `token` ref
  starting `null`, no actions, no persistence (correctly deferred to feature
  4 per the spec's Notes).
- `.env.example` and `env.d.ts` match the spec's exact env-var name and typed
  `ImportMetaEnv`/`ImportMeta` augmentation.
- No tracked/staged/unstaged/untracked path differed from `Target commit`
  except `blueprint/context/review.md` and `blueprint/context/findings.md`.

### Findings

- F-01 (P3, unverified) - malformed-JSON-on-2xx / network-rejection edge case
  bypasses the documented log-then-throw pattern in `fetchJson`
  (`src/shared/api/http.ts:31`). Narrow edge case, no confirmed reachable
  defect (TanStack Query surfaces an error state regardless of rejection
  shape); does not block this receipt. Remains open in the live findings
  ledger (`unverified`), not archived here.

### Remaining risk

- No dependency/security scanner (e.g. `npm audit`) was run as part of this
  pass; not declared as a lens-relevant local command for `current` scope.
- Malformed-JSON/network-rejection edge case tracked as F-01; unverified, low
  impact, does not block.
