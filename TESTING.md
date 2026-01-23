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

## PayPal / Payments (staging)

- Ensure `assets/js/data/paypal.json` is set to `env: "sandbox"` and `business` equals your sandbox merchant email, or set `.env` and update `paypal.json` during your deploy step.
- Quick staging test:
  1. `npm run start:static` and open http://localhost:8080
  2. Add a product to cart and go to Cart
  3. Click **Proceed to checkout** — site will attempt to fetch `paypal.json` and then submit a PayPal `cmd=_xclick` form.
  4. For automated tests we intercept the form submit to verify payload rather than navigating to PayPal.

**Security note:** Client-only redirect is not authoritative proof of payment. Manually verify transactions in PayPal until server-side verification is implemented.

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

---

## Comprehensive test suite details

This repository now includes the following additional automated checks:

- JS-disabled E2E tests (Playwright) to validate HTML-first, progressive-enhancement behaviour. Run with `npm run test:e2e:off`.
- JS-enabled E2E tests (Playwright) for progressive enhancement (service worker, cart UI). Run with `npm run test:e2e:on`.
- Accessibility (axe) checks executed via Playwright tests and failing on any _critical_ or _serious_ violations. Run `npm run test:a11y`.
- Mutation testing using Stryker (`npm run test:mutation`) targeted at core modules (cart persistence and shipping logic).
- Performance smoke checks (Lighthouse) enforced by budgets (LCP<2500ms, TBT<300ms, CLS<0.1). Run `npm run test:perf:smoke`.
- Load testing scenarios using k6 (`npm run test:load`) scheduled weekly in CI (`.github/workflows/load-tests.yml`).
- OWASP ZAP baseline scans (Docker-based) available via `npm run test:zap` and run in CI.

Artifacts produced in CI include Playwright HTML reports, JUnit XML for test results, coverage (LCOV and JSON), Lighthouse reports (JSON), ZAP HTML report, and Stryker mutation HTML reports.

If you need to adjust thresholds or the schedule for longer load/perf runs, update the GitHub workflow YAMLs under `.github/workflows/`.

Fixtures & deterministic test data

- Fixtures are stored under `tests/fixtures/` (e.g. `paypal.json`, `sample-cart.json`, `sample-products.json`) and are used in E2E tests via Playwright routing to ensure determinism and offline CI runs.
- E2E tests use `page.route('**/assets/js/data/paypal.json', ...)` to stub PayPal config and avoid external network calls during CI/test runs.

Proceed-to-checkout & Checkout tests

- `tests/e2e/proceed-to-checkout.spec.ts` implements both UI-driven and localStorage-driven checkout flows and simulates the `runCheckout` invocation on the checkout page to validate PayPal payloads (without performing real PayPal redirects).
- When debugging these tests locally, use `PWDEBUG=1 npx playwright test tests/e2e/proceed-to-checkout.spec.ts --project=chromium --debug` to run headed and inspect behaviour. For trace-based debugging capture a run with `npx playwright test --trace on` and then inspect it with `npx playwright show-trace <path-to-trace.zip>`.

---

Local-only testing guidance (no Docker, no GitHub Actions)

I updated the repository to support a local-first testing workflow. The CI workflows are set to manual dispatch only and the scripts that previously relied on Docker have local alternatives.

1. Playwright (E2E)

- Use `npx playwright test` as before. For an interactive debug session use:
  - `PWDEBUG=1 npx playwright test --project=chromium` (headed, interactive)
  - `npx playwright show-report` to open the last HTML report
- You can also use the Playwright Server / MCP tooling in VS Code to remote-debug sessions.

2. Lighthouse (lab/perf)

- Run the smoke checks locally with `npm run test:perf:smoke` which uses a small Node script and a local Chrome instance.
- For deeper profiling, open Chrome with remote debugging: `chrome --remote-debugging-port=9222` and use DevTools or Lighthouse UI.

3. k6 (load)

- `npm run test:load` runs the local k6 script. Install k6 on your machine (https://k6.io/docs/getting-started/installation/).

4. OWASP ZAP (security)

- No Docker required: install OWASP ZAP locally (https://www.zaproxy.org/download/). Ensure `zap-baseline.py` is available on your PATH.
- Run `npm run test:zap` which invokes `./scripts/run-zap-local.js` and writes `reports/zap-baseline.html`. If ZAP is not found, `npm run test:zap:diagnose` provides installation hints.
- Alternatively, open the ZAP GUI and scan `http://127.0.0.1:8080` manually.

5. Mutation testing (Stryker)

- Run `npm run test:mutation` locally; Stryker will run against targeted modules and produce an HTML report under `.stryker-tmp`.

6. Accessibility (axe / pa11y)

- Playwright E2E tests include axe checks. Run `npm run test:a11y` locally to fail if critical/serious issues are present.
- Optionally use `npx pa11y http://127.0.0.1:8080/index.html --reporter html > reports/pa11y-index.html` for an extra check.

7. Playwright + Chrome DevTools (MCP assistance)

- Use Playwright's debug mode to step through tests; it integrates with Chrome DevTools for runtime inspection.
- If you want to connect an MCP server (e.g., Chrome DevTools or Playwright MCP server), start the local server (`npm run start:static`), then run Playwright in debug mode and inspect network, console, and trace data.

If you want, I can also add a lightweight `scripts/dev-test.sh` (or `dev-test.bat` for Windows) that runs the essential local checks in sequence (unit -> e2e smoke JS-off -> a11y -> perf smoke). Would you like that helper?
