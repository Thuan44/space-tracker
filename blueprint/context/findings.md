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

_No other findings recorded. `/audit` appends findings here when it finds them._
