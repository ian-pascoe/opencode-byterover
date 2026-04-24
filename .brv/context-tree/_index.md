---
children_hash: 1884cbea8d2f11b66747698ac7b5ea0d2d8fc007df3d34746f7353b47e0b1079
compression_ratio: 0.8890429958391124
condensation_order: 3
covers: [release_management/_index.md]
covers_token_total: 721
summary_level: d3
token_count: 641
type: summary
---
# Release Management / CI

This area describes the repo’s release automation and local quality gates. It is organized as a two-layer safety model: **`husky_pre_commit_checks.md`** handles pre-commit validation, while **`changesets_and_github_actions_ci.md`** manages the post-merge Changesets release and npm publish flow.

## Core structure

- **Local-first validation, then automated release**
  - Husky blocks commits until formatting, linting, and typechecking pass.
  - GitHub Actions + Changesets handle release PR creation and publishing after merge.

- **Generated workspace state is excluded**
  - `.brv/` is treated as local/generated state.
  - It is excluded from Git and formatting to avoid false failures in checks.

## `changesets_and_github_actions_ci.md`

Covers the Changesets-driven release pipeline and GitHub Actions publish setup.

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

- **Verification checks**
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm pack --dry-run`

- **Related files**
  - `.changeset/config.json`
  - `.github/workflows/ci.yml`
  - `.github/workflows/release.yml`
  - `package.json`
  - `README.md`
  - `tsconfig.json`
  - `.oxlintrc.json`

## `husky_pre_commit_checks.md`

Covers the repo-local Husky pre-commit enforcement.

- **Hook flow**
  - install Husky
  - run `prepare: husky`
  - pre-commit executes:
    - `pnpm format:check`
    - `pnpm lint`
    - `pnpm typecheck`

- **Behavior and constraints**
  - relies on existing format, lint, and typecheck scripts
  - no `pnpm test` hook is used because no test script exists
  - `.brv/` is excluded from Git and from `oxfmt`

- **Related files**
  - `package.json`
  - `.husky/pre-commit`
  - `.gitignore`
  - `.oxfmtrc.json`

## Relationship between the child entries

- **`husky_pre_commit_checks.md`** protects changes before they enter the repo.
- **`changesets_and_github_actions_ci.md`** governs release and publish after merge.
- Together they form a release process that is locally validated, CI-driven, credential-gated, and insulated from generated `.brv/` noise.