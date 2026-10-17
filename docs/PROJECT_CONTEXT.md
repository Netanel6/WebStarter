# Web Starter project context

## Purpose

Reusable Web application foundation to copy into new products. One independent Next.js/
React/TypeScript package with a removable catalog, local design system, explicit dependencies
and behavior tests. This is an implemented starter, not a deployed production product.

## Implementation — 2026-10-17

- Stack: Node 24.16.0, npm 11.13.0, Next 16.4.2, React/React DOM 19.3.1, TypeScript 6.0.3.
- Quality: ESLint 10.13.0 with explicit compatible Next/TypeScript/React Hooks plugins, Prettier 3.9.10, Vitest 5.0.5,
  Testing Library, Playwright 1.64.1. Exact transitive dependencies are in package-lock.json.
- Routes: `/` redirects to `/catalog`; list and opaque-token details render server-side;
  `/api/catalog` handles explicit refresh using the same server repository.
- UI: Objects sample brand, six demo items, decorative CSS artwork, local light/dark tokens,
  responsive/RTL layout, accessible labels/focus/status/error feedback.
- Data: demo default, explicit live HTTPS origin, validated C1/envelope JSON, no-store,
  15-second upstream/20-second browser deadlines, 1 MiB JSON limit, no automatic retry.
- State: pure screen reducer/controller, snapshot seeding, preserved refresh content,
  abort/generation cleanup and typed transient announcements; native navigation links.
- Reuse: clean copy command and detailed [ADOPTION](ADOPTION.md); no generator framework.
- Version control: local Git repository initialized on `main` for GitHub Desktop;
  `.gitattributes` normalizes text line endings and is included in starter copies.
  No GitHub remote has been configured or published during setup.
- CI: local GitHub Actions workflow with quality/docs/three-engine E2E checks, not yet run remotely.
- Local lifecycle: `startDev`, `startProd`, `stopDev`, and `stopProd` npm scripts;
  production start builds first. A project-scoped private control socket manages one
  foreground mode at a time without killing processes by port or persisted PID.
  Direct legacy Next commands remain unmanaged. See [README](../README.md).
- Runtime: Node server required. No hosting, auth, database, analytics or cloud account.

## Validation record — 2026-10-17

- Lifecycle scripts: development and production start returned HTTP 200 for `/catalog`;
  matching stop commands released their ports. Duplicate starts and wrong-mode stops
  were refused; repeated stops were harmless. Production start completed a fresh build.
  Typecheck, lint/boundaries and documentation checks passed after this addition.
  Lifecycle verification was performed on macOS; Windows behavior is unverified.

- `npm run check`: strict TypeScript, ESLint/import boundaries, formatting, 54 unit/component
  cases and a demo production build pass. Catalog and detail routes are dynamic.
- `npm run docs:check`: eight Markdown documents and local links/anchors checked.
- `npm run test:e2e -- --project=chromium --project=webkit`: 16 production-server scenarios
  pass. The harness verifies zero upstream calls during build. Coverage includes direct
  URLs, hydration request count, handler parity, refresh recovery, wait-gated retry,
  opaque IDs, navigation, RTL/responsive layout and server-data isolation.
- Visual review: desktop collection/details and a 390px dark RTL collection inspected.
  No page errors or horizontal overflow during the review. Screenshots are generated
  under `test-results/manual/` and excluded from product copies.
- Clean copy: package/display identity updated, output/secrets/history exclusions checked,
  existing destination refused without overwriting, followed by independent install,
  quality checks, tests, docs checks and production build.
- `npm audit --omit=dev`: no reported production dependency vulnerabilities at verification.

W01–W15 have local evidence for the implemented sample on Chromium/WebKit. This does not
establish Firefox support, real-backend compatibility, hosted CI success, a formal
accessibility certification or a production deployment.

### Firefox host limitation

Firefox 157 / Playwright 1.64.1 exits before tests on this Mac with “Could not find profile
folder,” including with an explicitly created profile. This matches the reported
[Playwright macOS app-data issue](https://github.com/microsoft/playwright/issues/42768).
Firefox remains configured in the full suite and Linux CI, but its checks are **not verified**
here. The full unfiltered E2E command fails on this host until that environment issue is
resolved; use the explicit Chromium/WebKit command above for locally verified coverage.
No system privacy settings or browser security controls were changed.

### Development dependency advisory

The Next lint plugin's transitive `fast-glob -> micromatch -> braces` chain is affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
There is no compatible automatic patch offered by npm at verification. It affects development
lint tooling; production audit is clean. Recheck for an upstream fix when updating tools.
This audit statement is not a complete application security assessment.

## Change ownership

[ARCHITECTURE](ARCHITECTURE.md) owns implementation boundaries, [DECISIONS](DECISIONS.md)
owns tradeoffs, [WEB_CONTRACT](WEB_CONTRACT.md) owns the sample API, and
[IMPLEMENTATION_PLAN](IMPLEMENTATION_PLAN.md) owns checks. Update this file when actual
capabilities, setup, versions or verification change. On product adoption, replace this
context with actual requirements and evidence.
