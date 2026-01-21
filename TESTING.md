# Testing — Nature's Infusions

Quick guide to run and debug the project's automated tests locally.

Prerequisites
- Node.js (18+ recommended)
- Cygwin Bash (used as VS Code integrated terminal)
- Google Chrome installed (path: `C:\Program Files\Google\Chrome\Application\chrome.exe`)

Set environment variable (Cygwin):

```bash
export TEST_CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

Run static server (Playwright and Lighthouse use this):

```bash
npm run start:static
# open http://localhost:8080
```

Unit tests (fast):

```bash
npm run test:unit
# watch mode
npm run test:unit:watch
```

End-to-end tests (Playwright):

```bash
# Headless (default)
npm run test:e2e

# Headed and interactive (useful with PWDEBUG)
npm run test:e2e:headed

# Update visual snapshots
npx playwright test --update-snapshots --grep @visual
```

Accessibility: `npm run test:a11y` (runs Playwright tests with `@a11y` tag).

Visual tests snapshot baselines are written under the `tests/e2e/*-snapshots/` directories when first created. Consider storing them in Git LFS or CI artifacts for team workflows.

Performance (Lighthouse):

```bash
# Requires Chrome available. This command runs Lighthouse for configured pages and stores JSON reports in ./reports
npm run test:perf
```

Debugging in VS Code
- Ensure VS Code terminal uses Cygwin Bash (see `.vscode/settings.json` which sets `terminal.integrated.shell.windows`).
- Set `TEST_CHROME_PATH` environment variable as shown above or in the launch config.
- Use the 'Debug Vitest - Current File' launch configuration to debug unit tests.
- Use the 'Debug Playwright Test (Chromium)' launch configuration to debug a Playwright run (headed).

CI
- A simple GitHub Actions job (`.github/workflows/test.yml`) runs unit tests, Playwright E2E, and Lighthouse CI in a matrix for Chromium and Firefox.

Notes
- Visual snapshot baselines are created on the first run and must be reviewed before committing.
- Some tests are tolerant to network or config fetch failures; in CI you may want stricter assertions.
- Do not commit PayPal live secrets; use `assets/js/data/paypal.json` sandbox values or inject secrets during CI.
