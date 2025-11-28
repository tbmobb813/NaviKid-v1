# CI layout and guidance

This repository uses multiple GitHub Actions workflows under `.github/workflows/` to keep CI focused and fast.

Key points:

- Workflows are split by concern (frontend, backend, deploy, security). This keeps jobs small and allows path filters so only relevant workflows run on changes.
- There should be a single source of truth for workflows at the repository root: `.github/workflows/` (avoid duplicate workflows inside subfolders like `backend/.github/workflows`).
- Local editor integration: ensure your editor runs ESLint with the repository root as the working directory. The recommended VSCode setting is in `.vscode/settings.json`.

Frontend-specific notes:

- Use the `lint` and `typecheck` scripts defined in `package.json` for CI. The frontend workflow runs `npm ci`, then `npm run lint` and `npm run typecheck`.
- For local development, prefer `eslint_d` (daemon) to avoid cold-start overhead.

If you'd like, I can convert repeated steps into a reusable workflow to remove duplication between the current workflows.
