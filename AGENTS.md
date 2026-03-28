AGENTS.md — Agent Guidelines (POSIX-first)
==========================================

Purpose
  Guide agentic contributors (automated agents and human reviewers) on
  how to lint, minify, serve, test, and commit using only POSIX
  utilities. No Node, npm, biome, minify, tidy, or VS Code tasks.

Project scope
  Static HTML5 site + vanilla CSS + vanilla JS (last resort).
  Data: plaintext .txt / .csv first, JSON only when unavoidable.
  Sensitive values: central .env at repo root.

Shell
  Default script shell: yash. Shebang for all scripts:
    #!/usr/bin/env yash
  POSIX utilities: sh, awk, sed, grep, jq, bc, patch, diff, find,
  stat, cut, tr, sort, uniq, cksum, xargs, printf, date, wc, etc.

File layout
  scripts/       — maintenance scripts (lint, minify, serve, watch)
  test/          — smoke and unit tests (shell + jq/awk/sed/grep)
  assets/        — CSS, JS, images, data
  pages/         — HTML pages
  .env           — central environment variables (sensitive)
  .env.template  — placeholder keys for .env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Serve (local dev)
  scripts/serve.sh start     — sudo apache2ctl start
  scripts/serve.sh stop     — sudo apache2ctl stop
  scripts/serve.sh reload   — sudo apache2ctl graceful  (preferred)
  scripts/serve.sh status   — apache2ctl -S or systemctl status apache2

Watch + hot-reload (client-side polling)
  scripts/watch.sh           — poll file changes via cksum, on change:
                                touch reload trigger
                                sudo apache2ctl graceful
  Browser polls /reload.txt every ~1s; if timestamp changes → location.reload()
  (minimal inline JS only; no external reload library)

Validate JSON
  jq . file.json >/dev/null && echo ok || echo "INVALID JSON"

Lint HTML (POSIX)
  scripts/lint-html.sh <file>
    checks: <!DOCTYPE html>, <html lang="en-AU">, charset, viewport,
    <label for> on form inputs, alt on images (basic grep/awk)

Lint CSS (POSIX)
  scripts/lint-css.sh <file>
    checks: no // comments (grep), block comments /* ... */ only,
    basic whitespace / selector checks (awk/sed)

Lint JSON (POSIX)
  scripts/lint-json.sh       — jq . on all *.json files, report errors

Minify (POSIX, conservative)
  scripts/minify-css.sh <in.css> <out.css>
  scripts/minify-js.sh  <in.js>  <out.js>
  Note: these are whitespace-only collapse; review before deploying

Run single test
  scripts/test-one.sh test/smoke/example.test.sh

Run all tests
  scripts/test-all.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. CODING PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Plaintext .txt   — content, key/value pairs
  2. .csv             — tabular data (products, categories)
  3. Static HTML5     — semantic, accessible, no JS unless unavoidable
  4. Vanilla CSS      — modular partials, /* */ comments only
  5. JSON             — structured data only when necessary
  6. Native browser APIs — before vanilla JS
  7. Vanilla JS        — last resort; small, documented modules

HTML rules
  <!DOCTYPE html> top-line, <html lang="en-AU">
  <meta charset="utf-8">, <meta name="viewport" content="width=device-width,initial-scale=1">
  Semantic elements: header, nav, main, footer, article, section, aside
  Images: alt text or role="presentation"
  Forms: <label for> bound to every input
  ARIA only when semantic HTML cannot express semantics
  No JS unless progressive enhancement requires it

CSS rules
  Block comments /* ... */ only — NEVER // in .css files
  Modular partials in assets/css/partials/
  Prefer utility classes; avoid deep selector chains

JS rules
  ES modules only where needed; inline <script> for critical path only
  Keep modules small and single-purpose
  Declarative HTML + CSS over JS-driven layout

Naming
  Files: kebab-case (cart-store.js, image-processor.worker.js)
  Variables/functions: camelCase
  Classes/constructors: PascalCase
  Constants: UPPER_SNAKE_CASE

