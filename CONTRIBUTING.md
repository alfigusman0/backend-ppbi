# Contributing to API PPBI (api-ppbi)

Thank you for considering contributing! This document provides a short, practical guide to get you started contributing code, tests, docs, or issue reports.

## Getting started

1. Fork the repository and create a branch for your change:

```bash
git checkout -b feat/my-feature
```

2. Make small, focused commits and write clear commit messages.

3. Push your branch and open a Pull Request against `master`.

## Code style

- The project uses JavaScript (Node.js). Follow common Node/Express idioms.
- Keep functions small and prefer modular code inside `controllers/`, `routes/`, `helpers/` and `middleware/`.
- Use `camelCase` for variable and function names.

## Tests

- There are no automated tests yet. If you add features, please include at least one unit/integration test.
- If you add tests, include instructions in your PR and update the README if needed.

## Working with environment variables

- Do not commit secrets or API keys. Use `.env` locally and `.env-example` to show the required keys.

## Linting and code style

- This project includes a basic ESLint configuration. Please run the linter locally before opening a PR:

```bash
npm run lint
```

- Keep changes small and fix lint warnings (prefer warnings over errors). The CI workflow runs the linter on PRs.

## Commit messages and PRs

- Write clear commit messages. For teams that prefer conventional commits, feel free to follow that format, but it's not enforced yet.
- When opening a PR include a short description, testing steps, and link to any related issue.

## PR checklist

- [ ] I have run the linter locally and addressed issues
- [ ] I added or updated relevant documentation (if applicable)
- [ ] I opened an issue for large changes

## Code of Conduct

Please follow the `CODE_OF_CONDUCT.md` in the repository. All contributors are expected to abide by it.

## Pull request process

- Open an issue first for medium-large changes to discuss the approach.
- Keep PRs focused and include a short description of the change, rationale, and testing steps.
- Address review comments and rebase/merge as requested.

## Issues

- When opening issues, please include steps to reproduce, the environment (Node version), and relevant logs/error messages.

## Maintainers

- Maintainer: Alfi Gusman
- GitHub: https://github.com/alfigusman0

## Code of Conduct

Please follow respectful behaviour in issues and PR discussions. If you don't have a formal Code of Conduct file in this repo, follow common community norms.

---

If you'd like a more detailed contributor guide (conventional commits, linters, testing setup), I can add those next.