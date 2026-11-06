# Project Rules & Preferences

- **Prompt Before Committing**: Ask the user for approval before running `git commit` or committing code changes for feature implementations or large changes. This does not apply to small changes addressing code review comments.
- **Use Approved NPM Scripts Over NPX**: Never invoke `npx` for tools that have pre-configured npm scripts (e.g., do NOT run `npx jest`, `npx prettier`, or `npx eslint`). Always use `npm test -- <path>`, `npm run format -- <path>`, or `npm run lint`. This ensures commands use already-approved permission prefixes and the project's exact dependency configuration.
- **Targeted Testing During Iteration**: During active development and review loops, only run tests for modified components/files (`npm test -- <path>`). Never run the global test suite (`npm run test`) during turn-by-turn iterations; reserve the full suite for the automated pre-push hook.
- **Rely on lint-staged for Formatting**: Do not run repository-wide `npm run format` during active development rounds; git commit hooks (`lint-staged`) automatically format staged files on commit.
- **Scoped Linting**: Limit lint checks during development to modified files only, reserving repository-wide `npm run lint` for final pre-PR verification.
