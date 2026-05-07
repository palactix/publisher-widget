// @ts-check
import * as esbuild from 'esbuild';
import { argv } from 'process';
import { execSync as exec } from 'child_process';

const watch = argv.includes('--watch');

const sharedOptions = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2017', 'chrome80', 'firefox78', 'safari13'],
};

// ── IIFE build — CDN drop-in (loader.min.js) ──────────────────────────────
const iifeCtx = await esbuild.context({
  ...sharedOptions,
  entryPoints: ['src/loader.ts'],
  outfile: 'dist/iife/loader.min.js',
  format: 'iife',
  globalName: 'PalactixWidget',
  // Explicitly pin to window so it works in hardened / SES environments
  // where top-level `var` may not propagate to globalThis.
  footer: { js: 'if(typeof window!=="undefined"&&typeof PalactixWidget!=="undefined")window.PalactixWidget=PalactixWidget;' },
});

// ── ESM build — npm package ───────────────────────────────────────────────
const esmCtx = await esbuild.context({
  ...sharedOptions,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/esm/index.js',
  format: 'esm',
});

if (watch) {
  await Promise.all([iifeCtx.watch(), esmCtx.watch()]);
  console.log('[palactix-publisher] watching for changes…');
} else {
  await Promise.all([iifeCtx.rebuild(), esmCtx.rebuild()]);
  await Promise.all([iifeCtx.dispose(), esmCtx.dispose()]);
  exec('npx tsc --emitDeclarationOnly', { stdio: 'inherit' });
  console.log('[palactix-publisher] build complete');
}
