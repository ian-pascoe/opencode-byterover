---
children_hash: bbb6813e6a175d94092eb92c8b5ebba9b0601f56568bc64b20ac107627f155be
compression_ratio: 0.8695652173913043
condensation_order: 2
covers: [ci/_index.md]
covers_token_total: 759
summary_level: d2
token_count: 660
type: summary
---
# Release Management / CI

This area documents the repo’s release automation and pre-commit quality gates. The child entries show a two-layer safety model: **`husky_pre_commit_checks.md`** enforces local commit-time validation, while **`changesets_and_github_actions_ci.md`** handles the post-merge release and npm publish pipeline.

## Core structural themes

- **Local-first validation, then automated release**
  - Husky runs checks before commits are accepted.
  - GitHub Actions + Changesets manage the release PR and publish flow after merge.

- **Generated workspace state is excluded**
  - `.brv/` is treated as local/generated state.
  - It is excluded from Git and formatting to avoid false failures in checks.

## `changesets_and_github_actions_ci.md`

Covers the **Changesets-driven release flow** and GitHub Actions publish setup.

- **Release sequence**
  - `pnpm changeset`
  - merge to `main`
  - GitHub opens a Changesets release PR
  - merge the release PR
  - npm publish using `NPM_TOKEN`

- **Operational requirements**
  - GitHub Actions must be enabled
  - workflow permissions must allow read/write, or workflows must declare explicit permissions
  - `NPM_TOKEN` must be an npm automation token with publish access
  - if release PR creation fails, enable **Allow GitHub Actions to create and approve pull requests**

- **Related files**
  - `.changeset/config.json`
  - `.github/workflows/ci.yml`
  - `.github/workflows/release.yml`
  - `package.json`
  - `README.md`
  - `tsconfig.json`
  - `.oxlintrc.json`

- **Verification checks**
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm pack --dry-run`

## `husky_pre_commit_checks.md`

Covers the **repo-local pre-commit enforcement** added with Husky.

- **Hook flow**
  - install Husky
  - run `prepare: husky`
  - pre-commit executes:
    - `pnpm format:check`
    - `pnpm lint`
    - `pnpm typecheck`

- **Behavior and constraints**
  - relies on existing format, lint, and typecheck scripts
  - no test script exists, so the hook uses these checks instead of `pnpm test`
  - `.brv/` is excluded from Git and from `oxfmt`

- **Related files**
  - `package.json`
  - `.husky/pre-commit`
  - `.gitignore`
  - `.oxfmtrc.json`

## Relationship between the child entries

- **`husky_pre_commit_checks.md`** guards changes before they enter the repo.
- **`changesets_and_github_actions_ci.md`** governs the automated release path after merges.
- Together they form a release process that is:
  - locally validated,
  - CI-driven,
  - gated by npm publishing credentials,
  - and protected from generated-state noise in `.brv/`.