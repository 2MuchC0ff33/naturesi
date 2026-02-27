#!/usr/bin/env node
// simple validation that build:css inlines all partial imports
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

try {
  console.log('running build:css...');
  execSync('pnpm run build:css', { stdio: 'inherit' });
  const out = readFileSync('public/assets/css/main.css', 'utf-8');
  if (/\@import\s+url\(['\"]?partials\//.test(out)) {
    console.error('✗ build output still contains partial imports');
    process.exit(1);
  }
  if (out.indexOf('sourceMappingURL') !== -1) {
    console.error('✗ build output contains a source map reference');
    process.exit(1);
  }

  // sanity check that autoprefixer actually inserted at least one
  // vendor prefix.  A missing prefix usually means the plugin order
  // is wrong or the plugin wasn’t enabled.
  if (!/-(webkit|moz|ms|o)-/.test(out)) {
    console.error('✗ build output has no vendor prefixes (autoprefixer may not have run)');
    process.exit(1);
  }

  console.log('✓ build output contains no @import from partials, no source map, and has prefixes');
} catch (e) {
  console.error('error during css build check', e);
  process.exit(1);
}
