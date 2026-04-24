---
related: [release_management/ci/husky_pre_commit_checks.md, release_management/ci/husky_pre_commit_checks.abstract.md]
---
## Key points

- Husky was added as a dev dependency to enforce repo-local pre-commit checks.
- `package.json` includes a `prepare: husky` script so the hook is set up automatically.
- The `.husky/pre-commit` hook runs `pnpm format:check`, `pnpm lint`, and `pnpm typecheck`.
- The project does **not** use `pnpm test` in the hook because there is no test script.
- Local ByteRover workspace state in `.brv/` is treated as generated/ephemeral and excluded from Git.
- `.brv/**` is also excluded from `oxfmt` to avoid formatting failures on generated state.
- The hook is intended to block commits when formatting, linting, or typechecking fail.

## Structure / sections summary

- **Reason**: States the purpose of the document—adding Husky pre-commit tooling and `.brv` exclusions.
- **Raw Concept**: Lists the implementation changes, touched files, and the workflow sequence.
- **Narrative**: Explains how Husky is wired into the repo, what checks the hook runs, and why `.brv/` is excluded.
- **Highlights**: Summarizes the practical outcome: commit prevention on failures without false positives from generated files.
- **Examples**: Shows the exact pre-commit command chain.
- **Facts**: Enumerates the key project facts in short, named entries.

## Notable entities, patterns, or decisions

- **Entities/files**: `package.json`, `.husky/pre-commit`, `.gitignore`, `.oxfmtrc.json`
- **Tooling**: Husky, `pnpm`, `oxfmt`
- **Decision**: Use existing local quality checks (`format:check`, `lint`, `typecheck`) rather than tests.
- **Pattern**: Treat `.brv/` as generated state, excluding it consistently from both version control and formatting.
