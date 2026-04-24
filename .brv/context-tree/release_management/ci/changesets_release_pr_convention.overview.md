## Key points
- Changesets release PRs now use a conventional commit-style format: `chore(release): v{version}`.
- The release workflow reads the bumped package version after running `changeset version` / `version-packages` and uses that value in both the PR title and commit message.
- The workflow distinguishes between **release-creation mode** and **publish-only mode**.
- When changesets are present, it creates a versioned release commit/PR on `changesets-release/main`.
- If no changesets exist, the workflow still falls back to `changesets/action@v1` for trusted-publishing release publish.
- Example standardized release PR/commit: `chore(release): v1.2.3`.

## Structure / sections summary
- **Metadata**: title, summary, tags, related doc, timestamps.
- **Reason**: explains the purpose of documenting the release PR title and commit style change.
- **Raw Concept**: outlines the task, specific changes, workflow flow, timestamp, and author.
- **Narrative**:
  - **Structure**: describes the two workflow modes and how versioned release commits are generated.
  - **Dependencies**: lists required components such as Changesets workflow, `pnpm version-packages`, and `package.json` version output.
  - **Highlights**: emphasizes standardization to conventional commit style.
  - **Examples**: provides a concrete versioned commit title example.
- **Facts**: formalized statements about the commit convention, versioning behavior, and fallback behavior.

## Notable entities, patterns, or decisions mentioned
- **Conventional commit pattern**: `chore(release): v{version}`.
- **Workflow steps**: detect pending changesets → create `changesets-release/main` → run `version-packages` → read bumped version → commit/open PR.
- **Dependencies**:
  - Changesets workflow
  - `pnpm version-packages`
  - `package.json` version output
- **Fallback decision**: continue using `changesets/action@v1` for publish-only release handling when no changesets are present.
- **Document attribution**: authored by **Ian** on **2026-04-24**.