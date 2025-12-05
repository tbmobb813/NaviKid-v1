# NaviKid v1 - AI Coding Agent Instructions

NaviKid is a React Native/Expo navigation app that teaches children aged 8-12 navigation skills while empowering them with safe, age-appropriate tools. This is **not** a tracking app—it's an educational platform focused on building independence and confidence.

**Key Principle**: Educational value and child empowerment over passive tracking.

## Tech Stack

### Frontend
- **Framework**: React Native with Expo (SDK 52+)
- **Routing**: Expo Router (file-based routing in `app/` directory)
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand for client state, TanStack React Query for server state
- **Storage**: AsyncStorage for local persistence
- **Maps**: MapLibre GL with OpenStreetMap data
- **Routing**: Openrouteservice (ORS) API

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL 14+ with PostGIS extension
- **Cache**: Redis 6+
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod schemas
- **Logging**: Pino
- **Monitoring**: Sentry

## Architecture Overview

### Three-Layer Architecture
1. **UI Layer** (`app/` + `components/`) - Expo Router screens & reusable components (175+ refactored, all <500 lines)
2. **State Layer** (`stores/` + `hooks/`) - Zustand stores + Context API for auth/UI state
3. **Service Layer** (`services/` + `utils/`) - API client, location tracking, offline queue, geofencing

### Key Design Patterns

**State Management - Zustand with Persistence:**
- Stores use `zustand` with `persist` middleware + `AsyncStorage`
- Example: `stores/navigationStore.ts`, `stores/parentalStore.ts` (8 stores total)
- Actions are methods on the store; access via hooks like `useNavigationStore()`

**Error Handling - ApiErrorBoundary + OfflineManager:**
- Wrap API calls with `ApiErrorBoundary` component
- `offlineManager` singleton tracks network state, queues actions for retry
- Services use `SafeAsyncStorage` wrapper for safe data persistence

**Authentication - Single Authmanager Instance:**
- `utils/auth.ts` exports `authManager` singleton + `useAuth()` hook
- Handles login, token refresh, session management, biometric auth
- Auth state changes trigger listeners; `useAuth()` wraps context provider

**Async Patterns - Abort Signals + Timeouts:**
- Use `timeoutSignal()` from `utils/abortSignal.ts` for fetch requests
- Prevents hanging requests; all API calls have 15s default timeout
- Services inherit timeout configuration from API config

## Critical Files & Patterns

### Stores (State Management)
- **parentalStore.ts** (888 lines) - SECURITY CRITICAL: PIN auth, parental controls, activity logging
- **navigationStore.ts** (249 lines) - Route selection, favorites, accessibility settings
- **regionStore.ts** - Multi-city config, transit data per region
- **enhancedNavigationStore.ts** - Advanced routing preferences, waypoints, caching
- **gamificationStore.ts** - Achievements, badges, points system

### Services (Business Logic)
- **api.ts** (688 lines) - NaviKidApiClient: auth, locations, safe zones, emergency contacts, offline sync
- **offlineQueue.ts** - Queue + replay actions when offline
- **locationService.ts** - Permission handling, background tracking, sync to backend
- **safeZoneService.ts** - Geofencing, distance calculations, entry/exit detection
- **websocket.ts** - Real-time transit updates, location streaming

### Components (UI)
- **ParentDashboard** → 7 subcomponents (safety stats, quick actions, activity feed)
- **KidTripPlanner** → 25+ extracted components (forms, route cards, accessibility)
- **MTALiveArrivals** - Transit arrivals with refresh, uses regionStore for transit config
- **SafeZoneManagement** → 5 subcomponents (list, create, edit, preview)

### Utilities (Helpers)
- **errorHandling.ts** - `withRetry()`, `SafeAsyncStorage`, location/network/camera error handlers
- **locationUtils.ts** - Proximity checks, geofence logic, distance calculations
- **validation.ts** - Input validation (required for COPPA compliance)
- **logger.ts** - Structured logging with context; use `log.info()`, `log.error()`

## Developer Workflows