Error handling
  Fail quietly in UI; log via console.error() with minimal data
  Scripts: non-zero exit code on failure
  Never expose sensitive values (email, keys) in console/error output

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. GIT WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Local development (apache2 + opencode simultaneous editing)

  1. Start apache2:
       scripts/serve.sh start
  2. Open site in browser; opencode edits files concurrently
  3. Start watcher for hot-reload:
       scripts/watch.sh &
  4. On file save, watcher triggers graceful reload; browser polls
     /reload.txt and reloads page automatically

Branch strategy
  main              — stable, deployable
  feat/<short-name>  — new features
  fix/<short-name>  — bug fixes
  refactor/<name>   — refactors

Typical workflow
  git checkout -b feat/my-feature
  # ... make changes, commit often ...
  git push -u origin feat/my-feature
  # open PR on GitHub, review, squash-merge
  git checkout main && git pull

Commit style
  <type>(<scope>): short summary
  types: feat, fix, chore, refactor, docs, test, perf
  examples:
    fix(store): validate product IDs before render
    refactor(cart): remove duplicate quantity check
    docs(readme): add apache2 setup instructions

Commit rules
  Commit early, commit often — small focused commits
  Every commit should pass lint + tests locally before push
  Never commit .env with real secrets
  Squash-merge PRs on GitHub; clean commit history on main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. VALIDATION SEQUENCE (post-change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After every substantive change, run this sequence:

  1. scripts/lint-json.sh          — all *.json files valid
  2. scripts/lint-html.sh <file>  — doctype, lang, meta, labels
  3. scripts/lint-css.sh <file>   — no // comments, basic checks
  4. scripts/minify-css.sh ...      — generate dist/ artifact (review)
  5. scripts/minify-js.sh  ...      — generate dist/ artifact (review)
  6. scripts/test-all.sh           — smoke + unit tests pass

If any step fails: fix and re-run. After 3 failed automated attempts,
summarize root causes and escalate to human reviewer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. ENVIRONMENT VARIABLES & SECRETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.env at repo root — central, NOT committed with real values.

Required keys:
  PAYPAL_EMAIL=
  PRODUCTS_CSV_PATH=./assets/js/data/products.csv
  SITE_BASE_URL=http://localhost:8000
  STORE_POSTCODE=6147
  STORE_STATE=WA

Rules
  .env is .gitignored
  Never populate PAYPAL_EMAIL or other secrets without explicit
    user-provided values
  If .env is missing or incomplete, ask user for values before
    writing anything to .env
  .env.template holds safe placeholder keys (can be committed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. REFACTOR / HOUSEKEEPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Suckless principle: do one thing well, simply.

  Remove unused, duplicated, or conflicting files and logic
  Prefer single source of truth for any data (one CSV)
  Remove large unused JS modules; favour small, testable scripts
  When refactoring: work on a branch, commit often, small PRs
  Include lint + test validation in every PR

Escalate to human review before:
  Touching payment / PayPal flow
  Adding external services or analytics
  Large service-worker or caching policy changes
  Modifying .env production values

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. CO-PILOT / AGENT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CSS comment policy (from .github/copilot-instructions.md)
  Use /* ... */ only in CSS. Never // in .css files.

Agents must reference (from .github/copilot-instructions.md)
  .github/agents/accessibility.agent.md
  .github/agents/janitor.agent.md
  .github/agents/modernization.agent.md
  .github/agents/Ultimate-Transparent-Thinking-Beast-Mode.agent.md
  .github/instructions/*.instructions.md (security, a11y, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. REFERENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checked files
  .github/copilot-instructions.md  — CSS policy, auto-context rules
  README                           — project intent
  assets/js/data/products.json     — broken; replaced by products.csv
  assets/js/modules/               — cleanup planned (see refactor plan)
  scripts/                         — POSIX scripts replacing Node scripts

Contact
  2MuchC0ff33@example.org (replace before merge)
