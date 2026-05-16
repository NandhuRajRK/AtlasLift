# AtlasLift

AtlasLift is a local-first fitness tracking app built with React + Vite and packaged for Android/iOS with Capacitor.

## Repository Overview

- `src/`: app UI, pages, and state/query logic
- `android/`: Capacitor Android project
- `ios/`: Capacitor iOS project
- `public/`: static assets

## Feature Matrix

### Onboarding

- Multi-step onboarding flow
- Inline validation for required fields and numeric ranges
- Saves onboarding completion to local profile
- Onboarding guard redirects incomplete users

### Today

- Daily overview cards (nutrition, hydration, workout, weight)
- Goal/target-aware daily summary
- Quick actions linking to core logging screens

### Workout

- Start quick workout sessions
- Start workouts from active planned program days
- In-session exercise logging with set-by-set tracking
- Inline set edits (weight/reps/RPE/completion)
- Rest timer with presets and auto-start on set completion
- Superset/giant-set grouping label display
- Undo delete for sets and completed sessions
- Workout completion summary (duration, set count, volume, exercises)
- Weekly load trend guidance:
  - go-slower warning on sharp load spikes
  - deload suggestion on low change + high recent frequency

### Programs

- Create/edit workout programs
- Add/remove/reorder program days
- Add/remove/reorder exercises per day
- Inline target sets/reps editing
- Exercise group tag (e.g. A/B/C) support
- Persist full edit state including deletions/updates
- Activate one program for workout execution

### Meals

- Add/edit/delete meal logs
- Undo delete for meal entries
- Save meals as reusable templates
- Quick add from saved meals
- Repeat yesterday meals
- Macro totals vs profile targets
- Empty/error loading states with retry

### Hydration

- Add hydration entries with quick amounts
- Daily hydration progress ring vs target
- Entry list with timestamps
- Delete hydration entries

### Progress

- Log bodyweight and waist
- Optional advanced measurement logging (chest/arm/thigh)
- Advanced measurements toggle in settings
- Circumference trend cards (4-week delta)
- Bodyweight trend chart
- Goal-specific metric cards
- PR highlights (derived from workout sets)
- Adherence/trend cards (nutrition, hydration, workout/recovery proxies)
- Goal-aware nutrition recommendation adjustments
- Progress photo timeline (local storage)
  - appends new photos (no overwrite)

### History

- Date-based history view with picker + quick date chips
- Day detail for workouts, meals, hydration, body metrics
- Inline edit/delete on meal/hydration/body-metric logs
- Workout deletion with linked set cleanup
- Weekly vs monthly summary + normalized comparison
- Excludes photo-only entries from body-metric measurement list

### Profile & Settings

- Edit profile and targets
- Validation on profile updates
- Goal and experience configuration
- Toggle advanced body measurements
- Export local data as JSON

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