### Running & Testing
```bash
# Start dev app
npm start                          # Expo dev client
npm run start:ios / start:android  # Platform-specific

# Tests (3 suites kept separate)
npm test                          # Frontend components + utils
npm run test:server              # Backend-only tests (jest.server.config.cjs)
npm run test:integration         # Integration tests
npm run test:offline             # Offline validation
npm run test:monitoring          # Monitoring + crash reporting

# Type checking & linting
npm run typecheck                # TypeScript strict mode
npm run lint:frontend            # ESLint + Prettier (frontend only)
npm run lint:backend             # Backend linting
npm run lint:fast                # Faster lint with timeouts
```

### CI/CD Pipelines
- **frontend-ci.yml** - Runs on frontend file changes: lint → typecheck → test → coverage
- **backend-ci.yml** - Backend tests + API validation
- **security.yml** - Trivy scanning, CodeQL analysis
- View status: `.github/workflows/` & `.github/CI.md`

### Database & Migrations
- **Backend uses Prisma**: `backend/prisma/schema.prisma`
- Commands: `npm run migrate`, `npm run prisma studio`
- Always test migrations locally before pushing

## Project-Specific Conventions

### TypeScript Strictness
- **Strict mode enabled** (`tsconfig.json`): `strict: true` enforced
- Use explicit types for function parameters/returns; no `any` without justification
- Safety components: type `PhotoCheckIn`, `Place`, `Route`, `SafeZone` in `types/navigation.ts`

### Component Pattern (All <500 lines)
```typescript
// Functional components with TypeScript, NativeWind styling
import { View, Text } from 'react-native';
import type { PropsWithChildren } from 'react';

interface MyComponentProps {
  id: string;
  onPress?: () => void;
}

export function MyComponent({ id, onPress, children }: PropsWithChildren<MyComponentProps>) {
  return (
    <View className="flex-1 bg-white p-4" testID="my-component">
      <Text className="text-lg font-bold">{id}</Text>
      {children}
    </View>
  );
}
```

### Styling with NativeWind
```typescript
// Use Tailwind utility classes instead of StyleSheet
<View className="flex-1 justify-center items-center bg-blue-500 p-4">
  <Text className="text-white text-xl font-bold">Hello</Text>
</View>
```

### Test IDs for Navigation
- Add `testID` to buttons, inputs, and screen roots
- Pattern: `[feature]-[element]` (e.g., `safe-zone-add-button`, `trip-planner-origin-input`)
- Used by E2E tests and accessibility tools

### Error Messages
- Always include `userMessage` (family-friendly) + `technicalMessage` (debugging)
- Example: `{ userMessage: "Couldn't find safe zones", technicalMessage: "Geofence query failed: ...", canRetry: true }`

### Offline-First Design
- All reads from `AsyncStorage` first; sync to backend after
- Use `offlineManager.queueAction()` for POST/PUT/DELETE when offline
- Test with `npm run test:offline`; see `__tests__/offline-validation.test.ts`

### Multi-Region Support
- Always access transit config via `useRegionStore()`: `currentRegion.transitConfig`
- Don't hardcode city names; use `regionStore.availableRegions`
- Example: `MTALiveArrivals` switches transit API based on `currentRegion.id`

## Safety & Compliance (CRITICAL)

### COPPA Compliance
- **No data collection** without verifiable parental consent
- **Data retention limits**: Location data max 30 days, search history 90 days
- **Privacy by design**: Local-first storage, minimal cloud sync
- **Parental controls**: PIN-protected settings and data access

### Child Safety Requirements
1. **Input Validation** - Use `utils/validation.ts` for all user inputs; prevent injection
2. **Parental Authentication** - Never bypass `parentalStore.verifyPin()`; all parent-only features require PIN
3. **Location Privacy** - Store location locally in `AsyncStorage`; never upload without opt-in
4. **Data Retention** - Use `dataRetentionStore` for cleanup scheduling (30 days locations, 90 days searches)

### Testing Safety Features
- `__tests__/parental-auth-security.test.ts` - PIN auth, feature locks
- Run with: `npm run parental-link-check`
- Ensure all auth flows require verification

## Integration Points & External Dependencies

### API Service Pattern
```typescript
// Use centralized API client
import apiClient from '@/services/api';

const result = await apiClient.auth.login(email, password);
if (result.success) {
  // Handle success
} else {
  // Handle error: result.error
}
```

