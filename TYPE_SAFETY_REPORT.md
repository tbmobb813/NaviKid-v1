# Type Safety Report - Phase 1.1 Complete

**Date**: 2025-11-25
**Status**: Baseline established

## Summary

- **Total Type Errors**: 123
- **Files Affected**: 20
- **Strict Mode**: ✅ Enabled (`noImplicitAny: true`, `strictNullChecks: true`)

## Error Breakdown by Category

### 1. Missing Type Declarations (TS2307) - ~12 errors

Backend dependencies missing type definitions:

- `fastify` and plugins (@fastify/cors, @fastify/rate-limit, @fastify/websocket)
- `pg` (PostgreSQL)
- `bcrypt`
- `pino` (logger)
- `expo-battery`
- `@sentry/node`

**Action**: Install @types packages or verify backend dependencies are installed

### 2. Implicit 'any' Parameters (TS7006) - ~70 errors

Functions with untyped parameters, primarily in:

- Backend route handlers (request, reply parameters)
- Test files (callback parameters)
- Utility functions

**Action**: Add explicit type annotations

### 3. Implicit 'any' Binding Elements (TS7031) - ~9 errors

Destructured parameters without types in:

- components/MapView.tsx (5 errors)
- components/MapOverlay.tsx (4 errors)

**Action**: Add interface/type definitions for props

### 4. Type Mismatches (TS2345, TS2339, TS2352) - ~10 errors

- OfflineAction type inconsistency between api.ts and offlineQueue.ts
- Missing API methods (put, post) on NaviKidApiClient
- Type conversion issues

**Action**: Fix type definitions, align interfaces

### 5. Index Signature Issues (TS7053, TS7017) - ~7 errors

- Dynamic property access without index signatures
- globalThis access in tests

**Action**: Add index signatures or use proper type guards

### 6. Other (TS2693, TS2304, TS2664) - ~15 errors

- MMKV used as value instead of type
- Missing 'regions' variable
- Various type assignment issues

## High-Impact Files (Priority Order)

| File                                    | Errors | Category       |
| --------------------------------------- | ------ | -------------- |
| backend/src/routes/emergency.routes.ts  | 15     | Backend Routes |
| backend/src/index.ts                    | 14     | Backend Core   |
| backend/src/routes/safezone.routes.ts   | 13     | Backend Routes |
| backend/src/routes/auth.routes.ts       | 13     | Backend Routes |
| backend/src/routes/location.routes.ts   | 11     | Backend Routes |
| **tests**/utils/core-validation.test.ts | 9      | Tests          |
| utils/auth.ts                           | 6      | Frontend Utils |
| components/MapView.tsx                  | 5      | Components     |
| backend/src/routes/offline.routes.ts    | 5      | Backend Routes |
| **tests**/test-utils.tsx                | 5      | Tests          |

## Recommended Fix Order

### Phase 1: Install Missing Dependencies (1 hour)

1. Check if backend has separate package.json
2. Install missing @types packages
3. Re-run typecheck to reduce noise from TS2307 errors

### Phase 2: Fix Backend Routes (10-15 hours)

All backend route files have similar pattern:

- Add proper Fastify types to request/reply parameters
- Create request/response body interfaces
- Should reduce ~50-60 errors

### Phase 3: Fix Component Props (2-3 hours)

- Create prop interfaces for MapView, MapOverlay
- Should fix ~10 errors

### Phase 4: Fix Type Definitions (5-8 hours)

- Align OfflineAction types
- Fix NaviKidApiClient interface
- Add missing methods
- Should fix ~10-15 errors

### Phase 5: Fix Test Files (3-5 hours)

- Add types to test callbacks
- Fix globalThis access
- Should fix ~20 errors

### Phase 6: Fix Remaining Issues (5-10 hours)

- Index signatures
- Edge cases
- Should fix remaining ~20 errors

## Next Steps

1. ✅ Phase 1.1 Complete - Strict mode enabled
2. 🔄 Phase 1.2 Starting - Fix high-impact files
3. ⏭️ Follow recommended fix order above

**Estimated Time to <10 errors**: 26-42 hours
