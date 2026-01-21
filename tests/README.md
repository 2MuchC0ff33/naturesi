# Tests — Nature's Infusions

Overview

- Tests are dependency-free and use Node's built-in test runner (`node:test`).
- Start server: `npm run start` (runs `scripts/serve.js`).
- Run all tests: `npm test` (runs `node --test`).
- Run unit tests only: `npm run test:unit`.

VS Code

- Use the Tasks panel to run `Serve (local)` and `Run tests` or use the Debug configurations to run/debug tests.

Manual checks

- Visual, accessibility, cross-browser and PayPal sandbox steps live under `tests/manual/` and should be performed manually as part of acceptance.

Notes

- No third-party dependencies are added by default. If you want NativeNodeModules/ZombieJS/QuickJS/wkhtmltoimage/whtmltopdf for visual E2E tests, we can add it as an opt-in dev dependency later.

Policies and environment variables

- HTML-first policy: any test that exercises runtime page JS should use an HTML harness under `tests/html/` and be validated by fetching the served page (no Node DOM simulators).
- RUN_SLOW_TESTS: set to `1` to enable heavy/stress tests (`tests/perf/stress.test.js`). Default: skipped.
- PERF_THRESHOLD_MS: set to a numeric value to enforce stricter performance thresholds in `tests/perf/benchmarks.test.js`. Default: 1000ms (generous to avoid CI flakiness).
  Optional tools (opt-in)

- Zombie.js (npm): recommended for legacy headless DOM simulation. Version: `6.1.4` (installed as a devDependency). Use only for tests that truly need it.
- wkhtmltox (wkhtmltopdf / wkhtmltoimage): Windows x64 installer: https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox-0.12.6-1.msvc2015-win64.exe
- QuickJS: Windows binary (zip): https://bellard.org/quickjs/binary_releases/quickjs-win-x86_64-2025-09-13.zip

Install optional tools

- Run `npm run tools:install` to download optional binaries into the repository `.tools/` folder (skips existing files). This will not add any system-wide changes; you can delete `.tools/` to remove the artifacts.
- Run `npm run tools:check` to verify presence. Tests that require optional tools will be skipped automatically if they are not present.

Notes

- The repo intentionally avoids shipping binaries in the repository; the `tools:install` script downloads the referenced binaries to `.tools/` for convenience. If you want system-wide installation, download and install manually from the links above.
