// One command: npm run setup   (add "apk" to also build a debug APK: npm run apk)
import {execSync} from 'node:child_process';
import {existsSync} from 'node:fs';

const run = (cmd, cwd) => { console.log('\n> ' + cmd); execSync(cmd, {stdio: 'inherit', cwd}); };

run('node scripts/build.mjs');
if (!existsSync('android')) run('npx cap add android');
run('node scripts/patch-android.mjs');
run('npx capacitor-assets generate --android');
run('npx cap sync android');

if (process.argv[2] === 'apk') {
  run(process.platform === 'win32' ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug', 'android');
  console.log('\nAPK: android/app/build/outputs/apk/debug/app-debug.apk');
} else {
  console.log('\nDone. Build the APK with: npm run apk   (or open it in Android Studio: npm run open)');
}
