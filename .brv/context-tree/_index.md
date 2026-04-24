---
children_hash: 0cf4b966b45eb109ac6789464cee4ffdb21086c83a4ba499466ee665e29d8965
compression_ratio: 0.9044776119402985
condensation_order: 3
covers: [release_management/_index.md]
covers_token_total: 670
summary_level: d3
token_count: 606
type: summary
---
# Release Management / CI

This level-3 view organizes the repository’s automation into two linked areas: **release publishing via Changesets + GitHub Actions** and **local quality gates via Husky pre-commit checks**. Across both, the repo relies on tooling, workflow configuration, and generated-state boundaries rather than manual release or commit discipline.

## Release publishing and workflow automation
See **changesets_and_github_actions_ci.md** and **changesets_release_pr_convention.md** for the full release path.

- Publishing is **Changesets-driven** and runs through **GitHub Actions** using `NPM_TOKEN`.
- The standard flow is:
  - `pnpm changeset`
  - merge to `main`
  - GitHub opens a release PR
  - merge the release PR
  - npm publish runs via `NPM_TOKEN`
- Required setup includes:
  - GitHub Actions enabled
  - workflow permissions for read/write or explicit permissions in workflow files
  - `NPM_TOKEN` with publish access
- If release PR creation fails, enable **“Allow GitHub Actions to create and approve pull requests.”**
- Relevant files: `.changeset/config.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `package.json`, `README.md`, `tsconfig.json`, `.oxlintrc.json`

### Release PR convention
See **changesets_release_pr_convention.md** for naming and version handling.

- Release PRs use the conventional commit style: `chore(release): v{version}`
- The workflow reads the bumped version after `changeset version` / `version-packages`
- That version is reused for both the PR title and commit message
- If no changesets exist, the workflow still falls back to `changesets/action@v1` for trusted-publishing release publish

## Pre-commit checks with Husky
See **husky_pre_commit_checks.md** for the local commit gate.

- Husky is wired through `package.json` via `prepare: husky`
- `.husky/pre-commit` runs:
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm typecheck`
- `pnpm test` is not used because no test script exists
- Local ByteRover state in `.brv/` is treated as generated state:
  - ignored in `.gitignore`
  - excluded from `oxfmt` via `.oxfmtrc.json`
- Relevant files: `package.json`, `.husky/pre-commit`, `.gitignore`, `.oxfmtrc.json`

## Shared pattern
- Both areas formalize repository behavior through configuration and scripts.
- Both enforce boundaries around generated/local state and rely on explicit permissions or tooling gates to control behavior.