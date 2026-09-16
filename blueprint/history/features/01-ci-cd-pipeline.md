# Feature: CI/CD pipeline

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/ci-cd-pipeline
**Status:** verified

## Goal

Add `.gitlab-ci.yml` so every merge request into `main` automatically runs
dependency audit, lint, type-check, unit tests, and a production build, in
that order, gating the merge on the last four passing.

## In scope

- One `.gitlab-ci.yml` at the repo root.
- `workflow: rules` restricting pipeline creation to merge-request events only
  (no pipeline on a plain branch push).
- Five stages, in order: `audit` -> `lint` -> `type-check` -> `test` -> `build`.
- `audit` stage: runs `npm audit` directly against the committed
  `package-lock.json`, no dependency install step, `allow_failure: true` (non
  -blocking) per the documented security posture (`npm audit` as a
  non-blocking first CI stage).
- `lint`, `type-check`, `test`, `build` stages: each installs dependencies
  (`npm ci`, cached by `package-lock.json` hash) and runs the matching
  existing `package.json` script from `AGENTS.md`'s Commands section, blocking
  in sequence (a later stage never starts unless the earlier one passed).
- No deploy stage.

## Out of scope

- GitLab branch-protection / merge-checks configuration ("pipeline must be
  green before merge", squash-merge, delete-branch-on-merge) — those are
  GitLab project settings, not files in this repo, and are not reachable from
  a feature branch's file changes.
- Any application source change. This feature touches only CI configuration.
- A pre-push git hook or any local automatic trigger (`/ci`'s optional local
  hook is a separate, GitHub-oriented flow this project isn't using; this
  project already committed to GitLab CI directly per the build plan).
- `.env` / `VITE_API_BASE_URL` setup — that belongs to feature 2 (Shared API
  client); no job in this pipeline currently needs an API base URL.

## Build loop

Per `blueprint/config.json`: `workflow.stepReview` is `every` and
`workflow.checkpointCommits` is `enabled`. Stop after each build step below
for review; once a step is approved, it gets its own checkpoint commit on
`feature/ci-cd-pipeline` before the next step starts. `/complete` creates the
final squashed feature commit.

## Build steps

- [x] 1. Create `.gitlab-ci.yml` with the MR-only `workflow: rules`, the
      `stages:` list (`audit`, `lint`, `type-check`, `test`, `build`), a
      default `image: node:22-alpine`, and the `audit` stage's job: script
      `npm audit`, `allow_failure: true`, no install step.
      **Done when:** the file exists at the repo root, is syntactically valid
      YAML (parses with no indentation/structure errors on manual read-through
      against the block below), and the `audit` job has no `before_script`/
      dependency install, matching the "cheapest, most independent check"
      rationale in the build plan.
- [x] 2. Add the `lint`, `type-check`, `test`, and `build` jobs, each in its
      own stage, each installing dependencies via `npm ci` (shared cache
      keyed on `package-lock.json`) then running its matching existing
      script: `npm run lint`, `npm run type-check`, `npm run test:unit`, and
      `npm run build-only` (not `npm run build`, which would re-run
      `type-check` in parallel — already covered by the preceding stage).
      **Done when:** all five jobs are present with the exact stage order
      above, the four non-audit jobs have no `allow_failure` (default
      blocking), and each job's `script` matches the command it's named for
      one-for-one against `AGENTS.md`'s Commands section.

## Files / areas

- `.gitlab-ci.yml` (new, repo root) — the only file this feature touches.

## Data / contracts

Exact `.gitlab-ci.yml` contract (job names/attributes below are the spec;
formatting/anchors are an implementation detail):

```yaml
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'

stages:
  - audit
  - lint
  - type-check
  - test
  - build

default:
  image: node:22-alpine

npm-audit:
  stage: audit
  allow_failure: true
  script:
    - npm audit

lint:
  stage: lint
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run lint

type-check:
  stage: type-check
  cache: *same key/paths as lint*
  before_script:
    - npm ci
  script:
    - npm run type-check

test:
  stage: test
  cache: *same key/paths as lint*
  before_script:
    - npm ci
  script:
    - npm run test:unit

build:
  stage: build
  cache: *same key/paths as lint*
  before_script:
    - npm ci
  script:
    - npm run build-only
```

Use a YAML anchor (`.npm_job: &npm_job`) or GitLab `!reference`/`extends` to
avoid repeating the cache/before_script block four times — implementation
detail, not part of the contract.

## Testing

No unit tests apply — this is CI configuration, not application logic (no
test command in `AGENTS.md` runs YAML). Verification is:

1. Manual read-through of the committed `.gitlab-ci.yml` against the exact
   contract above (stage order, job names, `allow_failure` placement, script
   commands).
2. Confirm every `script:` line reproduces an existing `AGENTS.md` command
   exactly (`npm run lint`, `npm run type-check`, `npm run test:unit`, and
   `vite build` via `npm run build-only`) — no new script invented.
3. Full functional proof (GitLab actually creating a pipeline on an MR and
   each stage passing/failing correctly) only happens once this branch is
   pushed and a merge request is opened against `main` — outside this
   skill's local, no-push scope. Note this residual verification explicitly
   at hand-off.

## Notes for the AI

- Reuse the exact script names already in `package.json` / `AGENTS.md`'s
  Commands section (`lint`, `type-check`, `test:unit`, `build-only`). Do not
  add new `package.json` scripts for CI-only variants (e.g. no separate
  "lint:ci" without `--fix`) — the existing scripts already fail on
  non-autofixable violations, and CI containers are ephemeral so `--fix`
  running there has no repo-integrity downside.
- `npm run build` runs `type-check` a second time in parallel with
  `vite build`; use `npm run build-only` in the `build` stage since
  `type-check` already ran as its own preceding stage.
- `node:22-alpine` is a reversible internal choice (matches the lower bound
  of `package.json`'s `engines.node`); swapping it later has no product,
  security, or data impact.
- Origin remote is a real GitLab remote (`gitlab-thuan44:Thuan44/space-tracker.git`),
  so this pipeline will actually run once pushed — but pushing, opening the
  MR, and configuring GitLab branch-protection stay outside `/feature` and
  `/implement`.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":6729,"specSha256":"3499b69cd07d18d8e6b39245857c58a6bc01ab39d6e7d80a93af8c4d677a1ac7","branch":"refs/heads/feature/ci-cd-pipeline","head":"a090df0144e5d4d3847d0e594f5d767bbe41eb49","baseRef":"refs/heads/main","baseCommit":"d48d955819b68c47e746f41e8ba15153045995c9","sourceTree":"34ccb94cc3644a4cfe40860377975bf376360302","absentOptional":[]} -->
