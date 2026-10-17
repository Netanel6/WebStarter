# Web Starter

A reusable, independently runnable **Next.js + React + TypeScript** application starter.
Feature-first architecture, explicit server/client boundaries, local UI primitives and a
removable catalog sample. Demo mode works without an account, API key or backend.

## Run

Use Node **24.16.0** and npm **11.13.0** (see `.nvmrc` and `packageManager`).

```sh
npm ci
npm run startDev
```

Open [localhost:3000](http://localhost:3000). The root redirects to `/catalog`.
The sample brand is **Objects**; replace it in `src/core/config/product.ts`.
No external fonts or images are fetched. The illustrations are decorative CSS.

## Start a new project

From this starter directory:

```sh
npm run starter:copy -- ../my-new-project my-new-project
cd ../my-new-project
npm ci
npm run dev
```

The copy command requires a new destination outside this folder. It updates package
identity and the sample display name, and resets project-specific validation claims.
It excludes dependencies, build/test output, Git history and local environment files.
It never overwrites an existing destination or installs anything automatically.
Manual copying is also supported; follow [ADOPTION](docs/ADOPTION.md).

## GitHub Desktop and branches

This folder is a local Git repository. In GitHub Desktop, choose **File → Add Local
Repository**, select this project folder, and add it. The initial branch is `main`.
Use **Publish repository** to create the GitHub remote, choosing the account,
repository name and visibility there.

Use **Current Branch → New Branch** to create a local feature branch. Commit changes,
then choose **Publish branch** to push that branch to GitHub. Subsequent commits use
**Push origin**. Local branches work without a remote; publishing requires a GitHub
repository and write access.

`.gitignore` excludes dependencies, generated output and local environment files;
`.env.example` and `package-lock.json` are tracked. `.gitattributes` normalizes text
line endings. The existing `.github/workflows/ci.yml` runs validation on pushes and
pull requests when GitHub Actions is enabled.

A project created with `starter:copy` has no Git history. In that new folder run
`git init -b main`, `git add .`, and `git commit -m "Initial commit"`, then add it to
GitHub Desktop using the same steps.

See GitHub's [publishing guide](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop)
and [branch guide](https://docs.github.com/en/desktop/making-changes-in-a-branch/managing-branches-in-github-desktop).

## Configure a backend

Copy `.env.example` to `.env.local` and set `DATA_MODE=live` plus an HTTPS
`API_BASE_URL` origin. The adapter calls `/v1/catalog`; its shape, errors and validation
are defined in [WEB_CONTRACT](docs/WEB_CONTRACT.md). Invalid live configuration fails
instead of silently returning demo data. Never put credentials in public env variables.

## Validate

```sh
npm run check        # types, lint/boundaries, format, unit/component tests, production build
npm run docs:check
npx playwright install chromium firefox webkit
npm run test:e2e     # builds and runs a controlled production-server browser suite
```

E2E owns ports 4317/4318 and a loopback mock upstream; it does not contact a real API.
Use `npm run test:e2e -- --project=chromium` for a focused browser run.
Firefox currently has a local macOS launch limitation; see
[verified results and limitations](docs/PROJECT_CONTEXT.md). To run both locally verified
engines, use `npm run test:e2e -- --project=chromium --project=webkit`.

### Start and stop from the project root

```sh
npm run startDev   # development server; stays attached to this terminal
npm run stopDev    # stop it from another terminal in the same project
npm run startProd  # build, then serve production; stays attached to this terminal
npm run stopProd   # stop production (also cancels an in-progress build)
```

Custom npm commands require `npm run`; `npm startDev` is not valid npm syntax.
Both modes default to port 3000. Pass `-- --port 3001` to a start command to change it.
Ctrl+C in the start terminal also stops the server. Repeated stop commands are harmless.
The manager identifies this project through a private local control socket, so it does
not kill arbitrary processes by port or PID. Stopping the wrong mode is refused.
Only one managed mode can run at a time; both default to port 3000.
Stop the managed server before running separate build/check/E2E commands.

Legacy `npm run dev` and `npm start` remain direct Next commands; stop those with Ctrl+C
in their original terminal. The new stop commands only control the new start commands.
From a different directory, use `npm --prefix /absolute/path/to/project run stopDev`
(or any of the other three commands).

Production requires a Node runtime;
static export, deployment and production authentication are not configured.

## Documentation

| File                                               | Purpose                                                    |
| -------------------------------------------------- | ---------------------------------------------------------- |
| [AGENTS](AGENTS.md)                                | Rules for agents changing this project                     |
| [ARCHITECTURE](docs/ARCHITECTURE.md)               | Ownership, dependencies, state, rendering and networking   |
| [PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md)         | Actual implementation, toolchain, evidence and limitations |
| [DECISIONS](docs/DECISIONS.md)                     | Decisions, tradeoffs and revisit conditions                |
| [WEB_CONTRACT](docs/WEB_CONTRACT.md)               | Catalog wire contract and error semantics                  |
| [IMPLEMENTATION_PLAN](docs/IMPLEMENTATION_PLAN.md) | Delivery phases and acceptance gates                       |
| [ADOPTION](docs/ADOPTION.md)                       | Copy, rename, remove sample and add a real feature         |

Optional UseCases, validators, workflow owners and external UI packages are not scaffolded
without actual behavior. This is an application foundation, not a general-purpose framework.
