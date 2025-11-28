# Family Adventure & Discovery Map

This repository contains an Expo React Native application designed for families to discover new places, embark on fun adventures, and explore their city together.

[![CI Full](https://github.com/tbmobb813/Kid-Friendly-Map-v1/actions/workflows/ci.yml/badge.svg?branch=feature/transit-screen-mta-integration)](https://github.com/tbmobb813/Kid-Friendly-Map-v1/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tbmobb813/NaviKid-v1/graph/badge.svg?token=RFVHM4QJBM)](https://codecov.io/gh/tbmobb813/NaviKid-v1)

## Quickstart

1. Install dependencies (pick one package manager and standardize):

```bash
# npm (recommended for local dev)
npm ci

# OR Bun (used in CI)
# bun install
```

Copy environment variables:

```bash
cp .env.example .env
# Edit .env with production/dev values
```

Typecheck and tests:

```bash
npx tsc --noEmit
npm test
```

Run in development (Expo):

```bash
npx expo start
```

## Production builds (EAS)

This project uses Expo Application Services (EAS) for production mobile builds.

1. Install the EAS CLI:

```bash
npm install -g eas-cli

2. Login and configure credentials:

```bash
eas login
# Follow prompts to configure your account
```

Add secrets (Sentry DSN, API keys, signing keys) in EAS or GitHub Actions
secrets.

Build:

```bash
npx eas build --profile production --platform all
```

## Assets

Place app icons and splash assets under `assets/images/`.
This repo includes placeholder assets; replace them with production artwork.

## Environment / Secrets

- Keep production values out of version control; use CI secrets.
- Required keys are listed in `.env.example`.

**Map & Routing Configuration:**

Set these environment variables for MapLibre and OpenRouteService
integration:

```bash
# Map configuration
EXPO_PUBLIC_MAP_STYLE_URL=https://your-style-provider.com/style.json
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here  # Optional for some styles
EXPO_PUBLIC_MAP_DEFAULT_LAT=40.7128                 # Default center latitude
EXPO_PUBLIC_MAP_DEFAULT_LNG=-74.006                 # Default center longitude
EXPO_PUBLIC_MAP_DEFAULT_ZOOM=13                     # Default zoom level
EXPO_PUBLIC_MAP_MIN_ZOOM=10                         # Minimum zoom allowed
EXPO_PUBLIC_MAP_MAX_ZOOM=20                         # Maximum zoom allowed
EXPO_PUBLIC_MAP_ANIMATION_DURATION=1000             # Animation duration in ms

# Routing configuration
EXPO_PUBLIC_ORS_API_KEY=your_openrouteservice_key   # Required for routing
EXPO_PUBLIC_ORS_BASE_URL=https://api.openrouteservice.org  # Optional override
EXPO_PUBLIC_ORS_PROFILE=foot-walking                # Default routing profile
EXPO_PUBLIC_ORS_TIMEOUT=15000                       # Request timeout in ms
```

**Map & Routing Integration:**

- **Mobile platforms** (iOS/Android): Uses native MapLibre GL with configurable styles.
- **Web platform**: Falls back to a Leaflet-based InteractiveMap for broader compatibility.
- **Route visualization**: Integrates with OpenRouteService for walking/transit directions to your next adventure.
- **Points of Interest**: Highlights family-friendly locations like parks, museums, and playgrounds.
- **Transit Integration**: Shows real-time arrivals for public transit, making it easy to plan family outings.

## Monitoring & Crash Reporting

A Sentry integration skeleton is available at `utils/sentry.ts`. Add `SENTRY_DSN` to your environment and follow Sentry's docs to create a project.

## CI/CD

There is a GitHub Actions pipeline in `.github/workflows/ci.yml` and a lightweight PR workflow at `.github/workflows/ci-lite.yml`.

Notes:

- We removed Bun-specific test runners from the main PR pipelines and migrated tests to run under Jest/npm. Prefer `npm ci` in CI unless you intentionally want Bun for performance experiments.

- See `CI_FIX_SUMMARY.md` → "Active GitHub Actions workflows" for a compact reference of which workflow runs what and how to trigger manual/heavy jobs.

## Project Vision & Status

This project aims to make urban exploration fun and accessible for the whole family. By combining interactive maps with gamified achievements, we encourage curiosity and create shared experiences.

- **Technical Status:** The application is in active development, with a robust technical foundation, 70%+ test coverage, and operational CI/CD.
- **Feature Status:** Core features for mapping, routing, and transit are implemented. The next phase focuses on expanding our points-of-interest database and enhancing the "Achievements" system.
- **Next Phase:** We are preparing for an initial beta test with a small group of families to gather feedback and refine the user experience.

See the `docs/` directory for more detailed planning and historical documents.

## Contributing

See `docs/TESTING_GUIDE.md` and `docs/PERFORMANCE_OPTIMIZATION.md` for developer guidance.

## Acknowledgements

We extend our sincere gratitude to rork for their foundational contributions and support in the early stages of this project.

## Testing (three suites)

This repository separates tests into three focused suites to keep transforms and
environments clean.

Run the default suite:

```bash
npm test
```

Server-only tests:

```bash
npm run test:server
```

Logic test suite:

```bash
npm run test:logic
```

Run all three locally in parallel with the helper script (it prints a
consolidated summary):

```bash
npm run test:concurrent
```

CI runs these suites in parallel jobs — see `.github/workflows/tests.yml` for
the workflow definition.

Notes on performance-sensitive tests

- PERF_TIME_MULTIPLIER: You can relax strict timing assertions locally by
  setting the environment variable `PERF_TIME_MULTIPLIER`. For example, to
  double allowed times:

  ```bash
  PERF_TIME_MULTIPLIER=2 npm run test:bun
  ```

- FORCE_CONCURRENT: The concurrent runner defaults to sequential execution
  for local stability. To force parallel runs locally (not recommended on
  low-powered machines):

  ```bash
  FORCE_CONCURRENT=1 npm run test:concurrent
  ```

CI runs the strict performance checks with `PERF_TIME_MULTIPLIER=1` by
default; if you see failures locally, increase `PERF_TIME_MULTIPLIER` for
development runs.

## License

Add a license file (e.g., MIT) if you intend to open-source this project.

## Enabling MapLibre in Expo / EAS builds

This project uses the native MapLibre React Native module for mobile builds.
MapLibre will not be available in the stock Expo Go app — you must create a
development or production build that includes the native module.

Minimal steps (EAS / Expo):

- Install the native dependency (already listed in package.json):

  ```bash
  npm install @maplibre/maplibre-react-native
  ```

- Create an EAS dev build to include the native module (recommended for
  development):

  ```bash
  # login to EAS if you haven't
  npx eas login

  # create a dev build for Android
  npx eas build --profile development --platform android

  # or for iOS (requires proper credentials / Apple account)
  npx eas build --profile development --platform ios
  ```

- For production, run a normal EAS build:

  ```bash
  npx eas build --profile production --platform all
  ```

Notes:

- In local dev you can still run the JS-only fallback (OpenStreetMap-based
  InteractiveMap) in Expo Go. To use MapLibre you must run an EAS development
  build or a bare React Native build that includes native modules.
- iOS: run `cd ios && pod install` inside a bare project or when using a
  local native workspace.
- Android: Gradle autolinking will pick up the module; ensure your
  `android/` gradle configuration matches Expo/EAS expectations.
- If you want a short checklist added to this README for CI/EAS credentials
  or app signing, I can add that.
