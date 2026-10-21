// Run after `cap add android`: permissions for reminders + notification icon. Safe to run repeatedly.
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';

const manifest = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(manifest)) { console.error('android/ not found. Run: npm run setup'); process.exit(1); }
let m = readFileSync(manifest, 'utf8');
const perms = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK'
];
const missing = perms.filter(p => !m.includes(p));
if (missing.length) {
  m = m.replace('</manifest>', missing.map(p => `    <uses-permission android:name="${p}" />\n`).join('') + '</manifest>');
  writeFileSync(manifest, m);
  console.log('Added permissions:', missing.join(', '));
}

const dir = 'android/app/src/main/res/drawable';
mkdirSync(dir, {recursive: true});
writeFileSync(dir + '/ic_stat_icon.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp"
    android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM10,17l-5,-5 1.41,-1.41L10,14.17l7.59,-7.59L19,8l-9,9z"/>
</vector>
`);
console.log('Notification icon written');
