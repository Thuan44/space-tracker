# Space Tracker

A read-only web control panel for a [SpaceTraders](https://spacetraders.io/)
agent: authenticate with an agent token, then browse fleet, systems, and
market data without hitting the raw API by hand.

SpaceTraders exposes a full game API (fleet, systems/waypoints, markets,
contracts, factions) but ships no first-party web UI. Space Tracker is a
single-page dashboard over one agent's status, fleet, known systems, and
market data. It's a client-only SPA with no backend — each browser session
holds its own token and sees only that agent's data.

## Features

- **Dashboard** - agent identity, credits, ship count, starting system, and a
  fleet preview
- **Systems** - browse and search known systems
- **System detail** - a system's waypoints, with links to markets
- **Fleet** - list of your ships with status, position, cargo, and fuel
- **Fleet detail** - a ship's cargo, crew, fuel, and components
- **Markets** - traded goods, prices, and supply/activity at a waypoint

## Prerequisites

- Node.js `^22.18.0` or `>=24.12.0` (see `engines` in `package.json`)
- A SpaceTraders agent token — register one at
  [my.spacetraders.io/login](https://my.spacetraders.io/login)

## Setup

```sh
npm install
```

Copy `.env.example` to `.env` and fill in both variables:

```sh
cp .env.example .env
```

- `VITE_API_BASE_URL` - the SpaceTraders API base URL
  (`https://api.spacetraders.io/v2`)
- `VITE_PRIMEUI_LICENCE_KEY` - a PrimeVue community license key, generated at
  [primeui.dev/licenses](https://primeui.dev/licenses) (sign in, create a free
  community license, copy the generated key). It only silences PrimeVue's
  unlicensed-usage badge in the running app — no paid features are used.

`.env` is gitignored; never commit real secrets to `.env.example`.

## Running locally

```sh
npm run dev
```

Open the app and sign in on `/login` with the agent token from
[my.spacetraders.io/login](https://my.spacetraders.io/login). The token is
kept in `sessionStorage` for the duration of the tab session, is never
logged, and is sent only via the `Authorization` header — never in a URL or
query string. It is still visible in DevTools, an accepted risk for a
backend-less SPA; a future backend/BFF issuing an `httpOnly` cookie would
close that gap but is out of scope for this project.

## Available scripts

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Start the Vite dev server                   |
| `npm run build`      | Type-check and build for production         |
| `npm run preview`    | Preview the production build locally        |
| `npm run type-check` | Type-check with `vue-tsc`                   |
| `npm run test:unit`  | Run unit tests with Vitest                  |
| `npm run lint`       | Lint with oxlint then ESLint (read-only)    |
| `npm run lint:fix`   | Lint with oxlint then ESLint, both `--fix`  |
| `npm run format`     | Format `src/` with Prettier                 |
| `npm run format:check` | Check `src/` formatting without writing   |

GitLab CI runs `npm audit` (non-blocking) → lint + format check →
type-check → tests → build on every push to `main`, so every merge produces
a visible pipeline run. `lint` and `format` only verify in CI — they never
rewrite files there, so a passing pipeline means the pushed code is actually
clean; use `npm run lint:fix` / `npm run format` locally to fix issues before
pushing. `/complete` squash-merges locally and pushes directly, without
opening a GitLab merge request, which is why the pipeline triggers on push
rather than on merge-request events. A real-world project with a team would
instead gate merge requests before they land on `main` — running on push
here is a solo-project trade-off to keep every change visible without that
overhead.

## Tech stack

- **Vue 3** + TypeScript (Composition API)
- **Vue Router**
- **Pinia** - client-only state (token/session), never server data
- **TanStack Query (Vue Query)** - server-state fetching and caching
- **Zod** - API response validation at the boundary
- **Tailwind CSS 4** - styling
- **PrimeVue (unstyled)** - interaction logic (sortable/paginated tables,
  dropdowns, keyboard accessibility)
- **@fontsource/ibm-plex-mono** - self-hosted IBM Plex Mono
- **Vitest** - unit tests
- ESLint + oxlint + Prettier
- **GitLab CI/CD**

Code is organized by domain (`auth`, `systems`, `fleet`, `markets`) with a
`shared/` folder for cross-cutting UI, utilities, and the API client.

## Not included (by design)

Space Tracker is a read-only viewer, not a way to play the game. On purpose,
it doesn't cover: ship navigation or piloting, buying/selling on markets,
contracts or shipyard purchases, faction management, or real-time
notifications. A mobile-optimized layout is also out of scope — the
data-dense tables need a dedicated redesign, not just breakpoints.

## Built with an AI workflow

This project was built with the support of an AI coding agent, following an
AI workflow called **AI Blueprint** to keep that work spec-first and
reviewable rather than one long open-ended prompting session.

`AGENTS.md` / `CLAUDE.md` tell the agent how the project wants to be worked
on, and `blueprint/` holds the planning docs (`project-overview.md`,
`build-plan.md`) alongside the state the workflow generates as it goes
(`current-feature.md`, `findings.md`, `review.md`). Each build-plan item goes
through the same loop: `/feature` turns it into a spec and stops for review,
`/implement` builds it step by step against that spec, `/check` and `/audit`
verify the behavior and the code, and `/complete` archives the finished spec
under `blueprint/history/` and merges it. That history is why every feature
and fix in this repo has its own written record of what changed and why, not
just a commit message.
