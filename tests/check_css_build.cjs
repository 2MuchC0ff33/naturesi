#!/usr/bin/env node
// simple validation that build:css produces a final stylesheet suitable for
// deployment. originally the script only checked for stray `@import` calls
// (to avoid 404s when partials are referenced), but the workflow now
// compiles SCSS (Sass) before postcss and also injects tokens from Open Props/
// project variables.  This file is invoked automatically from the npm build
// pipeline; run `pnpm run verify:css` if you want to test manually.
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

try {
  // caller (usually the build script) is responsible for producing
  // the bundled stylesheet before executing this check. depending on the
  // package.json configuration it may live under public/ or public_html/;
  // try both paths for convenience when running the script manually.
  let out;
  try {
    out = readFileSync('public/assets/css/main.css', 'utf-8');
  } catch (_e) {
    out = readFileSync('public_html/assets/css/main.css', 'utf-8');
  }
  // no `@import` directives at all should remain (the Sass step may
  // have emitted them for compatibility, but PostCSS must collapse them).
  // strip comments first so explanatory text doesn’t trigger the check.
  const stripped = out.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\@import\s+/.test(stripped)) {
    console.error('✗ build output still contains an @import directive');
    process.exit(1);
  }
  if (out.indexOf('sourceMappingURL') !== -1) {
    console.error('✗ build output contains a source map reference');
    process.exit(1);
  }

  /* ensure a vendor prefix made it into the generated file so autoprefixer
     actually ran. the sample value comes from main.scss partials (e.g. flex
     or gradient rules). */
  if (!/-webkit-/.test(out)) {
    console.error('✗ build output does not appear to have any vendor prefixes');
    process.exit(1);
  }

  // compile again in quiet mode to catch any Sass deprecation warnings.
  // using pnpm exec ensures the local `sass` binary is invoked.
  const { spawnSync } = require('child_process');
  const sassCheck = spawnSync('pnpm', ['exec', 'sass', 'assets/css/main.scss', 'assets/css/output.css', '--no-source-map'], { encoding: 'utf-8' });
  const warningLog = (sassCheck.stderr || '') + (sassCheck.stdout || '');
  if (/Deprecation Warning/.test(warningLog)) {
    console.error('✗ Sass emitted deprecation warnings during compilation');
    console.error(warningLog);
    process.exit(1);
  }

  // check for a known custom‑property token that will be defined once Open
  // Props or project variables are imported upstream; use radius-sm as a
  // stable example.
  if (!/--radius-sm/.test(out)) {
    console.error('✗ build output does not include expected token --radius-sm');
    process.exit(1);
  }

  // ensure watcher script is modern and cross-platform
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const script = pkg.scripts && pkg.scripts['watch:css'];
    if (script) {
      if (script.includes('&')) {
        console.error('✗ watch:css script still uses shell background operator (&)');
        process.exit(1);
      }
      if (!/concurrently/.test(script)) {
        console.error('✗ watch:css script does not invoke concurrently');
        process.exit(1);
      }
    }
  } catch (e) {
    // ignore failures when package.json is unavailable
  }

  console.log('✓ build output contains no @import from partials, no source map,' +
              ' and includes vendor prefixes');
} catch (e) {
  console.error('error during css build check', e);
  process.exit(1);
}
