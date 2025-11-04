# NaviKid Style Guide (scaffold)

This is a compact style guide to keep docs, tests, and code consistent across the repo.
Add, extend, or move sections into `docs/` when convenient.

## Markdown

- Use code-fenced blocks with a language tag (for example: three backticks followed by the language name, e.g. ts, json, or bash).
- Line length: prefer <= 120 characters. Some legacy files use MD013=200; CI may enforce project-specific limits — follow existing rules.
- Headings: use sentence-style Title Case for section headings. Prefer H2 (`##`) for top-level sections in docs.
- Blank lines: add one blank line between paragraphs and around fenced code blocks (avoid MD032 warnings).
- Add short front-matter note when archiving files: include original path and reason for archive.

## Documentation files

- Canonical docs live under `docs/`; root-level files may be short pointer-stubs referencing `docs/`.
- When consolidating, keep an index entry in `docs/INDEX.md` and add a short changelog entry in `docs/changelogs/`.
- Run `npx markdownlint-cli "**/*.md"` locally if CI flags markdownlint failures.

## TypeScript / Types

- Keep runtime casts (`as any`) to a minimum. Prefer declaration merging or small `.d.ts` files under `types/` to document external shapes (we already have `types/expo-constants.d.ts`).
- Add any new type augmentations to `types/` and reference them in `types/README.md`.
- Run `npx -y tsc --noEmit` before opening PRs that change runtime code.

## Tests

- Prefer deterministic tests. Avoid mixing fake and real timers within the same test file without careful scoping.
- For provider-backed hooks, prefer a small Host component that mounts the provider and exposes a ref to the store rather than `renderHook`+provider patterns that can cause unmounted-renderer flakiness.
- Wrap React state updates in `act(...)` and await promises outside `act` where possible to avoid overlapping-act warnings.
- Keep heavy integration tests (performance, GTFS, transit adapters) as separate CI jobs to avoid slowing unit test runs.

## Logging and Console

- Tests may assert on console output sparingly; prefer explicit state assertions where possible. If you must assert logs, use spies and restore them after each test.

## PR & Commit conventions

- Commit message: present-tense summary, e.g. `fix: stabilize parental auth tests` or `docs: add STYLE_GUIDE.md`.
- PR description: include the problem, the approach, and a short checklist (types affected, tests added/updated, CI run green).
- Add a short entry to `docs/CONSOLIDATION_PROPOSAL.md` or `docs/INDEX.md` when moving or archiving docs.

## CI expectations

- CI already runs TypeScript typecheck and Jest tests (multiple workflows present). Avoid creating duplicate test workflows; instead extend or reuse the existing `tests.yml` / `ci.yml`.
- Add markdownlint to a repo-level workflow if you want docs linting globally — check `.github/workflows/ci-postgres-transit-adapter.yml` which already runs `npx markdownlint-cli` for the server.

## Where to add new rules

- If you want automated linting (markdownlint or style checks), add a dedicated step to the existing `ci.yml` tests job or `tests.yml` summary rather than a new workflow.

---
If you'd like, I can expand any section into a more formal `docs/STYLE_GUIDE.md`, add markdownlint config, or open a PR with this scaffold. Which one do you want next?
