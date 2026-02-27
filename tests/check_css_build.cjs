#!/usr/bin/env node
// simple validation that build:css inlines all partial imports. this
// prevents a deployed site from shipping a stylesheet that still references
// `partials/...` paths, which would 404 when `public/` serves as the docroot.
// the script is invoked automatically by the npm build command and can also
// be run standalone via `pnpm run verify:css`.
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

try {
  // caller (usually the build script) is responsible for producing
  // public/assets/css/main.css before executing this check. when run
  // standalone the user should ensure the file already exists.
  const out = readFileSync('public/assets/css/main.css', 'utf-8');
  if (/\@import\s+url\(['\"]?partials\//.test(out)) {
    console.error('✗ build output still contains partial imports');
    process.exit(1);
  }
  if (out.indexOf('sourceMappingURL') !== -1) {
    console.error('✗ build output contains a source map reference');
    process.exit(1);
  }

  /* ensure a vendor prefix made it into the generated file so autoprefixer
     actually ran. the sample value comes from main.css partials (e.g. flex
     or gradient rules). */
  if (!/-webkit-/.test(out)) {
    console.error('✗ build output does not appear to have any vendor prefixes');
    process.exit(1);
  }

  console.log('✓ build output contains no @import from partials, no source map,' +
              ' and includes vendor prefixes');
} catch (e) {
  console.error('error during css build check', e);
  process.exit(1);
}
