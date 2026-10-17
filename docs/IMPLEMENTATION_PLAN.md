# Implementation and acceptance

The foundation, contract/data layer, server routes, client behavior, local design system,
copy workflow and CI configuration are implemented. [PROJECT_CONTEXT](PROJECT_CONTEXT.md)
records actual validation; this checklist defines what must remain true after changes.

## Maintained phases

1. Reproducible foundation: pinned runtime/dependencies, lockfile, strict TypeScript and lint.
2. Domain/data: runtime decoder, fixtures, demo/live config and bounded HTTP adapters.
3. Rendering: server list/details, direct URLs, expected errors and missing-item handling.
4. Interaction: initial state, explicit refresh/retry, abort/generation guards and action ownership.
5. Handoff: accessible responsive UI, checks, copy/rename instructions and truthful evidence.

## Commands

| Command                                      | Purpose                                                  |
| -------------------------------------------- | -------------------------------------------------------- |
| `npm ci`                                     | Install the locked dependency graph                      |
| `npm run dev`                                | Development server                                       |
| `npm run typecheck`                          | Generate route types and run strict TypeScript           |
| `npm run lint`                               | ESLint and source import graph boundaries                |
| `npm run format:check`                       | Non-mutating format check                                |
| `npm test`                                   | Non-watch unit/component/integration tests               |
| `npm run build` / `npm start`                | Build and serve production                               |
| `npm run test:e2e`                           | Own mock, build, production server, Playwright, teardown |
| `npm run docs:check`                         | Local documentation links/anchors/fences                 |
| `npm run starter:copy -- ../new-app new-app` | Clean product copy; destination must not exist           |

## Acceptance gates

| ID  | Required behavior                                       | Evidence location                                                         |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| W01 | Independent reproducible build                          | npm ci and production build                                               |
| W02 | C1 validation and error policies                        | tests/catalog/data.test.ts and fixtures                                   |
| W03 | No hydration fetch; explicit refresh                    | SSR/request-count browser test                                            |
| W04 | SSR and handler parity                                  | Initial error/empty/rate-limit and handler browser tests                  |
| W05 | Cancellation and stale-response protection              | Controller tests with abort-ignoring fake and unmount                     |
| W06 | Direct detail URL and correct missing/error distinction | Production browser routes and opaque-ID cases                             |
| W07 | Server-only data stays private                          | Import graph and client HTML/RSC/bundle/envelope sentinel scan            |
| W08 | Responsive, RTL, keyboard and themes                    | Browser layout checks and visual inspection                               |
| W09 | Layer/ownership rules                                   | AST boundary check and code review                                        |
| W10 | No command replay; new snapshots reset owner            | Strict Mode/controller and browser navigation tests                       |
| W11 | Refresh preserves data/empty; retry is gated            | Reducer/controller and browser recovery tests                             |
| W12 | Fresh runtime data, no build fetch                      | E2E harness asserts zero upstream build requests; runtime fixture changes |
| W13 | Request-state isolation                                 | Simultaneous repository tests; no mutable response singleton              |
| W14 | Browser navigation semantics                            | Back/direct loads/modified-click/new-tab/keyboard tests                   |
| W15 | Reusable handoff                                        | Copy smoke test, documentation checks, factual evidence                   |

Vitest uses deterministic fakes and clocks. E2E runs Chromium, Firefox and WebKit serially
against an isolated mock and production build. It fails on build-time upstream calls.
Only the mock has scenario controls; the production application has no public test switch.
CI uses GitHub Actions; adding the workflow locally does not prove a hosted CI run.

Out of scope: deployment, auth, database, offline/PWA, analytics, billing, published UI
packages or guaranteed minimum-browser support. Add these only against product requirements.
Accessibility assertions and a visual review do not constitute a formal accessibility audit.
