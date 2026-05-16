# AtlasLift

AtlasLift is a local-first fitness tracking app built with React + Vite and packaged for Android/iOS with Capacitor.

## Repository Overview

- `src/`: app UI, pages, and state/query logic
- `android/`: Capacitor Android project
- `ios/`: Capacitor iOS project
- `public/`: static assets

## Current Feature Set

- Onboarding + profile setup
- Workout logging with:
  - active session logger
  - rest timer
  - superset group tagging
  - undo for destructive delete actions
  - progression/deload guidance
- Program builder:
  - program days/exercises
  - inline sets/reps edits
  - exercise grouping tags
- Nutrition:
  - meal logging/editing
  - saved meals
  - repeat yesterday meals
  - undo delete
- Hydration tracking
- Progress:
  - bodyweight + measurements
  - advanced measurements toggle (chest/arm/thigh)
  - photo timeline
  - goal-aware trend/adherence cards
- History:
  - date-based logs for workouts/meals/hydration/measurements
  - edit/delete support on logged data
  - weekly vs monthly summaries

## Data Model

The app currently runs fully in local mode.

- Data is persisted in browser/WebView local storage.
- No backend sync is required for normal operation.

## Tech Stack

- React 18
- Vite
- TanStack Query
- Tailwind CSS
- Capacitor (Android + iOS)

## Local Development

Install dependencies:

```bash
npm install
```

Run web development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

## Capacitor Mobile Workflow

Sync latest web assets into native projects:

```bash
npx cap copy
```

Sync and update native plugins:

```bash
npx cap sync
```

Open Android project:

```bash
npx cap open android
```

Open iOS project (macOS only):

```bash
npx cap open ios
```

## Android Build (CLI)

Build debug APK:

```bash
cd android
gradlew.bat assembleDebug
```

APK output:

- `android/app/build/outputs/apk/debug/app-debug.apk`

Build release AAB:

```bash
cd android
gradlew.bat bundleRelease
```

AAB output:

- `android/app/build/outputs/bundle/release/app-release.aab`

## Install Debug APK on Device

With USB debugging enabled:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## iOS Build Notes

- iOS builds require macOS + Xcode.
- Open `ios/App/App.xcodeproj`, configure signing, then Archive in Xcode.
