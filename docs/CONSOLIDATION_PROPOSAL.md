# Documentation Consolidation Proposal

Last updated: 2025-11-03
Owner: Docs/Engineering
Status: Proposal (no destructive changes applied yet)

This proposal inventories duplicate and overlapping documents, then recommends specific actions: merge, condense, archive, or delete.
Goal: a single-source-of-truth under `docs/` with minimal root-level clutter.

---

## Principles

- Canonical location: keep authoritative copies in `docs/`.
- Non-destructive first: replace root duplicates with tiny pointers to the canonical doc.
- Archive for history: move old status/"complete" summaries into `docs/archive/` and link from `docs/INDEX.md`.
- Reduce near-duplicates: merge multiple “implementation/solution summary” docs into one current summary.

---

## A. Root ↔ docs duplicates (keep docs/ canonical)

Replace each root file with a 2–3 line pointer to the `docs/` version (like current `QUICK_START.md`).

- BUILD_APK_GUIDE.md → docs/BUILD_APK_GUIDE.md
- BUN_VS_NODEJS_PERFORMANCE_REPORT.md → docs/BUN_VS_NODEJS_PERFORMANCE_REPORT.md
- CURRENT_STATUS.md → docs/CURRENT_STATUS.md
- RUNNING_THE_APP.md → docs/RUNNING_THE_APP.md
- USB_DEBUG_GUIDE.md → docs/USB_DEBUG_GUIDE.md
- OPTION_1_INTEGRATION_COMPLETE.md → docs/OPTION_1_INTEGRATION_COMPLETE.md
- OPTION_1_STATUS_COMPLETE.md → docs/OPTION_1_STATUS_COMPLETE.md
- NEW_FEATURES.md → docs/NEW_FEATURES.md
- NEW_FEATURES_AI.md → docs/NEW_FEATURES_AI.md
- FIXES_COMPLETE.md → docs/FIXES_COMPLETE.md
- DEPENDENCY_FIX_SUMMARY.md → docs/DEPENDENCY_FIX_SUMMARY.md
- ORS_OTP2_IMPLEMENTATION_SUMMARY.md → docs/ORS_OTP2_IMPLEMENTATION_SUMMARY.md
- MAPLIBRE_INTEGRATION_COMPLETE.md → docs/MAPLIBRE_INTEGRATION_COMPLETE.md
- IMPLEMENTATION_COMPLETE.md → docs/IMPLEMENTATION_COMPLETE.md

Rationale: we verified these pairs are identical or materially equivalent. Keeping one source prevents drift.

Action type: Condense (root) → Pointer stub

---

## B. Merge near-duplicate "summary/complete" docs

There are multiple overlapping “implementation is complete” style documents:

- IMPLEMENTATION_COMPLETE.md
- COMPLETE_IMPLEMENTATION_SUMMARY.md
- COMPLETE_SOLUTION_SUMMARY.md
- FINAL_IMPLEMENTATION_SUMMARY.md (docs/)

Recommendation:

- Keep a single canonical: docs/FINAL_IMPLEMENTATION_SUMMARY.md
- Merge unique content from the other three into that file (one-time edit)
- Move the superseded ones into `docs/archive/implementation-summaries/` with a top banner linking to the canonical

Action type: Merge + Archive

---

## C. Security docs consolidation

- Root: SECURITY_IMPLEMENTATION_SUMMARY.md
- Docs: SECURITY_HARDENING_COMPLETE.md

Recommendation:

- Merge root security summary into `docs/SECURITY_HARDENING_COMPLETE.md` under clearly-labeled sections (e.g., PIN hashing, encryption, rate limiting)
- Replace root file with a pointer stub

Action type: Merge + Condense (root to pointer)

---

## D. Offline monitoring/validation docs

- Root: OFFLINE_MONITORING_IMPLEMENTATION.md, OFFLINE_MONITORING_QUICK_REFERENCE.md
- Docs: OFFLINE_VALIDATION_AND_MONITORING.md, monitoring-runbook.md

Recommendation:

- Keep `docs/OFFLINE_VALIDATION_AND_MONITORING.md` as the single technical guide
- Keep `docs/monitoring-runbook.md` as the operational runbook
- Convert the two root files into short pointer stubs (or archive if content is fully duplicated)

Action type: Condense (root) or Archive

---

## E. MapLibre docs

