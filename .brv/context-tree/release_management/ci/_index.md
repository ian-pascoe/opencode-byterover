---
children_hash: eed952f364ba3159aaf800f09072702da8f71b67bb7d592452522e2c02fdcd09
compression_ratio: 0.5025678650036683
condensation_order: 1
covers: [changesets_and_github_actions_ci.md, husky_pre_commit_checks.md]
covers_token_total: 1363
summary_level: d1
token_count: 685
type: summary
---
# Release Management / CI

This level summarizes the repository’s release automation and pre-commit quality gates. The two child entries describe complementary safeguards: **`changesets_and_github_actions_ci.md`** covers the publish pipeline to npm, while **`husky_pre_commit_checks.md`** covers local commit-time validation and exclusion of generated workspace state.

## Key structural themes

- **Two-stage release safety**
  - Local validation happens before commit via Husky.
  - Remote release automation happens after merge via GitHub Actions + Changesets.

- **Generated state separation**
  - `.brv/` is treated as local/generated workspace state.
  - It is excluded from Git and formatting to avoid false failures.

## `changesets_and_github_actions_ci.md`

- Documents the repo’s **Changesets-driven release flow** and GitHub Actions publish setup.
- Release flow:
  - `pnpm changeset` for a user-facing change
  - merge to `main`
  - GitHub opens a Changesets release PR
  - merge release PR
  - npm publish via `NPM_TOKEN`
- Key dependencies / requirements:
  - GitHub Actions must be enabled
  - workflow permissions must allow read/write, or workflows must specify explicit permissions
  - repository secret `NPM_TOKEN` must be an npm automation token with publish access
  - if the release PR cannot be opened, enable **Allow GitHub Actions to create and approve pull requests**
- Files involved:
  - `.changeset/config.json`
  - `.github/workflows/ci.yml`
  - `.github/workflows/release.yml`
  - `package.json`
  - `README.md`
  - `tsconfig.json`
  - `.oxlintrc.json`
- Verification included repo checks such as `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm pack --dry-run`.

## `husky_pre_commit_checks.md`

- Documents the addition of **Husky** for repo-local pre-commit enforcement.
- Hook flow:
  - install Husky
  - run `prepare: husky`
  - pre-commit executes:
    - `pnpm format:check`
    - `pnpm lint`
    - `pnpm typecheck`
- Key dependencies / behavior:
  - relies on existing format, lint, and typecheck scripts
  - the project has no test script, so the hook uses the existing checks instead of `pnpm test`
  - `.brv/` is considered generated local state and is excluded from Git and from `oxfmt`
- Files involved:
  - `package.json`
  - `.husky/pre-commit`
  - `.gitignore`
  - `.oxfmtrc.json`

## Relationship between the entries

- `husky_pre_commit_checks.md` protects the repo before commits land.
- `changesets_and_github_actions_ci.md` governs the automated publish path after merges.
- Together they establish a release process that is:
  - locally validated,
  - CI-driven,
  - token-gated for npm publishing,
  - and resilient against generated-state noise from `.brv/`.