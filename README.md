# AtlasLift Mobile (Capacitor)

This project is now configured as a Capacitor app for Android and iOS, with local on-device data storage.

## Requirements

- Node.js 20+
- Android Studio (for Android builds)
- Xcode 16+ on macOS (for iOS builds)

## Install

```bash
npm install
```

## Run in Browser

```bash
npm run dev
```

## Build + Sync Native Projects

```bash
npm run build:mobile
```

This builds web assets into `dist/` and syncs them to:

- `android/`
- `ios/`

## Open Native Projects

```bash
npm run cap:android
npm run cap:ios
```

## Local Data Mode

- App data is stored on-device in `localStorage`.
- No backend auth or API calls are required.
- Seed exercises are created automatically on first launch.

## Packaging

- Android release artifact: `.aab` from Android Studio.
- iOS release artifact: archive from Xcode.

## Release Workflow

### Android (Play Store)

1. Increment app version in [android/app/build.gradle](/c:/Repository/AtlasLift/android/app/build.gradle):
   - `versionCode` (integer, must increase every release)
   - `versionName` (user-visible, e.g. `"1.0.1"`)
2. Open Android Studio:

```bash
npm run cap:android
```

3. In Android Studio, configure signing for `release` and generate:
   - `Build > Generate Signed Bundle / APK > Android App Bundle`
4. Upload the generated `.aab` to Google Play Console.

### iOS (App Store)

1. iOS build/release requires macOS + Xcode.
2. On macOS, sync latest web assets:

```bash
npm run build:mobile
npm run cap:ios
```

3. In Xcode:
   - Set bundle identifier/team/signing in the `App` target.
   - Increment `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.
   - `Product > Archive`, then submit via Organizer.
