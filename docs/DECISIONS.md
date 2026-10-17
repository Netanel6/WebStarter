# Architecture decisions

This starter owns its choices independently. Update a decision with evidence and a revisit
condition when changing its contract; keep important migration rationale.

| ID   | Decision                                    | Reason / tradeoff                                                     | Revisit when                                                       |
| ---- | ------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| W001 | One Node/npm application                    | Small copy-and-configure workflow; boundaries enforced in source      | Independent consumers or ownership justify packages                |
| W002 | TypeScript strict, React, Next App Router   | Server rendering and direct routes; requires Node runtime             | A product explicitly favors static-only SPA delivery               |
| W003 | Feature presentation/domain/data            | Local ownership; core contains only actual shared code                | Measured reuse or coupling requires adjusted boundaries            |
| W004 | Concrete controller hooks and pure reducers | Explicit state/events/actions without a framework                     | Real cross-screen work needs a scoped owner                        |
| W005 | Callback UI effects, native links           | No replay; preserves browser navigation semantics                     | A genuine multi-consumer effect transport is required              |
| W006 | Explicit server/client factories            | Testable construction without a DI container                          | Construction complexity demonstrably warrants one                  |
| W007 | Optional UseCases and composition           | No forwarding-only layers or inherited base classes                   | Meaningful business logic needs a dedicated operation              |
| W008 | Direct SSR read and narrow refresh handler  | No self-HTTP or duplicate hydration read; two paths need parity tests | Freshness/traffic data justifies cache policy                      |
| W009 | Local design primitives                     | No published UI package or version lifecycle required                 | Real independent applications need shared UI ownership             |
| W010 | C1 catalog API                              | Complete removable example with runtime validation                    | Product API requires a deliberate adapter/migration                |
| W011 | Unit/component tests plus production E2E    | Fast logic checks and real runtime boundary evidence                  | Observed gaps/instability require another test layer               |
| W012 | Repository-local documentation              | Future work needs no historical chats                                 | File ownership becomes unclear; consolidate instead of duplicating |
| W013 | Details reuse collection state/controller   | C1 has no detail operation; avoid duplicated async behavior           | Detail-specific behavior warrants a separate model/controller      |
| W014 | Reversible UTF-16 code-unit hex route IDs   | Supports arbitrary opaque IDs; URLs are less readable                 | Product provides canonical URL-safe slugs                          |
| W015 | Local copy script, no generator framework   | Reliable reuse without secrets/history/build outputs                  | Multiple templates or migrations justify dedicated tooling         |

Implementation selections: Node 24.16.0/npm 11.13.0, Next 16.4.2, React 19.3.1 and the exact
lockfile baseline. Versions were selected from package metadata and validated together;
they are not promises about future latest versions. Keep dependency peer ranges compatible and validate upgrades with the actual checks.

The original local agent contract was present in this destination; the docs directory was
empty. Documentation was restored from the agreed Web specification and rewritten around
actual implementation. No unrelated repository is needed to build this project.

## W016 — Supported lint plugins without a compatibility bundle

Use ESLint 10 with explicit Next Core Web Vitals, TypeScript ESLint and React Hooks
recommended configurations. The bundled eslint-config-next currently includes plugins
whose peer ranges exclude ESLint 10; ESLint 9 is no longer supported. Explicit composition
avoids peer overrides while retaining the rules used by this application. It does not
claim to include every rule from the bundled React/accessibility plugins. Import boundaries
are checked separately and accessibility behavior is covered in browser tests.

The [official Next lint reference](https://nextjs.org/docs/app/api-reference/config/eslint)
documents direct plugin use and the peer-range limitation. Revisit when the bundled
configuration's plugin ranges support the active ESLint line without overrides.
