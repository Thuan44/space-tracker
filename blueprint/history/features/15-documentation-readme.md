# Feature: Documentation (README)

**From build-plan:** feature 15
**Build attempt:** 1
**Branch:** feature/documentation-readme
**Status:** verified

## Goal

Replace the default Vite scaffold `README.md` with real project documentation:
what Space Tracker is, how to set it up and run it locally, and the stack it's
built on — the general README deliverable required by the build plan, distinct
from the per-feature docs `/complete` already archives under
`blueprint/history/`.

## In scope

- Rewrite `README.md` at the repo root, replacing 100% of the current
  Vite-scaffold content (recommended IDE/browser setup, generic Vite links).
- Sections: project description (what it does, from `project-overview.md`'s
  Problem statement), prerequisites (Node engine range from `package.json`),
  setup (`npm install`, `.env` from `.env.example` with both required vars:
  `VITE_API_BASE_URL` and `VITE_PRIMEUI_LICENCE_KEY`, and how to get a
  SpaceTraders agent token via https://my.spacetraders.io/login to log into
  the running app), running locally (`npm run dev`), available scripts (build,
  preview, type-check, test:unit, lint, format — from `package.json`), and
  tech stack (from `project-overview.md`'s Tech stack section).
- Note that CI (GitLab CI: audit → lint → type-check → tests → build) gates
  merges to `main`.
- Note the token security posture already documented in
  `project-overview.md` (sessionStorage, visible in DevTools, accepted
  backend-less SPA risk) so a reader understands why no backend exists.

## Out of scope

- Per-feature/fix changelogs or history — already produced by `/complete`.
- API reference/endpoint documentation — this is a consumer app, not an API.
- Deployment instructions — no hosting target exists (per Deployment section
  of the overview).
- Contribution guidelines, license file, changelog file — not requested by
  the build plan or `brief.md`.
- Screenshots or visual walkthrough — no design asset provided for the
  README itself.

## Build loop

Single step, `stepReview: every` per config: write and stop for review before
`/complete`. `checkpointCommits: enabled`, but a one-step feature has nothing
to checkpoint before the final commit.

## Build steps

- [x] 1. Rewrite `README.md` with the sections listed under In scope. Done
      when the file no longer contains any Vite-scaffold boilerplate (IDE/
      browser recommendations, generic Vite Configuration Reference link) and
      a fresh clone could follow it end-to-end to a running, logged-in app
      using only this file, `.env.example`, and `package.json`.

## Files / areas

- `README.md` (root) - full rewrite.

## Data / contracts

None — documentation only, no code or schema changes.

## Testing

None applicable — no logic to test. Verify command not affected by a
markdown-only change; not re-run for this step.

## Notes for the AI

- Source the description and stack claims from `project-overview.md` (already
  loaded this session) rather than re-deriving them, to stay consistent with
  the rest of the planning docs.
- `.env.example` currently lists two variables
  (`VITE_PRIMEUI_LICENCE_KEY`, `VITE_API_BASE_URL`); both are read in source
  (`src/plugins/primevue.ts`, `src/shared/api/http.ts`) and must both be
  called out in setup — don't document only the API base URL.
- Keep the tone factual/reference, matching the terse style of the existing
  planning docs rather than marketing copy.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":3466,"specSha256":"e80275bb7a86561ce48eb53684723a567096f6b808d4ef2cd752cdcf71bb2d19","branch":"refs/heads/feature/documentation-readme","head":"ea12832810a9f1ca122368081130f7fe4107d570","baseRef":"refs/heads/main","baseCommit":"ea12832810a9f1ca122368081130f7fe4107d570","sourceTree":"233dcf37957315476a86d0f86bba003a65e6ef4c","absentOptional":[]} -->
