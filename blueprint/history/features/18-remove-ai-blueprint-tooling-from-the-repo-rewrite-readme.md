# Feature: Remove AI Blueprint tooling from the repo, rewrite README

**From build-plan:** feature 18
**Build attempt:** 1
**Branch:** feature/remove-ai-blueprint-tooling-from-the-repo-rewrite-readme
**Status:** verified

## Goal

Stop publishing the AI Blueprint workflow tooling in this repo's git history
going forward, while keeping the workflow fully usable locally, and rewrite the
README so its "Built with an AI workflow" disclosure stays honest without
pointing at files or commands that are no longer tracked. The README also gains
Architecture, Decisions, and Tests sections, and the PrimeVue license key
becomes explicitly optional.

## In scope

- Add a commented `.gitignore` block covering the local AI tooling paths.
- `git rm --cached` (never plain `rm`) those paths so they leave the index but
  stay on disk and the workflow keeps working locally.
- Decide, and apply, which remaining `blueprint/` files are generated state
  (now ignored) vs. real project documentation (stays tracked).
- Rewrite `README.md`: drop tool/command references from the AI-workflow and
  CI paragraphs, add Architecture / Decisions / Tests sections, make the
  PrimeVue license key optional in `.env.example` and `src/plugins/primevue.ts`.
- A keyword sweep of tracked files and a fresh-clone `npm ci` / `dev` / `build`
  check with no `.claude/`/`.agents/` present.

## Out of scope

- Rewriting git history — old tooling content stays reachable in past commits;
  the README's AI-workflow disclosure already assumes that.
- Any change covered by a later build-plan item: lazy-loaded routes (19,
  closes F-04), `ApiError`/`QueryClient` (20), query cache behavior (21),
  component extraction (22), router guard (23), Zod robustness (24),
  animations (25), filter/sort UX (26). Findings F-01, F-03, F-08 stay open
  for step 21/24 as already noted in `blueprint/specs/post-release-improvements.md`.
- `blueprint/reference/` and `blueprint/specs/` — already gitignored as
  Obsidian symlinks; no action needed.
- Screenshots in the README — explicitly optional in the source spec and no
  image asset exists to add today.

## Build loop

`workflow.stepReview` is `every`: stop after each step below for approval
before starting the next. `workflow.checkpointCommits` is `enabled`: once a
step is approved, create the commit named in its `Done when` on the feature
branch. `/complete` still performs the final archive/merge action; these are
intermediate checkpoints on `feature/remove-ai-blueprint-tooling-from-the-repo-rewrite-readme`,
not that final step.

## Build steps

