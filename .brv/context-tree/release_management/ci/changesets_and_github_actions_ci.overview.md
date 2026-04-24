---
related: [release_management/ci/changesets_and_github_actions_ci.md, release_management/ci/changesets_and_github_actions_ci.abstract.md]
---
## Key points
- The repository’s release publishing flow is driven by **Changesets** and **GitHub Actions**.
- Publishing requires the **`NPM_TOKEN`** GitHub secret, configured with npm automation publish access.
- GitHub repository settings must have **Actions enabled** and workflow permissions set to **read/write** or explicitly granted.
- If the **Changesets release PR** cannot be created, GitHub Actions must be allowed to **create and approve pull requests**.
- The documented release sequence is: `pnpm changeset` → merge to `main` → GitHub opens a release PR → merge the release PR → npm publish via `NPM_TOKEN`.
- Several repository files were added or adjusted to support the flow, including Changesets config, CI/release workflows, `package.json`, `README.md`, `tsconfig.json`, and `.oxlintrc.json`.

## Structure / sections summary
- **Reason**: States the document’s purpose — to document release publishing requirements and flow.
- **Raw Concept**: Summarizes the implementation changes, affected files, and the end-to-end release process.
- **Narrative**:
  - **Structure**: Frames the knowledge as release automation prerequisites for GitHub Actions and Changesets.
  - **Dependencies**: Calls out repository settings, workflow permissions, and npm token requirements.
  - **Highlights**: Notes that publishing happens after the Changesets release PR is merged, and PR creation permissions may need adjustment.
  - **Rules**: Lists required settings for Actions, workflow permissions, and release PR creation.
  - **Examples**: Records validated checks/commands such as format, lint, typecheck, build, and dry-run pack.
- **Facts**: Enumerates key environment/project conditions and the full release flow.

## Notable entities, patterns, or decisions
- **`NPM_TOKEN`**: Required GitHub secret for npm publishing.
- **Changesets**: Used to manage user-facing changes and generate release PRs.
- **GitHub Actions workflows**: Separate **CI** and **release** workflows were added.
- **Release PR creation permission**: A notable operational requirement if PR generation fails.
- **Packaging/publishing decisions**:
  - `package.json` includes release scripts.
  - npm `publishConfig` is set for **public access** and **provenance**.
  - `README.md` was minimized for published package documentation.
  - `tsconfig.json` was narrowed so CI typechecking only includes `src`.
  - `.oxlintrc.json` was formatted to satisfy format checks.