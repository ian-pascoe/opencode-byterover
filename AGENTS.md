# AGENTS.md - Agent instructions

## Project Shape

- This is a single-package ESM TypeScript OpenCode plugin; the runtime entrypoint is `src/index.ts`, bundled by Rolldown from `src/index.ts` to `dist/index.js`.
- The plugin wires OpenCode hooks for `session.idle`, `experimental.session.compacting`, and `experimental.chat.system.transform` to `@byterover/brv-bridge`.
- Tests live beside the entrypoint in `src/index.test.ts` and mock `@byterover/brv-bridge`; use them to verify plugin behavior without a real `brv` binary.

## Commands

- Use `pnpm` only; the repo pins `pnpm@10.33.2` and CI uses Node.js 24.
- Install with `pnpm install --frozen-lockfile` when matching CI exactly.
- Local checks: `pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`.
- Focused tests: `pnpm test src/index.test.ts` or `pnpm test -t "test name"`.
- Pre-commit currently runs `pnpm format:check`, `pnpm lint`, `pnpm test`, then `pnpm typecheck`; CI runs format, lint, typecheck, test, then build.

## Generated And Local State

- `dist/` is build output and is ignored; do not edit it by hand.
- `.brv/` is ByteRover workspace state. Oxlint and oxfmt ignore it, and the plugin bootstraps `.brv/.gitignore`; avoid treating context-tree files as source unless the task is specifically about ByteRover memory.
- `.changeset/*.md` files are release notes, not prose docs; add one for user-facing package changes that need publishing.

## Release And CI

- Release-relevant PR titles (`feat`, `fix`, `perf`, `refactor`, `revert`, or any breaking-change `!`) must include a Changeset; `.github/workflows/changeset-check.yml` enforces this.
- The release workflow reads the next package version and creates release PRs titled and committed as `chore(release): v{version}`.
- Publishing is via Changesets trusted publishing on merges to `main`; `publishConfig.provenance` is enabled and the release job needs GitHub `id-token: write`.

---

This is a living document; update it as needed to reflect the current state of the project and onboarding needs.
