import { cp, mkdir, rm } from 'node:fs/promises';

import { build } from 'esbuild';

const outputDirectory = 'dist';

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });

await Promise.all([
  cp('src/manifest.json', `${outputDirectory}/manifest.json`),
  cp('src/popup/popup.html', `${outputDirectory}/popup.html`),
  cp('src/popup/popup.css', `${outputDirectory}/popup.css`),
]);

await build({
  bundle: true,
  charset: 'utf8',
  entryPoints: ['src/popup/popup.ts'],
  format: 'iife',
  legalComments: 'none',
  logLevel: 'info',
  minify: false,
  outfile: `${outputDirectory}/popup.js`,
  platform: 'browser',
  sourcemap: false,
  target: ['chrome120'],
  treeShaking: true,
});
