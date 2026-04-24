---
children_hash: 295be5211fe93f35e5cd359399809c0e3a581dc0e2541e5cd55e75bc563f7835
compression_ratio: 0.3609341825902335
condensation_order: 1
covers: [changesets_and_github_actions_ci.md, changesets_release_pr_convention.md, husky_pre_commit_checks.md]
covers_token_total: 1884
summary_level: d1
token_count: 680
type: summary
---
# Release Management / CI

This d1 summary covers the repository’s release automation and commit-quality gates. The knowledge is split into two main areas: **release publishing via Changesets + GitHub Actions** and **local pre-commit enforcement via Husky**.

## Release publishing and workflow automation
See **changesets_and_github_actions_ci.md** for the full publishing setup and **changesets_release_pr_convention.md** for the PR naming/commit rule.

- The release pipeline is **Changesets-driven** and publishes through **GitHub Actions** using `NPM_TOKEN`.
- Required prerequisites:
  - GitHub Actions must be enabled.
  - Workflow permissions must allow read/write, or explicit permissions must be set in the workflow.
  - The repo secret `NPM_TOKEN` must be an npm automation token with publish access.
- The documented flow is:
  - `pnpm changeset`
  - merge to `main`
  - GitHub opens a release PR
  - merge the release PR
  - npm publish runs via `NPM_TOKEN`
- If the Changesets release PR fails to open, enable **“Allow GitHub Actions to create and approve pull requests.”**
- Relevant repo files:
  - `.changeset/config.json`
  - `.github/workflows/ci.yml`
  - `.github/workflows/release.yml`
  - `package.json`
  - `README.md`
  - `tsconfig.json`
  - `.oxlintrc.json`

### Release PR convention
- Release PRs now use conventional commit style: `chore(release): v{version}`.
- The workflow reads the bumped package version after `changeset version` / `version-packages` and uses that version for both the PR title and commit message.
- This creates a standardized release-creation path when changesets are present.
- If no changesets exist, the workflow still falls back to `changesets/action@v1` for trusted-publishing release publish.

## Pre-commit checks with Husky
See **husky_pre_commit_checks.md** for the repo-local commit gate setup.

- Husky was added as dev tooling and wired through `package.json` with `prepare: husky`.
- The `.husky/pre-commit` hook runs:
  - `pnpm format:check`
  - `pnpm lint`
  - `pnpm typecheck`
- The project does not rely on `pnpm test` here because no test script exists.
- Local ByteRover state in `.brv/` is treated as generated state:
  - ignored in `.gitignore`
  - excluded from `oxfmt` via `.oxfmtrc.json`
- Relevant repo files:
  - `package.json`
  - `.husky/pre-commit`
  - `.gitignore`
  - `.oxfmtrc.json`

## Shared pattern across both areas
- Both entries emphasize **automation that depends on repository configuration and tooling scripts** rather than ad hoc manual release steps.
- Both preserve the repository’s generated/local state boundaries:
  - `.brv/` excluded from Git/formatting
  - release publishing gated by workflow permissions and secrets