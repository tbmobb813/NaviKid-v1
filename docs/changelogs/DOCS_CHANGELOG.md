# Documentation Standardization Changelog

This changelog tracks structural, lint, and consistency improvements applied to the
documentation set. It explains how docs were standardized (rules, patterns, exemptions)
rather than product feature changes. Add new dated sections at the top.

---

## 2025-11-03  Documentation De-duplication and Cleanup

Goal: Reduce clutter by removing root-level duplicates of documents that already exist under `docs/`, and standardize canonical locations for key guides.

Actions

- Removed duplicate Markdown files from repository root in favor of their `docs/` counterparts:
  - QUICK_START.md > docs/QUICK_START.md
  - RUNNING_THE_APP.md > docs/RUNNING_THE_APP.md
  - OFFLINE_MONITORING_IMPLEMENTATION.md > docs/OFFLINE_MONITORING_IMPLEMENTATION.md
  - OFFLINE_MONITORING_QUICK_REFERENCE.md > docs/OFFLINE_MONITORING_QUICK_REFERENCE.md
  - NEW_FEATURES.md > docs/NEW_FEATURES.md
  - NEW_FEATURES_AI.md > docs/NEW_FEATURES_AI.md
  - IMPLEMENTATION_COMPLETE.md > docs/IMPLEMENTATION_COMPLETE.md
  - COMPLETE_IMPLEMENTATION_SUMMARY.md > docs/COMPLETE_IMPLEMENTATION_SUMMARY.md
  - COMPLETE_SOLUTION_SUMMARY.md > docs/COMPLETE_SOLUTION_SUMMARY.md
  - DEPENDENCY_FIX_SUMMARY.md > docs/DEPENDENCY_FIX_SUMMARY.md
  - ORS_OTP2_IMPLEMENTATION_SUMMARY.md > docs/ORS_OTP2_IMPLEMENTATION_SUMMARY.md
  - MAPLIBRE_INTEGRATION_COMPLETE.md > docs/MAPLIBRE_INTEGRATION_COMPLETE.md
  - BUN_VS_NODEJS_PERFORMANCE_REPORT.md > docs/BUN_VS_NODEJS_PERFORMANCE_REPORT.md
  - BUILD_APK_GUIDE.md > docs/BUILD_APK_GUIDE.md
  - OPTION_1_INTEGRATION_COMPLETE.md > docs/OPTION_1_INTEGRATION_COMPLETE.md
  - OPTION_1_STATUS_COMPLETE.md > docs/OPTION_1_STATUS_COMPLETE.md
  - CURRENT_STATUS.md > docs/CURRENT_STATUS.md

Notes

- Canonical docs now live under `docs/`. Root README already links to the `docs/` hub.
- No content was lost; only duplicate copies at the root were removed.

Next Steps (optional)

- Group long-form implementation summaries under a single canonical summary and archive older variants in `docs/archive/`.
- Add a short Docs Map section in `docs/INDEX.md` to highlight canonical guides for: Getting Started, Builds, Performance, Offline/Monitoring, MapLibre, Routing.


## 2025-10-07  Repository-Wide Markdown Standardization Pass

**Goal:** Establish a clean markdown lint baseline (excluding third-party content) so CI
can enforce formatting and future PRs stay focused on substance.

### Scope

Applied to all first-party markdown under:

- `docs/`
- `server/` (Markdown files only)
- `templates/`
  (removed `bun-tests/`  tests consolidated under `__tests__/`)
- Root-level project status / reports

Explicitly excluded:

- `node_modules/` (via `.markdownlintignore`)
- Third-party or vendored dependency docs

### Key Standardization Actions

| Category          | Changes Applied                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Heading structure | Normalized heading levels (MD001), removed duplicate H1s (MD025), converted emphasis to headings (MD036).                              |
| Spacing & layout  | Added required blank lines (MD022, MD032); removed extra blank lines (MD012).                                                          |
| Lists             | Fixed indentation (MD007/MD005), consistent ordered list style (MD029), ensured separation.                                            |
| Code fences       | Added languages (MD040), enforced surrounding blank lines (MD031), standardized common languages (bash, typescript, http, text, yaml). |
| Tables            | Repaired split rows, ensured proper pipe usage; avoided multi-line cell hacks.                                                         |
| Line length       | Reflowed prose/table cells to <= 200 chars (MD013) for non-legal docs.                                                                 |
| Artifacts         | Removed trailing spaces (MD009), added final newlines (MD047), removed hard tabs (MD010).                                              |
| Duplicates        | Renamed duplicate headings (MD024) e.g. consolidated repeated "Test Coverage".                                                         |
| URLs              | Converted bare URLs to angle bracket or markdown links (MD034).                                                                        |
| Inline HTML       | Eliminated unnecessary HTML (MD033).                                                                                                   |
| Suppressions      | Local inline MD013 disable only for legal drafts to preserve counsel review format.                                                    |
| Config            | Added `.markdownlintignore` for `node_modules/`; kept relaxed MD013 limit (200).                                                       |

### Representative Fix Examples

- `server/README.md`: Fixed malformed code fences; added languages; normalized list numbering.
- `server/DEPLOY.md`: Wrapped long paragraphs; added blank lines; converted bare URLs.
- `templates/IMPLEMENTATION_GUIDE.md`: Added spacing; code fence languages; removed trailing spaces.
- `docs/OFFLINE_MONITORING_IMPLEMENTATION.md`: Resolved duplicate heading; added language to stats block.
- `docs/conversation-summary-2025-10-01.md`: Fixed split table row; abbreviated long cell.
- `bun-tests/README.md`: (removed) tests consolidated under `__tests__/`.

### Exemptions & Rationale

| Area                                                      | Exemption             | Rationale                                                       |
| --------------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| Legal drafts (`privacy-policy.md`, `terms-of-service.md`) | MD013 disabled inline | Maintain original legal paragraph formatting for review cycles. |

### Lint Configuration Snapshot

```json
{
  "MD013": { "line_length": 200 },
  "MD022": true,
  "MD032": true,
  "MD040": true,
  "MD029": true
}
```


Ignore file:

```text
node_modules/
```


### Final Status

- All first-party markdown files pass lint with the current configuration.
- Ready to add CI markdownlint step.

### Recommended Next Steps

1. Add CI job: `npx markdownlint-cli "docs/**/*.md" "server/**/*.md" "templates/**/*.md" -c .markdownlint.json`.
2. Consider `lint-staged` hook to lint only changed markdown files.
3. Revisit MD013 legal suppressions post counsel approval for wrapped formatting.
4. Add `STYLE_GUIDE.md` (headings, code fence languages, tables, line length guidance).
5. Periodically re-run full lint to catch regressions.

### Verification

Executed full lint across: `docs/`, `server/`, `templates/`.
Result: 0 violations (legal MD013 lines intentionally suppressed inline).

---

_End of 2025-10-07 documentation standardization entry._
