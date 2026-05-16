# AtlasLift

AtlasLift is a mobile-first fitness tracker built with React + Vite and packaged for Android/iOS using Capacitor.

## What This Repo Contains

- React application source in `src/`
- Local JSON-style entity models in `entities/`
- Capacitor native projects:
  - `android/`
  - `ios/`

## Core Product Scope

- Onboarding and profile setup
- Workout logging and session summaries
- Program planning (days + exercises)
- Meal logging and saved meals
- Hydration tracking
- Progress tracking (body metrics, adherence, charts)
- Local-first persistence via `localStorage`

## Tech Stack

- React 18
- Vite 6
- TanStack Query
- Tailwind CSS
- Capacitor 8 (Android + iOS)

## Development

Install dependencies:

```bash
npm install
```

Run web dev server:

```bash
npm run dev
```

Type check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

## Mobile Build Workflow

Build and sync web assets to native projects:

```bash
npm run build:mobile
```

Open Android project:

```bash
npm run cap:android
```

Open iOS project (macOS only):

```bash
npm run cap:ios
```

## Android Release

- Update version values in `android/app/build.gradle`:
  - `versionCode`
  - `versionName`
- Build signed app bundle (`.aab`):

```bash
cd android
gradlew.bat bundleRelease
```

Expected output:

- `android/app/build/outputs/bundle/release/app-release.aab`

## iOS Release

- Open `ios/App/App.xcodeproj` in Xcode
- Configure signing/team/bundle identifier
- Archive from Xcode (`Product > Archive`)