### Backend API (`services/api.ts`)
- **Base URL**: `EXPO_PUBLIC_API_URL` env var
- **Authentication**: JWT (access + refresh tokens) in `Authorization` header; refresh flow in `authManager`
- **Timeout**: 15s default (configurable per request via `timeoutSignal()`)
- Retry logic: exponential backoff, 3 attempts by default
- Framework: Fastify backend with PostgreSQL + PostGIS for geospatial queries, Redis for caching

### Map Rendering
- **Mobile** (iOS/Android): MapLibre GL (`react-native-maplibre-gl`)
- **Web**: Leaflet fallback (`InteractiveMap`)
- **Styles**: Configured via `EXPO_PUBLIC_MAP_STYLE_URL`
- **Routing**: OpenRouteService API (`EXPO_PUBLIC_ORS_API_KEY`, `EXPO_PUBLIC_ORS_BASE_URL`)

### Transit APIs (Region-Specific)
- **NYC (MTA)**: Uses mock data in `services/mockStationData.ts` (expand with real API)
- **Config**: `regionStore` defines API endpoints per region
- **Updates**: Real-time via WebSocket or polling

### Monitoring & Crash Reporting
- **Sentry**: Initialize in `app/_layout.tsx` with `SENTRY_DSN`
- **Plausible Analytics**: `hooks/usePlausible.ts` for privacy-friendly event tracking
- **Health Check**: `backendHealthMonitor` in `api.ts` pings `/health`

## Testing Strategy

### Test Organization (3 Suites)
1. **Frontend Tests** (`jest.config.cjs`) - Components, hooks, stores, utils
2. **Server Tests** (`jest.server.config.cjs`) - Backend/Prisma (separate environment)
3. **Integration Tests** (`__tests__/integration/`) - API mocking, offline scenarios

### Mock Setup
- Mocks live in `__mocks__/`: `react-native.js`, `expo-constants.js`, `react-native-mmkv.js`, etc.
- Component mocks inline where specific to test file
- Service mocks: use `jest.fn()` for API calls in tests

### Coverage Targets
- **Global thresholds** (jest.config.cjs): branches 30%, functions 30%, lines 30%, statements 30%
- **Priority**: Store logic, safety features, error handling
- Coverage reports: `coverage/` directory after `npm test`

## Common Development Tasks

### Adding a New Feature (Example: New Safe Zone Type)
1. **Update types**: `types/navigation.ts` → add `SafeZoneType`
2. **Update store**: `stores/regionStore.ts` → add action for new type
3. **Create components**: `components/safeZoneTypes/NewTypeCard.tsx` + tests
4. **Update API**: `services/api.ts` → add endpoint if needed
5. **Test**: Write unit test, run `npm test`, verify coverage

### Debugging Offline Issues
1. Toggle network in DevTools or DevTools menu
2. Check `offlineManager.getNetworkState()`
3. Inspect queued actions: `offlineManager.getQueuedActions()`
4. Test retry on reconnect: `npm run test:offline`

### Fixing Type Errors
1. Run `npm run typecheck` to see all errors
2. Check strict mode requirements: no implicit `any`, all parameters typed
3. Add `.ts` extension to imports: `import X from '@/utils/X.ts'` (module resolution)
4. Use type-safe store access: `const { value } = useStore(selector => selector.value)`

### Profiling Performance
1. Use React DevTools Profiler
2. Check bundle size: `npm run bundle-analysis` (if script exists)
3. Review console for render warnings
4. Example bottleneck: `MTALiveArrivals` memoization + `useCallback` for handlers

### Performance Optimization Patterns
```typescript
// React.memo for expensive components
import React from 'react';
export const MyComponent = React.memo(({ prop }: Props) => {
  return <View>{prop}</View>;
});

// useMemo and useCallback for expensive computations
import { useMemo, useCallback } from 'react';

const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);
const memoizedCallback = useCallback(() => handleClick(value), [value]);

// Lazy load routes
import { lazy } from 'react';
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Environment Variables

```typescript
// Frontend (.env)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ORS_API_KEY=your_key_here

// Backend (backend/.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/navikid
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_here
```

## Version & Environment Info
- **Node**: 22 (see `.node-version`)
- **TypeScript**: Strict mode enabled (no `any` without justification)
- **React Native**: Expo SDK 52+
- **Database**: PostgreSQL 14+ with PostGIS (backend)
- **Cache**: Redis 6+ (backend)
- **Package Manager**: npm (for CI; Bun used experimentally in performance tests)