- MAPLIBRE.md (overview/how-to)
- docs/MAPLIBRE_INTEGRATION_GUIDE.md (focused ORS + MapLibre quick guide)
- MAPLIBRE_INTEGRATION_COMPLETE.md (root + docs) (status/summary)

Recommendation:

- Keep the two docs in `docs/` as canonical:
  - `docs/MAPLIBRE_INTEGRATION_GUIDE.md` (how to)
  - `docs/MAPLIBRE_INTEGRATION_COMPLETE.md` (status summary)
- Add a one-line link from `MAPLIBRE.md` to the guide, or move/rename `MAPLIBRE.md` to `docs/` and merge intro material into the guide’s top section.
- Replace the root copy of `MAPLIBRE_INTEGRATION_COMPLETE.md` with a pointer.

Action type: Condense (root) and optionally Merge intro

---

## F. Performance docs

- Root: BUNDLE_ANALYSIS.md
- Docs: PERFORMANCE_OPTIMIZATION.md

Recommendation:

- Treat `BUNDLE_ANALYSIS.md` as a point-in-time report. Move to `docs/performance/` and link it from `PERFORMANCE_OPTIMIZATION.md` under “Case Studies/Reports”.

Action type: Archive (structured) and Cross-link

---

## G. CI/changelog and commands

- CI_FIX_SUMMARY.md (root)
- DOCS_CHANGELOG.md (root)
- README_COMMANDS.md (slash-commands helper)

Recommendation:

- Move CI/Docs changelogs to `docs/changelogs/` and add them to `docs/INDEX.md`.
- Either keep `README_COMMANDS.md` at root for contributor discovery, or move into `docs/README.md` as a section; if kept at root, add a link in `README.md`.

Action type: Archive (structured) or Integrate

---

## H. Conversation/history docs

- docs/CONVERSATION_SUMMARY.md
- docs/conversation-summary-2025-10-01.md

Recommendation:

- Move to `docs/archive/conversations/` to reduce noise, and add a small link list from `docs/INDEX.md` if needed.

Action type: Archive (structured)

---

## I. Already consolidated

- QUICK_START.md at root already points to `docs/QUICK_START.md` — keep as-is.

---

## J. Deletion candidates (safe to remove if archived elsewhere)

Only after creating pointer stubs or moving to archive:

- Duplicate full-text root copies that are 1:1 with `docs/` AND are linked from `docs/INDEX.md` can be deleted entirely after one release cycle. Candidates:
  - BUILD_APK_GUIDE.md
  - BUN_VS_NODEJS_PERFORMANCE_REPORT.md
  - CURRENT_STATUS.md
  - RUNNING_THE_APP.md
  - USB_DEBUG_GUIDE.md
  - NEW_FEATURES.md
  - NEW_FEATURES_AI.md
  - FIXES_COMPLETE.md
  - DEPENDENCY_FIX_SUMMARY.md
  - ORS_OTP2_IMPLEMENTATION_SUMMARY.md
  - MAPLIBRE_INTEGRATION_COMPLETE.md
  - IMPLEMENTATION_COMPLETE.md
  - OPTION*1*\*.md (both)

Note: prefer a minimal pointer file at root for high-traffic topics (e.g., QUICK_START) if that aids discoverability.

---

## K. Execution plan (non-destructive, 2 PRs)

PR 1 — Non-destructive consolidation

- Create `docs/archive/{implementation-summaries,conversations,performance}/`
- Move historical/point-in-time docs into archive folders
- Replace root duplicates with 2–3 line pointer stubs to `docs/`
- Update `docs/INDEX.md` to link archive sections

PR 2 — Content merge + cleanup

- Merge security content into `docs/SECURITY_HARDENING_COMPLETE.md`
- Merge implementation summaries into `docs/FINAL_IMPLEMENTATION_SUMMARY.md`
- Optionally merge `MAPLIBRE.md` intro into `docs/MAPLIBRE_INTEGRATION_GUIDE.md`
- After one release cycle, delete any empty pointer files not needed for discoverability

---

## L. Acceptance criteria

- All canonical docs reside under `docs/` and are linked from `docs/INDEX.md`
- No duplicate full-text root/document pairs remain
- Historical docs preserved under `docs/archive/` with short banners
- New contributors can find “how to run/build/test” from either root `README.md` or `docs/INDEX.md` in <10 seconds

---

## M. Out of scope (future)

- Generating a mkdocs/Docusaurus site from `docs/` (nice-to-have)
- Enforcing docs linting in CI
- Autolinking docs in PR templates
