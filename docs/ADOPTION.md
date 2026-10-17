# Start a product from this starter

## Copy safely

Use `npm run starter:copy -- ../my-product my-product` from the starter root. The destination
must be new and outside the source tree. The script uses an explicit source allowlist,
updates package/lockfile root names and sample display name, and resets PROJECT_CONTEXT.
It does not install dependencies, initialize Git or publish anything.

For manual copy, include source, tests, fixtures, docs, scripts, package files, configuration,
CI and dotfiles. Exclude node_modules, .next, test-results, playwright-report, .git,
local .env files, logs and OS files. Retain .env.example. Run npm ci in the destination.

## Replace product identity

1. Set package name in package.json and package-lock.json (the script does this).
2. Update name/description in `src/core/config/product.ts`; root metadata uses this file.
3. Replace the Objects sample copy, visual artwork and colors with actual product content.
4. Add your own icons, metadata, domain and deployment configuration when needed.
5. Rewrite PROJECT_CONTEXT with users/problem, features, business rules, environments,
   actual validation and remaining decisions. Do not inherit the starter's test claims.

## Remove the sample

The catalog is deliberately removable. Remove `src/feature/catalog`, `src/app/catalog`,
`src/app/api/catalog`, catalog-specific app composition, `contracts/catalog`, catalog unit
and E2E tests, and the sample mock in `scripts/e2e.mjs`. Replace the root redirect, header
navigation, not-found copy and any remaining imports. Search for `catalog` and `Objects`.

Keep the reusable core only where it is useful. Replace the sample E2E scenarios and update
CI/scripts to the new behavior before calling the product validated. Update/remove C1 and
integration-manifest metadata if the product uses a different API. No domain package should
be kept solely to preserve an empty folder hierarchy.

## Add a feature

1. Define its domain model and repository interface only if data access requires one.
2. Implement transport/runtime decoding in data; return domain values and semantic failures.
3. Build screen content with explicit state and callbacks. Add a controller hook for
   meaningful state/async behavior, with abort, generation and owner cleanup policies.
4. Construct dependencies in app composition; server values cross as safe serializable data.
5. Use real links for ordinary navigation, route-owned actions for conditional UI effects.
6. Test observable behavior, relevant errors/cancellation and actual server/client integration.
7. Add UseCases/validators/workflows only when the feature contains that logic.

## Configure and validate

Demo is default. Live requires a C1-compatible HTTPS origin; replace the adapter deliberately
for another API. Never copy secrets or use STARTER_E2E in deployments. Add authentication,
authorization, persistence, request limits and mutation protection when the product needs them.

Run npm run check, npm run docs:check and relevant browser scenarios. Record real backend
validation separately from mock tests. Initialize the new repository/remote and configure
hosting only when ready; the starter does not assume a provider or deploy automatically.
