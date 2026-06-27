# Cold Storage: Development

Build tools, debugging patterns, and dev environment specifics.
**When to load:** debugging build failures, working with containers, writing scripts, troubleshooting dev tooling.

## Build & Compilation

- **Always run the build before declaring a change complete** — type errors surface here that editors miss at edit time. Compiled output goes to `dist/`; verify it's non-empty after build.

**Why:** Changes that type-check locally can still fail to compile. The build step is the real gate.
**How to apply:** Before reporting any TypeScript/compiled-project change as done, run `npm run build` (or your project's equivalent) and confirm `dist/` is populated.

## Container Runtime

- **Project uses `podman` and `podman-compose`, not Docker** — `docker` is not installed; never suggest it. Compose files work identically — substitute `podman-compose` for `docker compose`.

## Scripts & Dependencies

- **Put scripts in `scripts/`, not `/tmp`** — scripts in `scripts/` resolve repo `node_modules` naturally. Scripts run from `/tmp` fail with `MODULE_NOT_FOUND` because they can't reach the repo's dependency tree.

**How to apply:** Any utility or one-off script goes in `scripts/`. Use a naming convention like `scripts/scratch-*.ts` for throwaway scripts if you want to gitignore them.
