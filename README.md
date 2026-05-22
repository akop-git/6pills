# 6pills — Android App

A 90-day operator practice. Two sheets a day — **Morning Prime** to set the posture, **Night Audit** to tell the truth — plus a **Weekly Review** to see the pattern. Posture and Truth prompts cycle on a 10-day rotation. Packaged as an Android APK via Capacitor.

## How to build & install (from iPad)

You can't compile Android apps on iPad directly, so we use **GitHub Actions** as a cloud build. You push the code → GitHub builds the APK → you download and install it. No local dev environment needed.

### Step 1: Create a GitHub repo

1. On iPad, open Safari → go to github.com → sign in (or sign up — free)
2. Tap the `+` icon (top right) → New repository
3. Name it `6pills` → set to Private (or Public, your call) → Create

### Step 2: Upload these files to the repo

Easiest path on iPad: use the GitHub web interface.

1. On your new repo page, tap "uploading an existing file"
2. Tap to add files, select all files/folders from this project
3. Commit directly to `main`

Alternative: install **Working Copy** (free Git client for iPad) and push via Git — more polished if you'll iterate often.

### Step 3: Watch the build run

1. In the repo, tap the **Actions** tab
2. You should see "Build Android APK" running automatically — takes ~5–8 minutes
3. When it finishes (green checkmark), tap the workflow run
4. Scroll down to **Artifacts** → tap `6pills-debug-apk` to download
5. iPad will download a `.zip` containing `app-debug.apk`

### Step 4: Get the APK onto an Android phone

You'll need an Android device (yours or a friend's). Several options:

- **AirDrop equivalent**: upload the APK to Google Drive / Dropbox, open on Android, download
- **Direct USB transfer**: connect Android phone to iPad with cable, drag APK over
- **Email it to yourself** and download from Gmail on Android

### Step 5: Install on Android

1. On the Android device, open the APK file (from Files / Downloads)
2. Android will warn about "installing apps from unknown sources" — go to Settings → enable for your file manager / browser
3. Tap Install
4. Open "6pills" from the app drawer

### Step 6 (iterating): change something, repeat

Edit any file in the repo via GitHub web → commit → Actions builds a new APK automatically.

## What's in this project

```
6pills-android/
├── src/
│   ├── App.jsx           ← all the app logic & UI
│   └── main.jsx          ← React entry point
├── index.html            ← HTML shell
├── package.json          ← npm dependencies
├── vite.config.js        ← Vite build config
├── capacitor.config.json ← Capacitor app config (package name, etc.)
└── .github/workflows/
    └── android-build.yml ← GitHub Actions cloud build
```

The `android/` folder is generated automatically by Capacitor on each build, so it's not committed.

## Customizing

- **App name / package**: edit `capacitor.config.json`. Change `appName` and `appId` (use reverse-domain like `com.yourname.sixpills`)
- **Posture prompts** (morning, 10-day rotation): edit the `POSTURE_PROMPTS` array near the top of `src/App.jsx`
- **Uncomfortable Truth prompts** (night, 10-day rotation): edit the `TRUTH_PROMPTS` array
- **State check options**: edit `STATE_OPTIONS`
- **Colors / typography**: edit the `COLORS` constants
- **Form fields themselves** (e.g. rename "Juni move" to something else): edit `MorningForm`, `NightForm`, `WeeklyForm` in `src/App.jsx`

### Data storage

All entries live in browser `localStorage` under keys `config_v2` and `entries_v2`. Use Settings → Export JSON to back up. To migrate to a new phone, export from old → re-import would need a small additional feature (happy to add).

## Going to production

The current setup builds a **debug APK** — fine for personal use and sharing with friends, but it's unsigned and Android will warn before installing.

For a real Play Store release:
1. Generate a signing keystore (one-time, do on a Mac/PC or via cloud)
2. Add `release` build config to `android/app/build.gradle`
3. Store keystore secrets in GitHub repo → Settings → Secrets
4. Modify the workflow to build `assembleRelease` instead of `assembleDebug`
5. Submit `.aab` (Android App Bundle) to Play Console

Happy to help with any of those steps when you get there.
