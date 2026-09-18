# Feature: Prettier in CI, `--fix` local-only

**From build-plan:** feature 17
**Build attempt:** 1
**Branch:** feature/prettier-in-ci-fix-local-only
**Status:** verified

## Goal

`npm run lint` currently runs `oxlint --fix` and `eslint --fix` — in CI the
runner silently rewrites files inside its own throwaway container and the job
goes green, while the code actually pushed can still be broken. Nothing at all
checks Prettier formatting, so a misformatted file (F-05 in `findings.md`)
ships unnoticed. This feature splits verification (CI, read-only) from
correction (local-only, `--fix`), adds a `format:check` script and matching
CI job, formats the 16 files `prettier --check` currently flags, and closes
F-05. Tooling and documentation only — no application code behavior changes.

## In scope

- `package.json`: split `lint` into read-only `lint:oxlint` (`oxlint .`) and
  `lint:eslint` (`eslint . --cache`), both without `--fix`; add `lint:fix`
  (`oxlint . --fix && eslint . --fix --cache`) for local use; keep `lint` as
  the explicit `run-s lint:oxlint lint:eslint` (not a `"lint:*"` glob, which
  would also catch `lint:fix`); add `format:check`
  (`prettier --check --experimental-cli src/`, same flag as the existing
  `format` script).
- Format the 16 files `npx prettier --check --experimental-cli src/`
  currently flags (confirmed during spec research — `lint:oxlint` and
  `lint:eslint` already pass clean without `--fix`, so this sweep is a
  formatting-only diff, not a lint fix): `LoginView.vue`, `StatTile.vue`,
  `DashboardView.vue`, `FleetDetailView.vue`, `FleetView.vue`,
  `MarketView.vue`, `NotFoundView.vue`, `SystemDetailView.vue`,
  `SystemsView.vue`, `http.ts`, `useCountUp.ts`, `useTypewriter.ts`,
  `AppHeader.vue`, `DataTable.vue`, `GaugeBar.vue`, `motion.ts` — run via
  `npm run format`, committed alone with no other changes mixed in.
- `.gitlab-ci.yml`: add a `format` job in the existing `lint` stage that runs
  `npm run format:check`, so a formatting failure is visible separately from
  a lint failure. The existing `lint` job needs no edit — it already runs
  `npm run lint`, which becomes read-only once the script changes.
- Update `README.md`'s "Available scripts" table (add `lint:fix` and
  `format:check` rows, correct the `lint` row's description now that it no
  longer auto-fixes) and its CI paragraph (mention the new format check).
- Update `AGENTS.md`'s Commands section: the `Lint` line no longer runs
  `--fix`; add a line for `Format check`.
- Close F-05 in `blueprint/context/findings.md` (set status to `fixed`, fill
  in `**Resolution:**`).

## Out of scope

- Untracking Blueprint tooling or rewriting the README's AI-workflow section
  — that's build-plan feature 18 (`post-release-improvements.md` step 3).
- Any change to application code behavior, other findings (F-01, F-03, F-04,
  F-08), `eslint-plugin-vuejs-accessibility`, or design tokens.
- Changing `.prettierrc.json` — the existing config (`semi: false`,
  `singleQuote: true`, `printWidth: 100`) is already correct; only the
  scripts/CI wiring around it are missing.

## Build loop

Per `blueprint/config.json`: review after every step (`workflow.stepReview:
"every"`), with an optional checkpoint commit after each approved step
(`workflow.checkpointCommits: "enabled"`). `/complete` creates the final
feature commit; this spec does not prescribe commit messages, though
`post-release-improvements.md` suggests `style: format src with prettier` for
step 2 if a checkpoint commit is taken there.

## Build steps

- [x] 1. **Split lint/format scripts in `package.json`** — replace
      `"lint:oxlint": "oxlint . --fix"` and `"lint:eslint": "eslint . --fix
      --cache"` with `--fix`-free versions, add `"lint:fix": "oxlint . --fix
      && eslint . --fix --cache"`, set `"lint": "run-s lint:oxlint
      lint:eslint"` explicitly, and add `"format:check": "prettier --check
      --experimental-cli src/"`. Done when: `npm run lint` exits 0 with no
      working-tree changes (`git status` clean before/after); `npm run
      lint:fix` still behaves like the old `lint` did; `npm run format:check`
      exits 1 while any of the 16 known files remain unformatted, and 0 after
      a file is manually reformatted and the change reverted; `npm run
      type-check` and `npm run test:unit` still pass.

