# Test Instrumentation & Timeline Tools

This directory contains tools for tracking async operation lifecycles in the `ParentalProvider` during tests.

## Quick Start (Local Dev)

Run the full check locally (same as CI):

```bash
npm run parental-link-check
```

This will:

1. Clear the instrumentation sink (`.test-debug/instrumented-events.log`)
2. Run the focused test (`__tests__/parental-auth-security.test.ts`)
3. Generate a linker report (`.test-debug/link_report.json`)
4. Fail if invariants are violated

Run only the linker fixture tests:

```bash
npm run parental-link-fixtures
```

## Files

- **`instrumented-events.log`** – Append-only sink written by `emitTestDebug()` in `stores/parentalStore.ts` during test runs. Contains per-line JSON (ISO | hr { ...event... }).
- **`link_active_ops_to_auth.cjs`** – Linker script that reads the sink and maps activeOps increments/decrements to the nearest prior `authenticate.entry` per instance. Produces JSON report for CI assertions.
- **`parse_act_timeline.cjs`** – Timeline parser (accepts JSON-per-line or human-formatted logs). Produces a relative timeline and quick checks per instance.
- **`translate_instrumented_to_parser_input.cjs`** – Optional translator that converts JSON-per-line to human-formatted logs (for backwards compatibility with older parser versions).
- **`run-linker-fixtures.cjs`** – Node test runner for linker unit tests (uses fixtures in `fixtures/`).
- **`fixtures/`** – Small JSON-per-line test files for linker unit tests.

## Environment Variables

- **`TEST_DEBUG_CLEAR=1`** – Truncate the instrumentation sink on first write in this process. Use in CI or local dev to start with a clean log.
- **`TEST_DEBUG_SINK=<path>`** – Override the sink file path (default: `.test-debug/instrumented-events.log`).
- **`TEST_DEBUG_DIR=<path>`** – Override the `.test-debug` directory (default: `.test-debug`).

## CI Workflow

The GitHub Actions workflow (`.github/workflows/parental-linker-check.yml`) runs:

1. Focused instrumented test with `TEST_DEBUG_CLEAR=1`
2. Linker fixture tests (`run-linker-fixtures.cjs`)
3. Linker on live sink to produce `link_report.json`
4. Assertion: fail if any auth bucket has decrements while `isMounted==false`
5. Upload `link_report.json` as artifact for triage

## Invariants Enforced

- No activeOps decrements should occur when `authenticate.entry.isMounted == false`.
- (Future) No activeOps decrements after unmount.

## Manual Commands

Run the linker on the live sink:

```bash
node .test-debug/link_active_ops_to_auth.cjs .test-debug/instrumented-events.log .test-debug/link_report.json json
```

Run the parser (accepts JSON-per-line directly now):

```bash
node .test-debug/parse_act_timeline.cjs .test-debug/instrumented-events.log
```

Translate to human format (optional, for legacy parsers):

```bash
node .test-debug/translate_instrumented_to_parser_input.cjs .test-debug/instrumented-events.log .test-debug/instrumented-events-for-parser.log
```

## How It Works

1. **Instrumentation**: `stores/parentalStore.ts` calls `emitTestDebug(obj)` during test runs to write per-line JSON to the sink and stdout.
2. **Events**: Each line is `ISO | hr { "op": "...", "instanceId": ..., ... }` (e.g., `authenticate.entry`, `activeOps.increment`, `activeOps.decrement`, `unmount.entry`).
3. **Linker**: Reads the sink, groups events by `instanceId`, sorts by `hr`, and buckets activeOps ops under the nearest prior `authenticate.entry`. Outputs JSON with per-bucket increments/decrements and `isMounted` state.
4. **CI Assertion**: Fail if any bucket shows decrements while `isMounted==false`.

## Troubleshooting

- **Old logs mixed in**: Set `TEST_DEBUG_CLEAR=1` before running tests.
- **Linker reports unexpected counts**: Check that the test completed successfully and the sink file is complete.
- **Parser shows "No events found"**: Ensure the input file exists and contains valid JSON-per-line (ISO | hr { ... }).