- [x] 1. **Untrack the local AI tooling, keep it on disk**
      Add a `# AI Blueprint (local tooling, not published)` commented block to
      `.gitignore` listing: `.agents/`, `.claude/skills/`, `AGENTS.md`,
      `CLAUDE.md`, `blueprint/config.json`,
      `blueprint/context/ai-interaction.md`,
      `blueprint/context/findings.md`, `blueprint/context/current-feature.md`,
      `blueprint/context/review.md`, `blueprint/.state/manifest.json`. Then run
      `git rm -r --cached .agents .claude/skills AGENTS.md CLAUDE.md
      blueprint/config.json blueprint/context/ai-interaction.md
      blueprint/context/findings.md blueprint/context/current-feature.md
      blueprint/context/review.md blueprint/.state/manifest.json` so those
      paths leave the index without touching the working tree. `config.json`
      is inert without the skills that read it, so it travels with them
      rather than staying behind as an unexplained tracked file. Leave
      `blueprint/context/project-overview.md`, `blueprint/project-plan.md`,
      `blueprint/build-plan.md`, `blueprint/context/coding-standards.md`
      (tuned to this project's stack, not a generic template), and
      `blueprint/history/` tracked — real project documentation, not
      workflow-tool state.
      **Done when:** `git status` shows only index deletions for the listed
      paths (no working-tree deletions), every listed path still exists on
      disk, `npm run type-check` and `npm run build` still pass, and the commit
      `chore: untrack local AI tooling` exists.

- [x] 2. **Rewrite the README**
      In "Built with an AI workflow": keep the honest disclosure paragraph
      (spec-first, AI coding agent, each feature specified then verified,
      history under `blueprint/history/`), remove the `AGENTS.md` / `CLAUDE.md`
      references and the `/feature`, `/implement`, `/check`, `/audit`,
      `/complete` command list. In "Available scripts": remove the sentence
      crediting `/complete` for the squash-merge and direct push, and reword
      the CI paragraph around a plain `git push` to `main`. Add an
      **Architecture** section: the domain tree (`auth`, `dashboard`,
      `systems`, `fleet`, `markets`, `not-found`, plus `shared/`), the
      `view → useQuery → api/*.ts → http.request → Zod` flow, the Pinia
      (client state) vs. TanStack Query (server state) split, and the
      401 → logout → redirect-to-`/login` flow in `src/shared/api/http.ts`.
      Add a **Decisions** section, one short paragraph each: Zod at the API
      boundary, TanStack Query for server state, `sessionStorage` for the
      token, PrimeVue unstyled + Tailwind. Add a **Tests** section: Vitest,
      colocated `*.test.ts` pure-logic tests, `npm run test:unit`. Make the
      PrimeVue key optional: clear `.env.example`'s
      `VITE_PRIMEUI_LICENCE_KEY` value (empty instead of the placeholder
      string) and update the Setup section's description; in
      `src/plugins/primevue.ts`, change
      `license: import.meta.env.VITE_PRIMEUI_LICENCE_KEY` to
      `license: import.meta.env.VITE_PRIMEUI_LICENCE_KEY || undefined` so an
      empty key is never sent to PrimeVue.
      **Done when:** `grep -n "AGENTS.md\|CLAUDE.md\|/feature\|/implement\|/audit\|/complete" README.md`
      returns nothing, `.env.example` has an empty `VITE_PRIMEUI_LICENCE_KEY`,
      `npm run dev` still boots with PrimeVue components rendering, `npm run
      build` passes, and the commit
      `docs(readme): document architecture and drop tooling references` exists.

- [x] 3. **Verify: keyword sweep and fresh clone**
      Run `git grep -n "AGENTS.md\|CLAUDE.md\|blueprint/context/findings\|\.claude/skills\|\.agents/skills"`
      over tracked files outside `blueprint/history/` (a dated record of the
      workflow that was in use, left untouched) and confirm nothing unintended
      surfaces. Clone the repo into a temporary directory and run `npm ci`,
      `npm run dev` (start, confirm it serves, stop), and `npm run build`
      there with no `.claude/` or `.agents/` on disk.
      **Done when:** the sweep shows no unintended tracked reference outside
      `blueprint/history/`, and the fresh clone's `npm ci`, `npm run dev`, and
      `npm run build` all succeed without `.claude/`/`.agents/`. Verification
      only — no commit from this step.

## Files / areas

- `.gitignore`
- `.agents/`, `.claude/skills/`, `AGENTS.md`, `CLAUDE.md`,
  `blueprint/config.json` (untrack only)
- `blueprint/context/ai-interaction.md`, `blueprint/context/findings.md`,
  `blueprint/context/current-feature.md`, `blueprint/context/review.md`,
  `blueprint/.state/manifest.json` (untrack only)
- `README.md`
- `.env.example`
- `src/plugins/primevue.ts`

## Data / contracts

None. No API, schema, or persisted-data changes — this feature only changes
what git tracks and rewrites documentation, plus the one-line PrimeVue license
fallback described in Step 2.

## Testing

No new Vitest coverage. The only executable behavior change is the PrimeVue
license fallback (`|| undefined`), a config value rather than branching logic;
Steps 2 and 3 verify it by actually running `npm run dev`/`build` with an empty
key. Steps 1-3 each name the exact type-check/build/grep/clone commands that
serve as proof for that step.

## Notes for the AI

- Untrack with `git rm --cached` (or `-r --cached`), never a plain `rm` or
  `git rm` without `--cached` — the files must remain on disk.
- Do not touch `blueprint/reference/` or `blueprint/specs/`; already
  gitignored as Obsidian symlinks.
- Do not move any `blueprint/` folder into `docs/`; the installed skills still
  read `blueprint/...` paths locally regardless of what git tracks.
- No git history rewrite; old tooling content stays reachable in past commits,
  which is why the README disclosure can stay honest about AI use without
  linking to files that are no longer tracked going forward.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":8519,"specSha256":"22634f443baa1c7f7fce5a7b147bd8b2ffcfd93ff0ce7b8cfaac7570f70a602d","branch":"refs/heads/feature/remove-ai-blueprint-tooling-from-the-repo-rewrite-readme","head":"ee52f53d9df43e7e4daa2fca28dbab6d0bd314f4","baseRef":"refs/heads/post-release-improvement","baseCommit":"ac33942bafc394a9623e133228799179c4abb4a0","sourceTree":"58e287f0a7053eb6bc42c52957610d83583de02d","absentOptional":[]} -->
