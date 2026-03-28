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

MANDATORY: Every session and before/after every change set, the agent
MUST proactively run git checks WITHOUT being asked. Do not wait for the
user to request it. Git workflow is part of the development loop, not an
optional afterthought.

Shell: always run git commands from the repo root
  cd /home/twomuchcoffee/.local/src/naturesi

━━━━━━━━━━━━━━━━━━━━━━━━
3a. MANDATORY SESSION START
━━━━━━━━━━━━━━━━━━━━━━━━

At the START of EVERY session (before writing any code):

  git fsck --full
  git status
  git log --oneline -3
  git branch -a

If fsck reports dangling/blobs with "missing" — investigate before proceeding.
If there are uncommitted changes from a previous session — ask the user
whether to commit, stash, or abandon them before starting new work.

━━━━━━━━━━━━━━━━━━━━━━━━
3b. BEFORE EVERY COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━

Before every git commit:

  1. Run validation sequence (see Section 4) — all lints and tests must pass.
  2. git status — review what changed
  3. git diff --stat — verify scope of changes
  4. Stage only the files related to this logical change
  5. git diff --cached — inspect staged diff before committing
  6. Commit with a meaningful message following the format in 3d.

DO NOT commit broken code, failing lints, or failing tests.

━━━━━━━━━━━━━━━━━━━━━━━━
3c. AFTER EVERY COMMIT (or set of commits)
━━━━━━━━━━━━━━━━━━━━━━━━

After every commit or logical group of commits:

  git fsck --full
  git log --oneline -3

This is MANDATORY. Run it automatically after git commit without being asked.

━━━━━━━━━━━━━━━━━━━━━━━━
3d. BRANCH STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━

Before every session, inspect the working tree to understand what
changes already exist and avoid conflicting work.

  git status                       — show staged, unstaged, untracked files
  git log --oneline -5             — last 5 commits (message + hash)
  git branch -a                     — all local and remote branches
  git remote -v                    — show fetch/push remotes
  git fsck --full                  — check object database for corruption
                                    (run at start of session and before push)
  git worktree list                 — list all worktrees and their branches

If fsck reports dangling/blobs with "missing" — investigate before proceeding.
If there are uncommitted changes from a previous session — decide whether
to commit them, stash them, or abandon them before starting new work.

━━━━━━━━━━━━━━━━━━━━━━━━
3e. WORKTREES (parallel checkouts)
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3f. COMMITTING: RULES AND STYLE
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3g. COMMIT WORKFLOW (step by step)
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3h. AMENDING AND FIXING COMMITS
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3i. STASHING (temporary saves)
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3j. VIEWING AND NAVIGATING HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3k. REBASING (interactive and non-interactive)
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3l. PUSHING AND PULLING
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3m. MERGING AND PULL REQUESTS
━━━━━━━━━━━━━━━━━━━━━━━━

Merge a feature branch into main (on main):
  git checkout main && git pull
  git merge feat/my-feature
  git push

Squash-merge a feature branch (preferred — clean main history):
  git checkout main
  git merge --squash feat/my-feature
  git commit -m "feat(search): add autocomplete and fix form attributes"

Abort a merge in progress:
  git merge --abort

Check if branch is fully merged:
  git branch --merged main
  git branch --no-merged main

Create a GitHub PR from the command line:
  gh pr create --title "feat(search): add autocomplete and fix form attributes" \
               --body "## Summary\n- Add autocomplete dropdown to search\n- Fix missing form id on contact.html" \
               --base main --head feat/search

━━━━━━━━━━━━━━━━━━━━━━━━
3n. INSPECTION AND RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━━━
3o. TYPICAL SESSION WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━

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

  # Push
  git push -u origin feat/my-feature
  gh pr create ...

━━━━━━━━━━━━━━━━━━━━━━━━
3p. LOCAL DEVELOPMENT (apache2 + opencode simultaneous editing)
━━━━━━━━━━━━━━━━━━━━━━━━

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
