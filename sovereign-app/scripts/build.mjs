// Bundles src/app.js (Firebase, Capacitor plugins, DM Sans font) into www/ so the app runs fully offline.
import {build} from 'esbuild';
import {mkdirSync, copyFileSync, rmSync} from 'node:fs';

rmSync('www', {recursive: true, force: true});
mkdirSync('www', {recursive: true});
await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  format: 'esm',
  outdir: 'www',
  minify: true,
  target: ['chrome100'],
  loader: {'.woff2': 'file', '.woff': 'file'},
  assetNames: 'fonts/[name]-[hash]',
  logLevel: 'info'
});
copyFileSync('src/index.html', 'www/index.html');
console.log('Web app built into www/');
