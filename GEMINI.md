# Gemini Project Analysis: MapMuse

## Project Overview

This project, **MapMuse**, is a cross-platform mobile application built with React Native and Expo. Its purpose is to provide a gamified map experience for families to discover new places, explore their city, and embark on fun adventures together.

The project was originally named "NaviKid" with a focus on child safety, but has since been strategically pivoted to "MapMuse" with a focus on family-friendly discovery to mitigate liability and broaden its appeal. The internal codename "NaviKid" still exists in some backend and infrastructure components and is considered technical debt.

**Core Technologies:**

- **Frontend:** React Native, Expo, Expo Router, Zustand, TanStack React Query, NativeWind.
- **Mapping:** MapLibre for map rendering and Openrouteservice for routing.
- **Backend:** A Node.js/Express backend service located in the `backend/` directory, using PostgreSQL for the database and Redis for caching.
- **Builds & Deployments:** The project uses Expo Application Services (EAS) for building and deploying the mobile application. It has a CI/CD pipeline set up with GitHub Actions.

## Building and Running

### Initial Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Set up Environment Variables:**
    ```bash
    cp .env.example .env
    # Edit .env with the required API keys and configuration
    ```

### Development

- **Run the App (Expo Go):**
  ```bash
  npx expo start
  ```
- **Run on iOS:**
  ```bash
  npx expo run:ios
  ```
- **Run on Android:**
  ```bash
  npx expo run:android
  ```

### Testing & Quality

- **Run All Tests:**
  ```bash
  npm run test:concurrent
  ```
- **Run Default Test Suite:**
  ```bash
  npm test
  ```
- **Run Backend-only Tests:**
  ```bash
  npm run test:server
  ```
- **Type Checking:**
  ```bash
  npx tsc --noEmit
  ```
- **Linting:**
  ```bash
  npx eslint "**/*.{ts,tsx}"
  ```

### Production

- **Build with EAS:**
  ```bash
  npx eas build --profile production --platform all
  ```

## Development Conventions

- **File-based Routing:** The app uses `expo-router`, so the file structure within the `app/` directory defines the navigation and routes.
- **Styling:** The project uses NativeWind, which brings Tailwind CSS utility classes to React Native.
- **State Management:** Client-side state is managed with Zustand, while server-state (API data) is handled by TanStack React Query.
- **Testing:** The project maintains separate test suites for different parts of the application (default, server, logic), which are run with Jest.
- **Documentation:** The project has extensive documentation in the `docs/` directory. Outdated strategic documents related to the old "NaviKid" branding have been moved to `docs/archive/`.
- **TODOs:** A high-level project roadmap and list of next steps is maintained in `TODO.md`.