- [x] 2. **Format the existing 16 files** — run `npm run format`, review the
      diff (whitespace/line-wrap only, per `post-release-improvements.md`'s
      note that it's mostly wrapped attributes in views), and commit it
      alone with no script or CI changes mixed in. Done when: `npm run
      format:check` exits 0; `npm run type-check` and `npm run test:unit`
      pass with no behavior change; the diff touches only the 16 listed
      files.

- [x] 3. **Add the CI format job** — in `.gitlab-ci.yml`, add a `format` job
      extending `.npm_job` in the `lint` stage, running `npm run
      format:check`. Done when: the file is valid YAML (parses cleanly); the
      new job sits in the `lint` stage alongside the existing `lint` job;
      `git diff` shows no change to the existing `lint`, `type-check`,
      `test`, or `build` jobs.

- [x] 4. **Update docs and close F-05** — `README.md`'s scripts table gets
      `lint:fix` and `format:check` rows and a corrected `lint` description
      (no more "both `--fix`"); its CI paragraph mentions the new format
      check running alongside lint. `AGENTS.md`'s Commands section updates
      the `Lint` line to drop `--fix` and adds a `Format check` line.
      `blueprint/context/findings.md`'s F-05 status becomes `fixed` with a
      `**Resolution:**` describing the format sweep in step 2 and the new
      CI guard in step 3. Done when: README and AGENTS.md contain no stale
      reference to lint auto-fixing in CI; F-05's status line reads `fixed`
      with a filled-in resolution; `npm run type-check` and `npm run
      test:unit` still pass.

## Files / areas

- `package.json`
- `.gitlab-ci.yml`
- `README.md`
- `AGENTS.md`
- `blueprint/context/findings.md`
- The 16 files listed in "In scope" (formatting-only changes)

## Data / contracts

None. No API, schema, route, store, or query-key changes — tooling
configuration and a whitespace-only formatting sweep.

## Testing

Tooling/config work with no new pure logic function — consistent with the
project's existing convention (Vitest covers pure logic, not scripts or CI
config). No new automated tests are added. Verification is each step's
`Done when` (script exit codes, clean git diffs) plus `npm run type-check`
and `npm run test:unit` staying green throughout, since this is exactly the
kind of regression a formatting/lint change could otherwise introduce
silently.

## Notes for the AI

- Confirmed during spec research: `npx oxlint .` and `npx eslint . --cache`
  (no `--fix`) both already exit clean — the current `--fix` flags are
  masking zero real lint violations, only unformatted files exist. So step 1
  cannot surface a pile of newly-visible lint errors; if it does, something
  in the local environment differs from what was checked and it's worth
  flagging before continuing.
- Confirmed no `.claude/skills/` or `.agents/` script relies on `npm run
  lint` to auto-fix on its behalf (`grep -rn "npm run lint\b"` found nothing
  outside the `lint:*` script names themselves) — no other file needs
  updating for the `--fix` removal.
- `.prettierrc.json` already has the right settings; don't touch it.
- Keep the reformatting commit (step 2) free of any lint/CI/doc changes so a
  reviewer can tell "formatting only" at a glance, per the source doc's
  explicit "commit it alone" instruction.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7708,"specSha256":"83f0a8ba5a8113816e700edd5949d1792ebccde5b20fd50e57f9d00e83740b23","branch":"refs/heads/feature/prettier-in-ci-fix-local-only","head":"71adfefabb8cd58cadd536bd31dfbb3f088e6a30","baseRef":"refs/heads/post-release-improvement","baseCommit":"71adfefabb8cd58cadd536bd31dfbb3f088e6a30","sourceTree":"97e438cf5f256042e064bbd396261f9247cdecc0","absentOptional":[]} -->
