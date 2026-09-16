# Fix: Trigger CI pipeline on push to main

**Type:** Fix
**Status:** verified
**Branch:** fix/trigger-pipeline-on-main-push

## The problem

`.gitlab-ci.yml`'s `workflow: rules` only creates a pipeline when
`$CI_PIPELINE_SOURCE == "merge_request_event"`. `/complete` actually merges
by squash-merging the feature branch locally and pushing straight to `main`
(no GitLab merge request is opened), so this pipeline never runs — it's
unreachable configuration, not a working gate or a visible signal.

## The fix

Change the `workflow: rules` condition in `.gitlab-ci.yml` to fire on a
direct push to `main` instead:

```yaml
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "main"'
```

This keeps everything else in the pipeline (5 stages, `npm audit`
non-blocking, `lint`/`type-check`/`test`/`build` blocking in sequence, no
deploy stage) unchanged — only the trigger condition moves, so every future
`/complete` push actually produces a visible pipeline run. No other job or
stage needs to change; this isn't a new machinery layer, it's correcting an
existing condition to match how merges actually happen in this project.

Out of scope: `blueprint/build-plan.md` and `project-overview.md` both
describe the old "Merge Requests only" trigger in feature 1's already-archived
text. That prose becomes stale after this fix, but rewriting completed
plan/overview text is outside `/fix`'s scope (it's user-owned planning
history, not generated state) — leaving it for the user to edit by hand if
they want the description to match, or to disregard as historical record.

## Build steps

- [x] 1. Update `.gitlab-ci.yml`'s `workflow.rules` condition to
      `$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "main"`.
      **Done when:** the file still parses as valid YAML, the rest of the
      file (stages, jobs, cache) is byte-for-byte unchanged, and the only
      diff is the `if:` condition line.

## Verify

No test command applies (CI configuration, not application logic). Verify by:

1. Manual read-through of the changed `if:` line against the block above.
2. Parse the file with a YAML parser (no parser is installed in this repo;
   this session used Ruby's stdlib `Psych` via `ruby -ryaml`) to confirm it's
   still syntactically valid after the edit.
3. Full functional proof (GitLab actually starting a pipeline on the next
   push to `main`) only happens once this fix is merged and `/complete`
   pushes again — outside `/implement`'s local, no-push scope.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":2522,"specSha256":"389d12aacf18bb098ed7cd4ff9e8b098624328410e7e17a4ac2d281c5ebd1df2","branch":"refs/heads/fix/trigger-pipeline-on-main-push","head":"64d90274fcd6e84fbe1a3686d380e581240266db","baseRef":"refs/heads/main","baseCommit":"3b2bc4893dcc394e784a3ca0e33588027543da3c","sourceTree":"058f6575742c8ef65c4afb14474f850dfa62d4d5","absentOptional":[]} -->
