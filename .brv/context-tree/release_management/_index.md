---
children_hash: 0c970e81d042036723d5a22364ed01d05c71ac83d7e4ac0bb6c759160fa042dc
compression_ratio: 0.799475753604194
condensation_order: 2
covers: [ci/_index.md]
covers_token_total: 763
summary_level: d2
token_count: 610
type: summary
---
# Release Management / CI

This d2 summary condenses the repo’s automation into two linked controls: **Changesets + GitHub Actions release publishing** and **Husky pre-commit quality gates**. The core pattern is consistent: repository behavior is enforced through tooling, workflow configuration, and generated-state boundaries rather than manual release steps.

## Release publishing and workflow automation
See **changesets_and_github_actions_ci.md** and **changesets_release_pr_convention.md** for the full release path.

- Publishing is **Changesets-driven** and runs through **GitHub Actions** using `NPM_TOKEN`.
- Required setup includes:
  - GitHub Actions enabled
  - workflow permissions allowing read/write or explicit permissions in workflow files
  - `NPM_TOKEN` as an npm automation token with publish access
- Standard flow:
  - `pnpm changeset`
  - merge to `main`
  - GitHub opens a release PR
  - merge the release PR
  - npm publish runs via `NPM_TOKEN`
- If release PR creation fails, enable **“Allow GitHub Actions to create and approve pull requests.”**
- Relevant files: `.changeset/config.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `package.json`, `README.md`, `tsconfig.json`, `.oxlintrc.json`

### Release PR convention
See **changesets_release_pr_convention.md** for naming and version handling.

- Release PRs use conventional commit style: `chore(release): v{version}`
- The workflow reads the bumped version after `changeset version` / `version-packages`
- That version is reused for both PR title and commit message
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
- Both areas formalize automation through repo configuration and scripts.
- Both preserve boundaries around generated/local state and rely on explicit permissions or tooling gates to control behavior.