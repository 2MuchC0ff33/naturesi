AGENTS.md — Agent Guidelines (POSIX-first)
=========================================

Purpose
  Guide agentic contributors (automated agents and human reviewers) on
  how to lint, minify, serve, test, and commit using only POSIX
  utilities. Shell scripts use /bin/sh. Node.js tools (ESLint, Prettier)
  are used for JS/CSS/HTML formatting only; all data processing and
  testing uses POSIX utilities.

Project scope
  Static HTML5 site + vanilla CSS + vanilla JS (last resort).
  Data: plaintext .txt / .csv first, JSON only when unavoidable.
  Sensitive values: central .env at repo root.

Shell
  Default script shell: /bin/sh (POSIX-compliant). Shebang for all scripts:
    #!/bin/sh
  POSIX utilities: sh, awk, sed, grep, jq, bc, patch, diff, find,
  stat, cut, tr, sort, uniq, cksum, xargs, printf, date, wc, etc.
  ShellCheck 0.9.0 is installed: shellcheck -s sh -S warning <script>
  Bash-specific syntax is FORBIDDEN in .sh scripts:
    no [[, ((, declare, local, $RANDOM, bash arrays (arr=()), ${arr[@]})
    Use while-read instead of arrays; awk for random numbers.
  yash is not used. All existing scripts migrated from #!/usr/bin/env yash.

File layout
  scripts/          — maintenance scripts (lint, minify, serve, watch)
  scripts/awk/      — AWK scripts (extract-css-vars, csv-stats, css-complexity, etc.)
  scripts/sed/      — SED scripts (normalize-meta, strip-comments, extract-urls, etc.)
  scripts/jq/       — JQ scripts (validate-products, summarize-products, build-nav, etc.)
  scripts/bc/       — BC scripts (shipping-calc, price-total, tax-calc, etc.)
  test/             — smoke and unit tests (shell + jq/awk/sed/grep)
  test/smoke/       — smoke tests (html, css, links, images, seo, a11y, etc.)
  test/unit/        — unit tests (cart, checkout, payment, shipping, etc.)
  test/headless/    — Chromium headless browser tests (DOM, localStorage, forms)
  test/e2e/         — end-to-end flow tests (cart→checkout→paypal, etc.)
  data/             — flat-file data (categories.txt, shipping-zones.txt, etc.)
  partials/         — .txt content partials (header, footer, nav, etc.)
  assets/           — CSS, JS, images, data
  pages/            — HTML pages
  .env              — central environment variables (sensitive)
  .env.template     — placeholder keys for .env

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

Lint HTML (full)
  scripts/lint-html-full.sh
    checks: basic + duplicate IDs (awk), heading hierarchy h1→h2→h3,
    HTML5 semantic elements (header/main/nav/footer), data-* validity,
    required attribute on inputs, autocomplete on forms,
    noscript fallback, viewport maximum-scale abuse

Lint CSS (POSIX)
  scripts/lint-css.sh <file>
    checks: no // comments (grep), block comments /* ... */ only,
    basic whitespace / selector checks (awk/sed)

Lint CSS (full)
  scripts/lint-css-full.sh
    checks: basic + unused CSS classes vs HTML (awk),
    duplicate property declarations (awk), specificity warnings (awk),
    z-index conflicts (awk), missing font fallbacks,
    color contrast hints (awk), flex/grid gap fallbacks

Lint Shell (ShellCheck)
  scripts/lint-shellcheck.sh
    runs: shellcheck -s sh -S warning on all .sh files
    fails on SCxxxx errors; fix before committing

Lint Data
  scripts/lint-data.sh
    validates all .json via jq, all .csv via awk, all .txt via grep

Lint Accessibility
  scripts/lint-a11y.sh
    checks: ARIA roles, positive tabindex, aria-hidden on focusable,
    alt on images, label bindings, skip links, focus management

Lint JSON (POSIX)
  scripts/lint-json.sh       — jq . on all *.json files, report errors

Minify (POSIX, conservative)
  scripts/minify-css.sh <in.css> <out.css>
  scripts/minify-js.sh  <in.js>  <out.js>
  Note: these are whitespace-only collapse; review before deploying

Format JS
  scripts/format-js.sh        — npx prettier --write on .js files
  scripts/format-css.sh        — npx prettier --write on .css files
  scripts/format-html.sh       — npx prettier --write on .html files

Headless Tests (Chromium)
  scripts/test-headless.sh     — runs all test/headless/*.test.sh
  prerequisites: apache running (scripts/serve.sh start)
  requires: chromium or chromium-browser in PATH
  note: PhantomJS is NOT used (deprecated)
  If chromium missing: tests skip with WARN (exit 0)

Content Partials
  scripts/generate-partials.sh — pre-deploy: inject partials/*.txt into HTML
                                at <!-- INCLUDE name --> markers
  scripts/lint-partials.sh     — verify all INCLUDE markers resolve,
                                no broken includes, valid UTF-8

AWK scripts
  scripts/awk/extract-css-vars.awk    — extract --var: value from CSS
  scripts/awk/csv-stats.awk           — product CSV statistics
  scripts/awk/css-complexity.awk      — CSS metrics (selectors, nesting depth)
  scripts/awk/js-metrics.awk         — JS complexity (functions, exports)
  scripts/awk/check-links.awk          — link validation (internal/external/anchor)
  scripts/awk/json-report.awk         — JSON report generation

SED scripts
  scripts/sed/normalize-meta.sed     — collapse multi-line meta tags in HTML
  scripts/sed/strip-css-comments.sed — remove /* */ from CSS
  scripts/sed/strip-js-comments.sed  — remove // and /* */ from JS
  scripts/sed/extract-urls.sed      — pull src/href/url() from HTML/CSS
  scripts/sed/dedupe-css-rules.sed  — remove duplicate CSS rules

JQ scripts
  scripts/jq/validate-products.jq     — validate products.json structure
  scripts/jq/summarize-products.jq   — product summary stats
  scripts/jq/extract-categories.jq   — unique categories sorted
  scripts/jq/enrich-cart.jq         — join cart + products
  scripts/jq/build-nav.jq            — generate <li> nav from categories
  scripts/jq/lint-data.jq            — lint all JSON data files

BC scripts
  scripts/bc/shipping-calc.bc        — shipping: base + surcharges + GST
  scripts/bc/price-total.bc          — line totals, subtotal, grand total
  scripts/bc/tax-calc.bc             — 10% GST
  scripts/bc/price-breakdown.bc      — full price breakdown
  each .bc script includes inline self-test comments

Run single test
  scripts/test-one.sh test/smoke/example.test.sh

Run all tests
  scripts/test-all.sh                  — smoke + unit tests (no server needed)
  TEST_PATTERN="cart" scripts/test-all.sh  — filter by name

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

.txt partials
  Content includes via <!-- INCLUDE name --> markers.
  Build via scripts/generate-partials.sh (pre-deploy only, not watched).
  Partials stored in partials/ directory.
  Use for: header, footer, nav, contact details, social links.
  Do NOT use server-side includes or runtime injection.

Flat-file data
  All structured data in data/ directory.
  .csv for tabular data (products.csv is canonical, do not split)
  key-value .txt for simple config (categories.txt, shipping-zones.txt)
  JSON only when hierarchical or array structure is unavoidable
    (australian_postcodes.json, postage.json — keep as JSON)

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

MANDATORY: Every session and before/after every change set, the agent
MUST proactively run git checks WITHOUT being asked. Do not wait for the
user to request it. Git workflow is part of the development loop, not an
optional afterthought.

Shell: always run git commands from the repo root
  cd /home/twomuchcoffee/.local/src/naturesi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3a. MANDATORY SESSION START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

At the START of EVERY session (before writing any code):

  git fsck --full
  git status
  git log --oneline -3
  git branch -a
  git worktree list

If fsck reports dangling/blobs with "missing" — investigate before proceeding.
If there are uncommitted changes from a previous session — ask the user
whether to commit, stash, or abandon them before starting new work.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3b. BEFORE EVERY COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before every git commit:

  1. Run validation sequence (see Section 4) — all lints and tests must pass.
  2. git status — review what changed (including deleted or unused files).
     Check for: replaced files (e.g. .svg replaced by .webp), orphaned assets.
  3. git worktree list — check for stale worktrees to clean up.
  4. git diff --stat — verify scope of changes.
  5. Stage only the files related to this logical change.
  6. git diff --cached — inspect staged diff before committing.
  7. Commit with a meaningful message following the format in 3d.

DO NOT commit broken code, failing lints, or failing tests.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3c. AFTER EVERY COMMIT (or set of commits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After every commit or logical group of commits:

  git fsck --full
  git log --oneline -3

This is MANDATORY. Run it automatically after git commit without being asked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3d. BRANCH STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before every session, inspect the working tree to understand what
changes already exist and avoid conflicting work.

  git status                       — show staged, unstaged, untracked files
  git log --oneline -5             — last 5 commits (message + hash)
  git branch -a                    — all local and remote branches
  git remote -v                    — show fetch/push remotes
  git fsck --full                  — check object database for corruption
  git worktree list                — list all worktrees and their branches

If fsck reports dangling/blobs with "missing" — investigate before proceeding.
If there are uncommitted changes from a previous session — decide whether
to commit them, stash them, or abandon them before starting new work.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3e. WORKTREES (parallel checkouts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use worktrees for:
  - Reviewing a PR while continuing main development
  - Running a refactor in isolation without switching
  - Comparing the same page across two branches side by side

Create a worktree:
  git worktree add ../naturesi-review pr/123-review
  git worktree add ../naturesi-feat-search feature/search-improvements

List worktrees:
  git worktree list

Prune stale worktree refs (run after deleting a worktree dir manually):
  git worktree prune

Remove a worktree (safely):
  git worktree remove ../naturesi-review
  git worktree remove ../naturesi-review --force   (force — if worktree has uncommitted changes)

Worktree rules:
  - Each worktree is a separate working directory — apache serve.sh serves
    from one worktree at a time (edit scripts/serve.sh DOCUMENT_ROOT if needed)
  - Never push from a worktree that is behind its tracking branch
  - Keep worktree names short and descriptive (dir names are visible in prompt)
  - ALWAYS remove a worktree immediately after the task is complete and
    changes are squash-merged into the feature branch
  - Never leave stale worktrees lying around — they create confusion about
    which directory is active and which is the canonical worktree

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3e2. WORKTREE-PER-CHANGE PATTERN (preferred for significant changes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each significant change or feature area, create a dedicated worktree.
This keeps the main feature branch clean and avoids polluting it with
many small experimental commits.

Recommended workflow for each change:

  1. START: On feature branch, create a new worktree for this change:
       git checkout feature/enhance-ui-ux
       git worktree add ../naturesi-change-name feature/enhance-ui-ux

  2. SWITCH: Checkout the new worktree and implement the change:
       cd ../naturesi-change-name
       # edit files, lint, test
       ./scripts/lint-html.sh <file>
       ./scripts/lint-css.sh <file>
       ./scripts/test-all.sh

  3. COMMIT: On the worktree, commit the logical unit:
       git add <changed files>
       git commit -m "feat(scope): concise summary"

  4. INTEGRATE: Switch back to feature branch, cherry-pick or merge:
       cd /path/to/feature/enhance-ui-ux
       git cherry-pick <commit-hash>
       # OR merge: git merge --no-ff ../naturesi-change-name

  5. SQUASH: If merging a worktree, squash into one clean commit on feature:
       git merge --squash ../naturesi-change-name
       git commit -m "feat(scope): concise summary"

  6. CLEANUP: Remove worktree immediately after integrating:
       git worktree remove ../naturesi-change-name
       git worktree prune

  7. VERIFY: Confirm clean state:
       git fsck --full
       git worktree list

When to use this pattern vs. committing directly:
  - USE worktree-per-change: new feature areas, refactors, cross-cutting changes,
    or anything that touches 5+ files across multiple systems
  - COMMIT DIRECTLY (OK): small targeted changes, single-file fixes, obvious
    incremental improvements within the same feature area
  - NEVER leave a worktree unused for more than one session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3e3. BRANCH-PER-CHANGE PATTERN (alternative to worktrees)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use a dedicated feature branch instead of a worktree when:
  - The change is isolated to one or two files (e.g. a single CSS component)
  - No risk of conflicting with other in-progress work on the main feature branch
  - The change is simple enough that commit history is self-explanatory
  - You want a clean PR ready for review without squash-merging

When to use branch-per-change:
  1. Create a short-lived feature branch from the main feature branch:
       git checkout -b feat/enhance-header-ui feature/enhance-ui-ux
  2. Make targeted changes, commit, push:
       git push -u origin feat/enhance-header-ui
  3. Open a PR or merge when ready (squash or rebase-merge preferred)
  4. Delete the branch after merging:
       git branch -d feat/enhance-header-ui

Use BRANCH-PER-CHANGE when:
  - You want a clean PR for code review
  - The change touches only 1-2 files in one area
  - You need the change reviewed separately before merging
  - The work can be done in a single session

Use WORKTREE-PER-CHANGE when:
  - You need to work on multiple things simultaneously
  - The change is exploratory or experimental
  - You want to keep the main feature branch clean during development
  - The change touches many files and will be squash-merged anyway

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3f. COMMITTING: RULES AND STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3f. COMMITTING: RULES AND STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit early, commit often — every logical unit is its own commit.
Small commits make rollback precise, blame useful, and review faster.

Commit message format:
  <type>(<scope>): short summary (50 chars or fewer)

  types:
    feat    — new user-facing feature
    fix     — bug fix
    perf    — performance improvement
    refactor — internal change, no feature or fix
    chore   — tooling, config, deps, CI
    docs    — documentation only
    test    — adding or fixing tests
    style   — formatting, whitespace (no logic change)
    ci      — CI/CD pipeline changes

  scope: the file, module, or area affected (e.g. cart, hero, search)

  examples:
    feat(hero): remove autoplay from video element
    fix(search): add missing form id on contact.html
    refactor(autoplay-loop): remove retry loop to prevent flicker
    docs(AGENTS): add git workflow documentation
    chore(css): extract hero video styles to hero.css
    perf(poster): crop poster to 16:9 from square logo.webp

  Rules:
    - First line: imperative mood, no period, 50 chars max
    - Body (optional): explain WHY, not WHAT. 72 chars per line.
    - Footer: reference issues/tickets: "Fixes #42"
    - Never commit .env with real values
    - Every commit must pass lint + tests locally before commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3g. COMMIT WORKFLOW (step by step)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Check what changed:
       git status
       git diff --stat          (summary of changed files)
       git diff                (full diff)

  2. Stage changes in logical groups:
       git add pages/index.html assets/css/partials/components/hero.css
       git add assets/js/modules/autoplay-loop.js
       # never: git add . (unless truly all changes are related)

  3. Inspect staged diff (before committing):
       git diff --cached

  4. Commit with a meaningful message:
       git commit -m "fix(hero): centre poster logo with object-position"

  5. Repeat for each logical unit — multiple commits per session is fine

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3h. AMENDING AND FIXING COMMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Amend the last commit (ONLY if not yet pushed):
  git commit --amend -m "fix(hero): centre poster logo with object-position"

  Rules:
    - NEVER amend if the commit is on main or has been pushed
    - NEVER amend a commit that another developer may have based work on
    - If a pushed commit is wrong: make a new fix commit, don't amend

Undo the last commit (keep changes staged):
  git reset --soft HEAD~1

Undo the last commit (keep changes unstaged):
  git reset HEAD~1

Discard ALL uncommitted changes (irreversible):
  git checkout -- .
  git clean -fd          (also removes untracked files)

Discard a specific file:
  git checkout -- assets/css/partials/components/hero.css

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3i. STASHING (temporary saves)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stash uncommitted work (before switching branches or pulling):
  git stash push -m "wip: hero video centred"

List stashes:
  git stash list

Restore most recent stash (keep the stash):
  git stash apply

Restore and drop the stash:
  git stash pop

Drop a specific stash:
  git stash drop stash@{2}

Stash with untracked files:
  git stash push -u -m "wip: hero video centred"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3j. VIEWING AND NAVIGATING HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  git log --oneline                         one line per commit
  git log --oneline --graph --all           visual branch graph
  git log --oneline -10                     last 10 commits
  git log --author="name"                   commits by author
  git log --since="2026-03-01"             commits since date
  git log -- assets/css/partials/hero.css   commits touching a file
  git log -p -- assets/css/partials/hero.css  commits + diffs for a file

  git show <hash>                           show a specific commit
  git show HEAD                            show last commit
  git diff HEAD~3..HEAD                     diff last 3 commits
  git diff main..feat/my-feature            diff between branches
  git blame assets/css/partials/hero.css   line-by-line author per line

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3k. REBASING (interactive and non-interactive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rebase current branch onto updated main (non-interactive):
  git fetch origin
  git rebase origin/main

Interactive rebase (rewrite last N commits):
  git rebase -i HEAD~5

  Commands in interactive mode:
    pick  — keep commit as-is
    reword — change the commit message
    squash — meld into previous commit
    drop   — remove commit

  Rules:
    - NEVER rebase commits that have been pushed (except on feature branches
      that no one else has based work on)
    - After rebasing, force-push: git push --force-with-lease
    - Use --force-with-lease instead of --force (safer — rejects if someone
      else pushed to the branch)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3l. PUSHING AND PULLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Push a new branch (set upstream tracking):
  git push -u origin feat/my-feature

Push normally:
  git push

Force-push after rebase:
  git push --force-with-lease

Fetch all remotes without merging:
  git fetch --all

Pull (fetch + merge):
  git pull

Pull with rebase (preferred for feature branches):
  git pull --rebase origin feat/my-feature

Fetch and prune stale remote branches:
  git fetch --prune

Delete a remote branch:
  git push origin --delete feat/my-feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 3m. MERGING (on feature branch, before PR)
 ━━━━━━━━━━━━━━━━━━━━━━━━

Before opening a PR, squash your work on the feature branch into a
  small number of logical commits. The user manages PRs on GitHub.

  Stale files: before committing, check for deleted or unused files (e.g. a .svg
  replaced by a .webp) and stage the deletion. Run `git status` to catch any
  untracked or deleted files before committing.

  Branch hygiene: BEFORE starting new work on a feature branch, check whether
  the branch has accumulated many small commits (20+). If so, offer to squash
  into logical groups BEFORE adding more commits. This keeps history clean and
  review faster.

  Worktree hygiene: AFTER completing work in a worktree (review, refactor, etc.),
  remove the worktree immediately. Check for stale worktrees with git worktree list
  before and after every session.

  Squash commits on the current branch (interactively or non-interactively):

    # Non-interactive: squash last N commits into 1
    # (keeps changes staged, re-commit with clean message)
    git reset --soft HEAD~N
    git commit -m "fix(scope): concise summary"

    # Interactive: rewrite last N commits
    git rebase -i HEAD~N
    # pick, squash, drop as needed

    # Logical grouping method (recommended for large squash):
    # 1. Count enhancement commits: git log --oneline | grep -n BASE
    # 2. Reset to base: git reset --soft HEAD~N
    # 3. Stage and commit in logical groups:
    #    git add <group1-files> && git commit -m "feat(scope): summary"
    #    git add <group2-files> && git commit -m "feat(scope): summary"
    #    (repeat for each logical unit)
    # 4. Force-push: git push --force-with-lease origin feat/my-feature

    # Then force-push
    git push --force-with-lease origin feat/my-feature

  Check if branch is fully merged (after PR is approved):
    git branch --merged main
    git branch --no-merged main

  Merge a feature branch into main (user does this on GitHub):
    # Do NOT merge locally unless user explicitly requests it.
    # Squash-merge on GitHub is preferred for a clean main history.
    # User manages PRs — agent only prepares the branch.

  Abort a merge in progress:
    git merge --abort

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3n. INSPECTION AND RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Find a lost commit (after reset or bad rebase):
  git reflog                         show all HEAD movements
  git checkout <hash>                restore a lost commit

Recover a deleted branch:
  git reflog
  git checkout -b feat/my-feature <hash>

Check for corruption:
  git fsck --full --unreachable      check unreachable objects
  git fsck --lost-found              dump unreachable objects to .git/lost-found/

Inspect a specific object:
  git cat-file -t <hash>            object type
  git cat-file -p <hash>            object content

Check for large files in history:
  git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | grep -v blob | sort -k3 -n -r | head -10

Remove a large file from history (use with caution):
  git filter-repo --invert-paths --path path/to/large-file.webp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3o. TYPICAL SESSION WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  # Start of session
  git fsck --full
  git status
  git log --oneline -3

  # Start or continue feature
  git checkout -b feat/my-feature     (if new)
  git checkout feat/my-feature        (if continuing)

  # Make changes, validate, commit (repeat)
  # ... edit files ...
  scripts/lint-html.sh index.html
  scripts/lint-css.sh assets/css/partials/components/hero.css
  scripts/test-all.sh
  git add <changed files>
  git commit -m "fix(hero): centre poster logo"

  # Before push
  git fsck --full
  git log --oneline -5
  git diff --stat

  # Push (user manages PRs on GitHub)
  git push -u origin feat/my-feature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3p. LOCAL DEVELOPMENT (apache2 + opencode simultaneous editing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Start apache2:
       scripts/serve.sh start
  2. Open site in browser; opencode edits files concurrently
  3. Start watcher for hot-reload:
       scripts/watch.sh &
  4. On file save, watcher triggers graceful reload; browser polls
      /reload.txt and reloads page automatically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. VALIDATION SEQUENCE (post-change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After every substantive change, run this sequence:

  1. scripts/lint-json.sh              — all *.json files valid (jq)
  2. scripts/lint-shellcheck.sh        — shellcheck on all *.sh files
  3. scripts/lint-shell.sh             — POSIX compliance checks
  4. scripts/lint-js.sh                — JS syntax + ESLint
  5. scripts/lint-css.sh               — CSS lint (no //, comments)
  6. scripts/lint-html.sh              — DOCTYPE, lang, meta, labels
  7. scripts/lint-a11y.sh              — accessibility (ARIA, tabindex, alt)
  8. scripts/lint-data.sh              — all data files (.json, .csv, .txt)
  9. scripts/lint-partials.sh          — partial INCLUDE markers resolve
 10. scripts/test-all.sh               — smoke + unit tests (no server needed)
 11. scripts/test-headless.sh          — Chromium headless tests (requires apache)

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
  TODO.md                          — implementation task tracker (Phases 1-10)
  assets/js/data/products.csv       — canonical product data
  assets/js/modules/               — JS modules (cart, checkout, payment, etc.)
  scripts/                         — POSIX maintenance scripts

Contact
  2MuchC0ff33@example.org (replace before merge)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. HEADLESS BROWSER TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Browser: Chromium headless only (version 146+ at /snap/bin/chromium).
  NOT PhantomJS (deprecated, not installed).

Prerequisites: apache2 running at http://localhost:8000
  scripts/serve.sh start

Test layers:
  Layer 1 — file:// smoke: no server needed
    test/headless/site-smoke.test.sh    — load every HTML page, no crash
    test/headless/dom-structure.test.sh — verify key DOM elements exist

  Layer 2 — localhost: full tests (requires apache)
    test/headless/cart-*.test.sh        — localStorage, cart count, add to cart
    test/headless/checkout-*.test.sh    — form population, PayPal redirect
    test/headless/payment-*.test.sh     — success/cancel flow
    test/headless/shipping-*.test.sh    — postcode lookup, rate display
    test/headless/product-*.test.sh     — add-to-cart from product pages
    test/headless/modal.test.sh          — focus trap, open/close
    test/headless/search.test.sh         — search filtering
    test/headless/service-worker.test.sh — SW install, cache, offline

Run:
  scripts/test-headless.sh              — runs all test/headless/*.test.sh
  chromium must be in PATH (set CHROMIUM env var if not)
  If chromium missing: tests skip with WARN (exit 0)

Chromium invocation pattern:
  CHROMIUM --headless --disable-gpu --no-sandbox \
      --enable-logging --v=1 \
      --virtual-time-budget=5000 \
      "$TARGET_URL" --dump-dom 2>&1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. AWK / SED / JQ / BC SCRIPTING CONVENTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each scripting language lives in its own scripts/ subdirectory.
Standalone scripts are preferred over inline code in test/lint scripts.
Each script must:
  - Have a shebang: #!/bin/sh (wraps AWK/JQ) or be directly executable
  - Have a header comment describing purpose, usage, and examples
  - Exit 0 on success, non-zero on failure
  - Include inline self-test (jq/bc scripts must verify their output)

AWK scripts (scripts/awk/)
  Use GNU AWK (gawk) features only when necessary; prefer POSIX AWK.
  Key scripts:
    extract-css-vars.awk — CSS variable definitions (--var: value)
    csv-stats.awk        — product counts, price ranges by category
    css-complexity.awk  — selectors, nesting depth, declarations
    js-metrics.awk     — functions, exports, comment density
    check-links.awk     — internal/external/anchor link categorization
    json-report.awk     — jq -c stream processing

SED scripts (scripts/sed/)
  Use POSIX BRE; ERE only when necessary with -E flag.
  Key scripts:
    normalize-meta.sed    — collapse multi-line meta tags in HTML
    strip-css-comments.sed — remove /* */ from CSS
    strip-js-comments.sed  — remove // and /* */ from JS
    extract-urls.sed     — pull src/href/url() values
    dedupe-css-rules.sed — remove duplicate CSS rules

JQ scripts (scripts/jq/)
  Use jq 1.7. Each script should be a standalone .jq file.
  Key scripts:
    validate-products.jq  — required fields, types, non-null IDs
    summarize-products.jq — category counts, stock status
    extract-categories.jq  — unique sorted categories
    enrich-cart.jq        — join cart + products.json
    build-nav.jq          — generate <li> nav HTML
    lint-data.jq          — lint all JSON data files

BC scripts (scripts/bc/)
  Use bc 1.07.1 with scale=2 for AUD cent precision.
  Each script must include inline self-test comments:
    # SELF-TEST: echo "input" | bc -q scripts/bc/script.bc
    # Expected: <output>
  Key scripts:
    shipping-calc.bc   — base + regional/remote surcharges + GST x 1.1
    price-total.bc     — qty x price per item, subtotal, grand
    tax-calc.bc        — 10% GST
    price-breakdown.bc — full: subtotal -> GST -> shipping -> grand

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. CART / CHECKOUT / PAYMENT TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Three test layers (choose based on what needs verifying):

Layer 1 — POSIX shell (structure, static analysis)
  test/unit/cart-key-consistency.test.sh     — nature si_cart key across all JS
  test/unit/checkout-form-structure.test.sh  — form action, inputs, button
  test/unit/paypal-urls.test.sh             — sandbox/prod URLs, return/cancel
  test/unit/shipping-zone.test.sh           — postcode zone detection (awk)
  test/unit/shipping-bc.test.sh             — bc shipping-calc correctness
  test/unit/shipping-weight-bc.test.sh      — bc price-total correctness

Layer 2 — Node.js + JSDOM (logic, business rules)
  test/unit/cart-add.test.sh          — CartStore.add(): valid, invalid, merge
  test/unit/cart-remove.test.sh       — remove by ID, by ID+size, non-existent
  test/unit/cart-update-qty.test.sh   — updateQuantity: zero (remove), positive
  test/unit/cart-merge.test.sh         — same item twice -> quantities merge
  test/unit/cart-empty.test.sh        — empty cart -> { items: [] }
  test/unit/checkout-parse.test.sh    — parseCartRaw: legacy, {cart,shipping}, null
  test/unit/checkout-total.test.sh    — computeGrandTotal: various carts
  test/unit/checkout-render.test.sh  — renderSummaryToString: HTML + totals
  test/unit/checkout-label.test.sh   — computeItemLabel: truncation, multi-item
  test/unit/checkout-normalize.test.sh — normalizeCartItem: valid, missing, zero
  test/unit/payment-return-params.test.sh  — hasPayPalReturnParams: PayerID, tx, paymentId
  test/unit/payment-cancel.test.sh    — handlePaymentCancel: true/false
  test/unit/payment-success.test.sh   — handlePaymentReturn: clears localStorage
  test/unit/shipping-zone-wa.test.sh  — getPostcodeZone: WA sameCity/nearMetro/outer/national
  test/unit/shipping-rate.test.sh     — calculateParcelRate: zone x parcel type
  test/unit/shipping-weight.test.sh   — calculateShippingByWeight: weight -> parcel type

Layer 3 — Chromium headless (DOM, localStorage, forms, SW)
  test/headless/cart-render.test.sh         — cart table renders from localStorage
  test/headless/cart-add.test.sh            — submit form, cart count increments
  test/headless/checkout-form.test.sh       — localStorage -> PayPal form populated
  test/headless/paypal-redirect.test.sh     — form action = sandbox URL
  test/headless/payment-success.test.sh     — ?tx=XXX -> cart cleared
  test/headless/payment-cancel.test.sh      — cancel -> cart preserved
  test/headless/shipping-estimate.test.sh   — postcode -> shipping estimate
  test/headless/product-add-flow.test.sh    — product page -> add to cart -> count
  test/headless/service-worker.test.sh       — SW install, cache, offline

E2E flow tests (test/e2e/)
  cart-to-checkout.test.sh   — cart JSON -> checkout -> summary HTML
  checkout-to-paypal.test.sh — cart -> PayPal form fields populated
  payment-success-flow.test.sh  — ?tx=XXX -> cart key removed
  payment-cancel-flow.test.sh  — cancel -> cart preserved

Regression: deleted module references must be zero
  grep -rE 'product-grid-generator|checkout-bootstrap|worker-registry|autoplay-loop|shared-cart' \
      assets/js/ --include='*.js'
