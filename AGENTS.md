# Web Starter — agent operating contract

This is a reusable Web application starter. Check
[PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md) before claiming implementation exists.
MUST is mandatory; SHOULD allows a reasoned, recorded exception; MUST NOT is forbidden.

## Load only necessary context

| Task                                              | Read                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Every task                                        | This file and applicable directory instructions                      |
| Product/feature work                              | PROJECT_CONTEXT, affected source and tests                           |
| Structural, state, network, DI or navigation work | Relevant [ARCHITECTURE](docs/ARCHITECTURE.md) sections               |
| Dependency or architecture reversal               | Relevant [DECISIONS](docs/DECISIONS.md) entries                      |
| API work                                          | [WEB_CONTRACT](docs/WEB_CONTRACT.md) and affected adapters/tests     |
| Bootstrap                                         | [IMPLEMENTATION_PLAN](docs/IMPLEMENTATION_PLAN.md)                   |
| Small fix or visual change                        | Existing execution path, screen contract and nearby tests/components |

Do not reload historical chats or unrelated repositories for routine implementation.
These local documents contain the target contract. Inspect before inventing helpers.
Extend existing behavior when suitable; create only directories backed by real code.

## MUST

- Distinguish observed implementation, required target, and unresolved choices.
- Keep one application package initially; use feature-first presentation/domain/data
  boundaries and explicit server/client composition roots.
- Use screen-local immutable state and events for non-trivial screens. Handle transient
  actions outside renderable state; routes own UI effects and navigation.
- Keep repository interfaces/models in domain, transport/DTOs/decoders in data, and
  screen mapping in presentation. Server pages may compose dependencies but must delegate
  feature behavior; content components must not instantiate data implementations.
- Keep server configuration and upstream access server-only. Validate unknown JSON at
  both upstream and browser-envelope boundaries. Pass only safe serializable values
  across the server/client boundary.
- Inject collaborators through functions/constructors. Use explicit scopes and direct
  fakes in tests; keep request-specific server data out of module singletons.
- Specify cancellation, timeout, concurrency, ownership and cleanup. Guard stale results
  even after abort; cancellation is control flow, not a displayed failure.
- Make reducers/initializers/render pure. Dispose client work on unmount and check React
  Strict Mode behavior. Deliver UI actions through the active route callback.
- Preserve native Web link, keyboard, focus, history and direct-URL behavior.
- Pin a compatible toolchain during bootstrap, commit the lockfile, and record actual
  versions and executed checks in PROJECT_CONTEXT.

## SHOULD

- Use direct controller-to-repository calls for simple reads; introduce UseCases for
  meaningful business behavior, aggregation, validation or reuse.
- Use local `core/designsystem` primitives and feature-local screen components.
- Prefer concrete screen/section types and small composed collaborators.
- Keep a workflow owner only when steps genuinely share state; specify its reset,
  re-entry, back and restoration behavior before implementing it.
- Recheck version-sensitive framework instructions against official documentation.

## MUST NOT

- Add BaseController, BaseRepository, BaseUseCase, BaseScreen, inherited test frameworks,
  generic MVI engines, generic `UiState<T>`, or interfaces for every class.
- Store actions, consumable wrappers, pending navigation or effect queues in ScreenState,
  URL state, browser storage, or durable workflow state. Do not promise exactly-once effects.
- Require Redux, RxJS, a DI container, a published UI package, monorepo tooling,
  GraphQL, or a UseCase for every repository method without a documented need.
- Put fetch/DTO handling in screens, expose raw Response/Error objects to UI, import
  server modules into client graphs, or mix client/server exports in barrel files.
- Pass repository instances or ordinary callbacks from Server Components into Client
  Components. Construct client collaborators inside the client composition root.
- Silently switch live mode to demo, contact a real API during build/tests, embed secrets
  in public environment variables, or copy proprietary source/branding/business rules.
- Use another feature's data implementation or another screen's controller as a dependency.

## Validation policy

Current commands: `npm run check`, `npm run docs:check`, and `npm run test:e2e`.
See [ADOPTION](docs/ADOPTION.md) for copying and removing the sample.

For documentation-only changes, inspect links/anchors, path claims, examples, ownership,
cross-document consistency, and target-versus-current wording. No app build is required.

For application changes, inspect package scripts first; run relevant behavioral tests,
typecheck, lint, and production build. For UI/navigation/server boundaries, run affected
browser scenarios against the production server. Required acceptance checks and intended
script names live in IMPLEMENTATION_PLAN. Do not fabricate scripts or successful results.
Record missing prerequisites, failures, environment and untested behavior honestly.

Maintain one owner for each detail: README for entry points; PROJECT_CONTEXT for facts;
ARCHITECTURE for mechanics; DECISIONS for rationale; WEB_CONTRACT for wire semantics;
IMPLEMENTATION_PLAN for delivery gates. Keep documentation English and linked.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
