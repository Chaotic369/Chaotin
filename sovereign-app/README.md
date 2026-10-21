# Sovereign Protocol: Android app

Your web app wrapped as a native Android app with Capacitor. The UI, Firebase project and data path are unchanged
(`operatives/raja_prime`). Everything (code, Firebase SDK, DM Sans font) is bundled into the APK, so it opens instantly and works with no internet.

## Build the APK (pick one)

**A. No Android Studio (GitHub)**
1. Create a private GitHub repo and push this folder.
2. Actions tab > "Build Android APK" > Run workflow.
3. Download `sovereign-protocol-apk` from the finished run, unzip, install `app-debug.apk` on your phone.

**B. On your computer** (Node 20+, JDK 21, Android SDK)
```
npm install
npm run apk
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Or `npm run setup` then `npm run open` for Android Studio.

## Offline and sync
- Every change is saved on the phone first, so the app never waits for the network.
- When you are online, changes are pushed to Firebase (about a second later). If you are offline, they stay queued.
- When the connection returns, or you reopen the app, unsent local changes are pushed up. If nothing is waiting, newer cloud data is pulled down.
- If you edited on two devices while one was offline, the device with unsent changes wins.
- A fresh install pulls your cloud data first, so reinstalling never wipes it.

## Notifications (Stats > Settings > Notifications)
Reminders on/off, schedule blocks, timed tasks, how long before (0 to 60 min), snooze length, sound or silent,
quiet hours, and an optional evening check-in reminder. "Send test" fires one in 4 seconds.
Each reminder has **Done** and **Snooze** buttons. Tapping a button opens the app briefly to apply it (an Android limit).
Reminders are scheduled 7 days ahead and rebuilt whenever you change data or open the app, so open it at least weekly.

## Notes
- Android 12+ asks for the "Alarms & reminders" permission when you turn reminders on; allow it so they fire on time.
- CSV export and backup open the Android share sheet.
- Debug-signed APKs install directly. For the Play Store you would need a release signing key.
