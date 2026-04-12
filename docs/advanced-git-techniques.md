# Advanced Git Techniques: Comprehensive Research Report

This document provides comprehensive coverage of 20 advanced Git techniques for the Static HTML5 E-commerce Site project. Each section covers what the technique does, why it matters, practical use cases, relevant commands with examples, and integration considerations for a static HTML5 e-commerce site.

---

## Table of Contents

1. [Git Notes](#1-git-notes)
2. [Git Tags](#2-git-tags)
3. [Git Reflog](#3-git-reflog)
4. [Git Worktrees](#4-git-worktrees)
5. [Git Bisect](#5-git-bisect)
6. [Git Blame](#6-git-blame)
7. [Git Stash](#7-git-stash)
8. [Git Grep/Log/Show](#8-git-grep-log-show)
9. [Git Bundle](#9-git-bundle)
10. [Git Archive](#10-git-archive)
11. [Git Rerere](#11-git-rerere)
12. [Git Submodules/Subtrees](#12-git-submodulessubtrees)
13. [Git Credential Helpers](#13-git-credential-helpers)
14. [Git Hooks](#14-git-hooks)
15. [Git Replace](#15-git-replace)
16. [Git Filter-repo](#16-git-filter-repo)
17. [Git Debug](#17-git-debug)
18. [Git Maintenance](#18-git-maintenance)
19. [Gitattributes](#19-gitattributes)
20. [GitMailmap/.mailmap](#20-gitmailmapmailmap)

---

## 1. Git Notes

### What It Does and Why It Matters

Git Notes allow you to attach arbitrary metadata to commits without modifying the commit itself or its hash. Unlike commit messages which are immutable, notes provide a parallel annotation system for adding retrospective context, deployment information, code review statuses, or any supplementary information that does not belong in commit messages.

Notes are stored as refs (like branches and tags) in `refs/notes/commits` by default, but can use custom namespaces for organization.

### Practical Use Cases for Static HTML5 E-commerce

- **Deployment audit trail**: Track which commits were deployed to production and when
- **Code review tracking**: Document review approvals without polluting commit messages
- **Build metadata**: Attach CI/CD build numbers to commits
- **Issue linking**: Connect commits to external issue tracker entries
- **Post-commit documentation**: Add context discovered after the fact

### Relevant Commands with Examples

```bash
# Add a note to the most recent commit
git notes add -m "Deployed to production on $(date '+%Y-%m-%d')"

# Add a note to a specific commit
git notes add -m "Reviewed by: security-team" abc1234

# Use custom namespace for deployments
git notes --ref=deployments add -m "Production deploy #42" HEAD

# Append to existing note
git notes --ref=deployments append -m "Verified working at 14:30 UTC" HEAD

# View notes
git notes show HEAD
git notes show abc1234

# List all notes refs
git notes list

# Edit a note
git notes edit HEAD

# Remove a note
git notes remove HEAD

# View notes alongside commits in log
git log --show-notes

# Push notes to remote (NOT automatic!)
git push origin refs/notes/*
git push origin refs/notes/deployments

# Fetch notes from remote
git fetch origin refs/notes/*:refs/notes/*
```

### Integration with Static HTML5 E-commerce Site

The project already has hooks that can automate note creation. Example in post-push hook:

```bash
#!/bin/sh
COMMIT_SHA=$(git rev-parse HEAD)
DEPLOYMENT_INFO="Deployed $(date) by $(whoami)"
git notes --ref=deployments append -m "$DEPLOYMENT_INFO" $COMMIT_SHA
```

**Configuration for sharing notes:**
```bash
# Auto-fetch notes with remote
git config remote.origin.fetch "+refs/notes/*:refs/notes/*"

# Auto-push notes
git config --add remote.origin.push "refs/notes/*"
```

---

## 2. Git Tags

### What It Does and Why It Matters

Tags are named references to specific commits, typically used to mark release points. Git supports two types: lightweight (simple pointers) and annotated (full objects with messages, dates, and optional GPG signatures). Tags provide stable reference points for deployments, releases, and version tracking.

### Annotated vs Lightweight

| Aspect | Lightweight | Annotated |
|--------|-------------|-----------|
| Storage | Just a pointer | Full Git object |
| Message | None | Yes, with tagger info |
| Date | Uses commit date | Has creation date |
| GPG Signing | No | Yes |
| Use Case | Local/temporary | Production releases |

### GPG Signing Tags

```bash
# Configure GPG key for signing
git config --global user.signingkey YOUR_KEY_ID
git config --global tag.gpgSign true

# Create annotated tag
git tag -a v1.0.0 -m "Release 1.0.0 - Initial production deployment"

# Create GPG-signed tag
git tag -s v1.0.0 -m "Signed release 1.0.0"

# Create lightweight tag (local/temporary)
git tag v1.0.0-local

# List tags
git tag
git tag -l "v1.*"

# Tag specific commit
git tag -a v0.9.0 abc1234 -m "Beta release"

# Verify tag signature
git tag -v v1.0.0

# Show tag details
git show v1.0.0
```

### Tag Maintenance

```bash
# Delete local tag
git tag -d v0.9.0

# Delete remote tag
git push origin --delete tag v0.9.0

# Prune deleted remote tags
git fetch --prune origin

# Update tag to new commit (force)
git tag -f v1.0.0 abc5678

# List tags with formatting
git tag --format="%(refname:short) - %(creatordate:short) - %(contents:subject)"
```

### Tag Pipelines for Static E-commerce

```bash
# Semantic versioning workflow
MAJOR=1
MINOR=2
PATCH=$(git rev-list --count HEAD)
git tag -a "v${MAJOR}.${MINOR}.${PATCH}" -m "Build $PATCH"

# Pre-release tags
git tag -a "v1.0.0-rc1" -m "Release candidate 1"
git tag -a "v1.0.0-beta.1" -m "Beta release"

# List tags by pattern
git tag -l --format="%(refname:short) %(creatordate:short)" "v[0-9]*"
```

### Integration with Static HTML5 E-commerce Site

```bash
# Production deployment tag workflow
git tag -a "prod-$(date +%Y%m%d-%H%M%S)" -m "Production deployment"
git push origin --tags

# Staging deployment tag
git tag -a "staging-$(date +%Y%m%d)" -m "Staging deploy"
```

---

## 3. Git Reflog

### What It Does and Why It Matters

Reflog (Reference Log) records every update to the tip of branches and HEAD in your local repository. It acts as Git's "security camera" - a chronological journal of all operations that modified references. Reflog is local only and expires (default: 90 days for reachable, 30 for unreachable).

### Why It Matters for Recovery

Git rarely truly loses commits. What usually happens is branch pointers move. Reflog preserves a record of where references pointed, allowing recovery of "lost" commits.

### Practical Commands

```bash
# View reflog for current branch
git reflog

# View reflog for specific branch
git reflog show main
git reflog refs/heads/feature-auth

# View with timestamps
git reflog --date=relative

# Find when you were on a commit
git reflog --all --grep="checkout"

# Recover a deleted branch
git reflog
# Find the commit hash
git branch recovered-branch abc1234

# Undo a hard reset
git reflog
# Find the previous state
git reset --hard HEAD@{1}

# Find commits from specific time
git reflog --since="2024-01-01" --until="2024-01-31"

# Reflog as audit trail
git reflog --format="%h %ad %s" --date=short
```

### Expiration Configuration

```bash
# Default: 90 days reachable, 30 days unreachable
# Extend for critical repositories
git config gc.reflogExpire "365 days"
git config gc.reflogExpireUnreachable "180 days"

# Never expire (use cautiously)
git config gc.reflogExpire "never"

# Per-branch configuration
git config refs/heads/main.reflogExpire "1 year"

# Manual expiration
git reflog expire --expire=30.days --all
```

### Integration with Static HTML5 E-commerce Site

The project already runs `git fsck --full` on session start per AGENTS.md. Reflog complements this for:

- Verifying branch sync after pulls
- Auditing deployment history
- Recovering from accidental hard resets

```bash
# Pre-commit verification (add to workflow)
git fsck --full
git reflog --since="7 days ago" --format="%h %ad %gs %s"
```

---

## 4. Git Worktrees

### What It Does and Why It Matters

Git Worktrees allow multiple working directories attached to the same repository, each checked out to a different branch. This enables parallel development without stashing or switching contexts. Worktrees share the same `.git` object database, making them disk-efficient.

### Why It Matters

- Zero-cost context switching between branches
- Run multiple AI coding agents (Claude Code, etc.) in parallel
- Emergency hotfixes without disrupting feature work
- Code review without branch switching

### Practical Commands

```bash
# Create worktree from existing branch
git worktree add ../naturesi-hotfix main

# Create worktree with new branch
git worktree add -b feature/payment-checkout ../naturesi-payment origin/main

# Detached HEAD worktree
git worktree add --detach ../naturesi-review abc1234

# List all worktrees
git worktree list

# Remove worktree
git worktree remove ../naturesi-hotfix

# Remove worktree with uncommitted changes
git worktree remove --force ../naturesi-feature

# Prune stale worktree entries
git worktree prune

# Lock worktree (e.g., USB drive disconnected)
git worktree lock ../naturesi-hotfix --reason "USB drive"

# Unlock worktree
git worktree unlock ../naturesi-hotfix

# Move worktree
git worktree move ../old-path ../new-path
```

### Use Cases for Static HTML5 E-commerce

```bash
# Scenario: Implementing OAuth while production needs urgent fix
# Current worktree: ~/naturesi (feature/oauth)
# Create hotfix worktree
git worktree add -b hotfix/critical-login ../naturesi-hotfix origin/main

# Scenario: Parallel AI agents for different features
git worktree add -b feat/search-algorithm ../agent-search main
git worktree add -b feat/checkout-flow ../agent-checkout main

# Scenario: Review PR without disturbing work
git fetch origin pull/42/head:pr-42
git worktree add ../pr-review pr-42

# Scenario: Side-by-side comparison
git worktree add ../compare-old v1.2.3
git worktree add ../compare-current main
```

### Project Integration (Already Documented in AGENTS.md)

The AGENTS.md already covers worktree workflow:
```bash
# Create worktree for large features
git worktree add ../naturesi-<name> -b feat/<name>

# Done with worktree
git worktree remove ../naturesi-<name> && git worktree prune
```

### Limitations and Best Practices

```bash
# Do not: Edit same files in multiple worktrees
# Do not: Push force from worktrees without --force-with-lease
# Do: Remove worktrees promptly after merging
# Do: Use consistent naming conventions (project-name-branch)
```

---

## 5. Git Bisect

### What It Does and Why It Matters

Git Bisect uses binary search to find the commit that introduced a bug. Instead of testing every commit (O(n)), it tests log2(n) commits. For 100 commits, only 7 tests needed. For 1000 commits, only 10 tests.

### Manual Bisect Workflow

```bash
# Start bisect session
git bisect start

# Mark current (broken) commit
git bisect bad

# Mark known good commit (tag, branch, or hash)
git bisect good v1.0.0
git bisect good abc1234

# Git checks out midpoint commit
# Test the code
# Mark as good or bad
git bisect good  # bug not present
git bisect bad   # bug present

# Repeat until found
# Git reports first bad commit

# Exit bisect
git bisect reset
```

### Automated Bisect with Test Scripts

```bash
# Create test script returning 0 (good) or non-zero (bad)
cat > scripts/bisect-test.sh << 'EOF'
#!/bin/sh
# Test for checkout form functionality
grep -q 'paypal' pages/checkout.html
EOF
chmod +x scripts/bisect-test.sh

# Run automated bisect
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
git bisect run ./scripts/bisect-test.sh
```

### Bisect with npm/jest Tests

```bash
# Test specific unit test
git bisect run npx jest tests/cart.test.js --silent

# Test build succeeds
git bisect run npm run build

# Exit code conventions:
# 0 = good (no bug)
# 1-124, 126-127 = bad (bug present)
# 125 = skip this commit (cannot test)
```

### Skip Ranges and Custom Terms

```bash
# Skip commits that cannot be tested
git bisect skip

# Skip multiple commits
git bisect skip -- $(git rev-list HEAD~10..HEAD | head -5)

# Custom terms (for finding "new" vs "old")
git bisect start --term-new=newer --term-old=older
git bisect newer
git bisect older abc1234

# Play on your own terms
git bisect start --term-new=funny --term-bad=not-funny

# Save bisect log
git bisect log > bisect-session.txt

# Replay bisect session
git bisect replay bisect-session.txt
```

### Integration with Static HTML5 E-commerce Site

```bash
# Example: Find when cart broke
git bisect start
git bisect bad HEAD
git bisect good prod-20240101

# Create automated test
cat > test/bisect-cart.sh << 'EOF'
#!/bin/sh
# Check if cart calculates GST correctly
grep -q '10%' partials/cart-total.txt
EOF

git bisect run test/bisect-cart.sh
```

---

## 6. Git Blame

### What It Does and Why It Matters

Git Blame shows which commit last modified each line of a file. It is essential for understanding code ownership, finding responsibility for bugs, and tracing when specific changes were introduced.

### Practical Commands

```bash
# Basic blame
git blame pages/checkout.html

# Ignore whitespace changes
git blame -w pages/checkout.html

# Show email instead of name
git blame -e pages/checkout.html

# Suppress author/timestamp
git blame -s pages/checkout.html

# Show line numbers
git blame -n pages/checkout.html

# Blame specific line range
git blame -L 10,20 pages/checkout.html

# Follow file renames
git blame --follow pages/checkout.html

# Blame with porcelain output (machine-readable)
git blame --porcelain pages/checkout.html

# Show commits touching specific function
git blame -L '/function calculateTotal/'
```

### Ignoring Revisions (Semantic Blame)

```bash
# Ignore a formatting-only commit
git blame --ignore-rev abc1234

# Ignore multiple commits
git blame --ignore-rev abc1234 --ignore-rev def5678

# Use ignore-revs-file for teams
echo "abc1234" > .git-blame-ignore-revs
echo "# Format-only commits" >> .git-blame-ignore-revs
git config blame.ignoreRevsFile .git-blame-ignore-revs

# Show ignored lines with marker
git config blame.markIgnoredLines true
git config blame.markUnblamableLines true
```

### Integration with Static HTML5 E-commerce Site

```bash
# Create alias for blame with whitespace ignored
git config alias.shame "blame -w -M"

# Find who changed the CSS
git shame assets/css/style.css

# Track down checkout form changes
git blame -w -L '/<form/,/<\/form>/' pages/checkout.html

# Audit file for security issues
git blame pages/ | grep -i "eval\|innerHTML\|document.write"
```

---

## 7. Git Stash

### What It Does and Why It Matters

Git Stash temporarily shelves changes so you can switch contexts without committing incomplete work. Stashes are stored as commits with special references, accessible via `refs/stash` and its reflog.

### Stash Commands

```bash
# Basic stash
git stash
git stash push

# Stash with message (recommended)
git stash push -m "WIP: checkout flow incomplete"

# Stash including untracked files
git stash -u
git stash push --include-untracked -m "with new files"

# Stash including ignored files
git stash -a
git stash push --all -m "including generated files"

# Keep staged changes, stash only unstaged
git stash push --keep-index -m "keep staged, stash rest"

# Stash specific files
git stash push -m "styles only" assets/css/

# Interactive stash by hunk
git stash push -p -m "partial changes"
```

### Working with Stashes

```bash
# List stashes
git stash list
git stash list --date=relative

# Show stash contents
git stash show
git stash show -p stash@{0}

# Show untracked files in stash
git stash show --include-untracked
git stash show --only-untracked

# Apply stash (keep in list)
git stash apply
git stash apply stash@{2}

# Apply and remove from list
git stash pop
git stash pop stash@{0}

# Create branch from stash
git stash branch new-feature stash@{0}

# Drop (delete) stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

### Stash Recovery

```bash
# Recover dropped stash (via reflog)
git reflog refs/stash
git stash apply abc1234

# Or recreate branch from stash commit
git branch recovered-work <stash-commit-hash>
```

### Stash Naming Conventions (for Project)

```bash
# Convention: [TYPE]: [BRANCH] - [DESCRIPTION]
git stash push -m "WIP: feature/auth - Adding JWT validation"
git stash push -m "EXPERIMENT: main - Testing new build config"
git stash push -m "BACKUP: release - Before risky merge"
```

### Integration with Static HTML5 E-commerce Site

The project already uses stash in the AGENTS.md workflow:
```bash
# Before switching for urgent work
git stash push -u -m "WIP: $(git branch --show) - $(date)"
git stash list
```

---

## 8. Git Grep/Log/Show

### What It Does and Why It Matters

These inspection commands provide powerful ways to search and analyze repository history, file contents, and commit details.

### Git Grep

```bash
# Search working tree
git grep "function calculateTotal"

# Search specific commit/branch
git grep "paypal" v1.0.0

# Search all branches and commits
git grep "deprecated" $(git rev-list --all)

# Case-insensitive
git grep -i "checkout"

# Show line numbers
git grep -n "PayPal"

# Search only tracked files
git grep --cached "API_KEY"

# Extended regex
git grep -E "(paypal|stripe)"

# Count matches
git grep -c "checkout"

# Only filenames
git grep -l "TODO"
```

### Git Log

```bash
# Basic log
git log
git log --oneline

# Formatting
git log --format="%h %ad %an: %s" --date=short
git log --format="%H%n%an%n%ae%n%s" > commits.txt

# Filter by author
git log --author="developer@example.com"
git log --author="Name"

# Filter by message
git log --grep="fix"
git log --grep="fix\|bug" --regexp-ignore-case

# Filter by date
git log --since="2024-01-01"
git log --after="2 weeks ago"
git log --before="2024-01-01"

# Filter by file
git log -- data/categories.txt
git log --since="2024-01-01" -- pages/

# Follow file through renames
git log --follow -- pages/about.html

# Show commits that added/removed string (Pickaxe)
git log -S "functionName"
git log -S "API_KEY" --all

# Regex in diffs
git log -G "paypal.*callback"

# Range (commits in feature but not main)
git log main..feature

# Commits not yet merged
git log --nomerged main
git log --merged main

# Graph visualization
git log --oneline --graph --all
git log --oneline --graph --all --decorate

# Exclude patterns
git log -- . ':!node_modules/'

# Commits touching specific lines
git log -L 10,20:pages/checkout.html
```

### Git Show

```bash
# Show commit details
git show abc1234
git show HEAD

# Show only stat
git show --stat abc1234

# Show patch
git show -p abc1234

# Show tag
git show v1.0.0

# Show blob (file at specific commit)
git show abc1234:pages/checkout.html > old-checkout.html

# Show tree
git show --name-only abc1234

# Format for automation
git show --format="%H%n%an%n%ae%n%s" --quiet
```

### Integration with Static HTML5 E-commerce Site

```bash
# Audit for deprecated code
git grep -n "eval\|innerHTML" -- '*.js' ':!node_modules/'

# Find all commits touching CSS
git log --oneline -- assets/css/

# Generate change report for deploy
git log --since="$(git log -1 --format="%ad" --date=short origin/main)" \
       --until="$(git log -1 --format="%ad" --date=short)" \
       --oneline origin/main..HEAD

# Search for security issues
git grep -n "password\|secret\|api.?key" ':!*.json' ':!.env*'
```

---

## 9. Git Bundle

### What It Does and Why It Matters

Git Bundle packages repository content (commits, branches, tags) into a single file. This enables offline repository transfer via USB, email, or any transport without network access. Bundles are useful for sharing work in restricted environments, creating backups, and transferring between air-gapped systems.

### Creating Bundles

```bash
# Bundle entire repository
git bundle create repo.bundle --all

# Bundle specific branch
git bundle create main-branch.bundle main

# Bundle last N commits
git bundle create recent.bundle HEAD~10..HEAD

# Bundle with tag range
git bundle create release.bundle v1.0..v2.0

# Incremental backup
git bundle create backup.bundle --since="7 days ago" --all

# Verify bundle before transfer
git bundle verify repo.bundle

# List bundle contents
git bundle list-heads repo.bundle
```

### Using Bundles

```bash
# Clone from bundle
git clone repo.bundle -b main my-project

# Fetch from bundle
git remote add bundle /path/to/repo.bundle
git fetch bundle

# Pull from bundle
git pull /path/to/repo.bundle main

# Push updates back (create new bundle)
git bundle create updates.bundle ^original.bundle main..HEAD
```

### Integration with Static HTML5 E-commerce Site

```bash
# Backup before major changes
git bundle create pre-refactor-$(date +%Y%m%d).bundle --all

# Share work for review without pushing
git bundle create review-$(date +%Y%m%d).bundle \
       origin/main..HEAD \
       --tag

# Transfer via USB for offline deployment
git bundle create site-transfer.bundle main

# Create transportable deployment package
git bundle create deploy-$(date +%Y%m%d).bundle \
       $(git tag -l 'prod-*') \
       main
```

---

## 10. Git Archive

### What It Does and Why It Matters

Git Archive creates tar or zip archives of repository content, optionally excluding files via .gitattributes `export-ignore`. Unlike bundles, archives contain only files (no Git history) and are suitable for releases and distributions.

### Creating Archives

```bash
# Create tar.gz archive
git archive --format=tar.gz -o site.tar.gz HEAD

# Create zip archive
git archive --format=zip -o site.zip HEAD

# Archive specific directory
git archive --format=zip -o pages.zip HEAD:pages

# Archive at specific commit/tag
git archive --format=zip -o v1.0.0.zip v1.0.0

# Archive with prefix (unpacks into directory)
git archive --prefix=project/ -o site.tar.gz HEAD

# Exclude files marked export-ignore
git archive --remote=origin HEAD | tar -xf -

# Custom compression level
git archive --format=tar.gz -9 -o site.tar.gz HEAD
```

### Integration with Static HTML5 E-commerce Site

```bash
# Create release archive
VERSION=$(git describe --tags)
git archive --format=zip -o "naturesi-${VERSION}.zip" HEAD

# Create production deployment package
git archive --format=tar.gz \
       --prefix="naturesi-prod/" \
       -o "deploy-$(date +%Y%m%d).tar.gz" \
       origin/production

# Exclude development files (via .gitattributes)
# Add to .gitattributes:
# .github/ export-ignore
# test/ export-ignore
# docs/ export-ignore
# scripts/awk/ export-ignore

# Archive without Git data (clean release)
git archive --format=tar -o - HEAD | tar -xf -
```

---

## 11. Git Rerere

### What It Does and Why It Matters

Rerere (Reuse Recorded Resolution) records how you resolved merge conflicts and automatically reapplies those resolutions when the same conflict pattern appears again. It is particularly useful for long-lived feature branches that periodically merge from main.

### Enabling and Using Rerere

```bash
# Enable globally (recommended)
git config --global rerere.enabled true

# Enable per repository
git config rerere.enabled true

# After resolving conflicts manually
git add pages/checkout.html
git commit

# Rerere records the resolution

# Next time the same conflict occurs
git merge origin/main
# Git automatically resolves using previous resolution

# View recorded resolutions
git rerere status

# Show what rerere would change
git rerere diff

# Clear specific recorded resolution
git rerere forget pages/checkout.html

# Garbage collection for old resolutions
git rerere gc
```

### Rerere Workflow for Long Branches

```bash
# Day 1: Merge main into feature branch
git checkout feature/checkout
git merge main
# Resolve checkout.html conflict
# Rerere records: "Use incoming change to PayPal section"
git commit

# Day 5: Merge main again
git merge main
# Same conflict in checkout.html
# Rerere automatically applies previous resolution!
git add .
git commit

# Day 10: Merge main again
git merge main
# Conflict already auto-resolved
```

### Integration with Static HTML5 E-commerce Site

For teams working on multiple features that periodically merge:

```bash
# Enable rerere for the project
git config rerere.enabled true

# Rerere helps when:
# - feature/auth periodically merges from main
# - feature/payment periodically merges from main
# - hotfix branches merge into both main and develop
```

---

## 12. Git Submodules/Subtrees

### What It Does and Why It Matters

Submodules and subtrees handle nested repositories - embedding one Git repository within another. They address the question: "How do I include external code in my project while keeping it separately versioned?"

### Submodules

```bash
# Add submodule
git submodule add https://github.com/user/library.git assets/library

# Clone repository with submodules
git clone --recurse-submodules URL

# Update submodules
git submodule update --remote

# Pull all submodules
git submodule update --init --recursive

# Work on submodule
cd assets/library
git checkout feature-branch
cd ../..
git add assets/library
git commit -m "Update library to feature-branch"

# Status of submodules
git submodule status

# Sync submodule URL changes
git submodule sync

# Remove submodule
git submodule deinit assets/library
git rm assets/library
rm -rf .git/modules/assets/library
```

### Subtrees

```bash
# Add subtree (no separate cloning)
git subtree add --prefix=assets/library \
    https://github.com/user/library.git main \
    --squash

# Pull updates from subtree
git subtree pull --prefix=assets/library \
    https://github.com/user/library.git main \
    --squash

# Push changes to subtree repo
git subtree push --prefix=assets/library \
    https://github.com/user/library.git main
```

### When to Use (and Alternatives)

| Scenario | Recommendation |
|----------|---------------|
| Vendor dependency (rarely changes) | Subtree |
| Active library with contributing back | Subtree |
| Versioned dependency (composer/npm adequate) | Use package manager |
| Shared component across projects | Submodule |
| Single source of truth | Subtree |
| Theme/plugin maintained separately | Submodule |

### Integration with Static HTML5 E-commerce Site

For the project static HTML5 approach:

```bash
# Generally NOT recommended - use package managers instead
# - npm for JavaScript libraries
# - Simple file copies for small CSS/JS snippets

# If needed for shared assets:
git submodule add --prefix=assets/shared \
    git@github.com:org/shared-assets.git main
```

---

## 13. Git Credential Helpers

### What It Does and Why It Matters

Credential helpers store authentication information so you do not need to repeatedly enter passwords for Git operations. They integrate with OS keychains for secure storage and support FTP, Git, and other protocols.

### Available Helpers by Platform

| Platform | Helper | Security |
|----------|--------|----------|
| macOS | `osxkeychain` | High (Keychain) |
| Windows | `manager-core` | High (Credential Manager) |
| Linux | `libsecret` | High (Secret Service) |
| All | `cache` | Medium (memory only) |
| All | `store` | Low (plaintext file) |
| All | `gopass`, `1password`, etc. | Varies |

### Configuration

```bash
# macOS
git config --global credential.helper osxkeychain

# Windows
git config --global credential.helper manager-core

# Linux (GNOME Keyring)
git config --global credential.helper libsecret

# Temporary cache (15 minutes default)
git config --global credential.helper cache
git config --global credential.helper cache --timeout=3600

# Store in file (NOT recommended)
git config --global credential.helper store

# Per-host configuration
git config --global credential.https://github.com.helper osxkeychain
git config --global credential.https://ftp.example.com.helper store
```

### Integration with Static HTML5 E-commerce Site

For FTP deployment (as documented in AGENTS.md):

```bash
# FTP credentials (already in .env - not committed)
# Use curl with credentials for FTP deployment
# NOT: Store in Git credential helper

# Better: Use SSH keys for Git operations
git config --global core.sshCommand "ssh -i ~/.ssh/naturesi-key"

# Or use GitHub CLI which handles tokens
gh auth login
```

---

## 14. Git Hooks

### What It Does and Why It Matters

Git Hooks are scripts that execute automatically at specific points in the Git workflow. They enable enforcement of policies, automation of tasks, and integration with external tools. The project already has hooks in `hooks/` directory.

### All Git Hooks

#### Client-Side Hooks

| Hook | Trigger | Can Abort? | Use Case |
|------|---------|------------|----------|
| `pre-commit` | Before commit message | Yes | Linting, tests |
| `prepare-commit-msg` | Before editor opens | Yes | Auto-populate message |
| `commit-msg` | After message written | Yes | Validate format |
| `post-commit` | After commit completes | No | Notifications |
| `pre-push` | Before push | Yes | Full tests |
| `pre-rebase` | Before rebase | Yes | Protect branches |
| `post-checkout` | After checkout/switch | No | Setup tasks |
| `post-merge` | After merge | No | Restore files |
| `post-rewrite` | After amend/rebase | No | Auditing |

#### Server-Side Hooks

| Hook | Trigger | Use Case |
|------|---------|----------|
| `pre-receive` | Before refs updated | Enforce policy |
| `update` | Per ref being updated | Per-branch checks |
| `post-receive` | After push completes | Deployments |

### Project Existing Hooks

```bash
# View existing hooks
ls -la hooks/

# pre-commit: Runs before commits
# commit-msg: Validates commit messages
# post-commit: Runs after commits
# pre-push: Runs before pushes
# pre-merge: Runs before merges
# post-push: Runs after pushes
```

### Example Hook: Lint Before Commit

```bash
#!/bin/sh
# hooks/pre-commit - Lint all staged files

echo "Running pre-commit checks..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Run HTML lint on staged HTML files
for file in $STAGED_FILES; do
    case "$file" in
        *.html)
            ./scripts/lint-html.sh "$file" || exit 1
            ;;
        *.css)
            ./scripts/lint-css.sh "$file" || exit 1
            ;;
        *.js)
            ./scripts/lint-js.sh "$file" || exit 1
            ;;
    esac
done

echo "Pre-commit checks passed"
exit 0
```

### Example Hook: Deployment Tracking

```bash
#!/bin/sh
# hooks/post-push - Track deployments

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
COMMIT=$(git rev-parse --short HEAD)
DEPLOY_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOYER=$(whoami)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "production" ]; then
    echo "Production deployment detected"
    echo "$DEPLOY_TIME $COMMIT $DEPLOYER $BRANCH" >> .deploy-log
    git add .deploy-log 2>/dev/null || true
fi
```

### Passing Data Between Hooks

```bash
# Use temporary files
echo "$COMMIT" > .hook-data/commit
git add .hook-data/commit 2>/dev/null || true

# Use environment variables
export DEPLOY_COMMIT="$COMMIT"
export DEPLOY_BRANCH="$BRANCH"

# Use notes
git notes --ref=deployments add -m "Deployed by $DEPLOYER" "$COMMIT"
```

### Hook Debugging

```bash
# Debug with tracing
bash -x hooks/pre-commit

# Echo debug info
echo "DEBUG: STAGED_FILES=$STAGED_FILES"

# Skip hooks temporarily
git commit --no-verify -m "Emergency fix"

# List all hooks
git hooks list --all

# Test hook manually
./hooks/pre-commit
echo $?  # Exit code
```

### Sharing Hooks with Team

```bash
# Use core.hooksPath (Git 2.9+)
git config core.hooksPath hooks

# Or use pre-commit framework
npm install --save-dev pre-commit
# Add to package.json
```

---

## 15. Git Replace

### What It Does and Why It Matters

Git Replace allows "pretending" one object is another without rewriting history. It creates refs in `refs/replace/` that redirect lookups. This is useful for grafting histories, correcting mistakes without affecting others, and temporary substitutions.

### Why It Matters

- Fork reconciliation without rewriting
- Historical corrections without rebasing
- Linking separate repositories
- Temporary substitutions for testing

### Practical Commands

```bash
# Replace one commit with another
git replace abc1234 def5678

# List all replace refs
git replace --list

# Edit replacement object interactively
git replace --edit abc1234

# Delete replacement
git replace -d abc1234

# Force overwrite existing
git replace -f abc1234 def5678

# Graft (change parentage)
git replace --graft abc1234 parent1 parent2

# View replacement in action
git cat-file commit abc1234  # Shows replacement content

# View original (no replacement)
git --no-replace-objects cat-file commit abc1234

# Push replacements to remote
git push origin 'refs/replace/*:refs/replace/*'

# Fetch replacements from remote
git fetch origin 'refs/replace/*:refs/replace/*'
```

### Use Cases

```bash
# Fix typo in old commit message (without history rewrite)
git replace --edit abc1234
# Edit message in editor

# Combine fork histories
git replace --graft <first-commit-of-fork> <merge-base>

# Temporarily test with different commit
git replace abc1234 experimental-version

# After testing, remove replacement
git replace -d abc1234
```

### Integration with Static HTML5 E-commerce Site

```bash
# Generally NOT recommended for shared repositories
# Replace refs do not transfer with normal clone

# May be useful for:
# - Local testing with different versions
# - Temporary patches without commit
```

---

## 16. Git Filter-repo

### What It Does and Why It Matters

Git Filter-repo (the recommended replacement for filter-branch) rewrites repository history safely. It is designed for removing sensitive data, restructuring directories, and converting repositories. Unlike filter-branch, it is fast and handles edge cases properly.

### Installation

```bash
# Via pip
pip install git-filter-repo

# Or use package manager
brew install git-filter-repo
```

### Common Use Cases

```bash
# Remove file from entire history
git filter-repo --path path/to/file --invert-paths

# Remove large files
git filter-repo --strip-blobs-bigger-than 100M

# Replace sensitive strings
echo 'password==>REMOVED' > replacements.txt
echo 'api_key==>REMOVED' >> replacements.txt
git filter-repo --replace-text replacements.txt

# Restructure directories
git filter-repo --path-rename old/:new/

# Extract subdirectory as new repo
git filter-repo --path src/components --subdirectory-filter components

# Change author/committer
git filter-repo --mailmap .mailmap

# Convert to Git LFS
git filter-repo --to-lfs '*.png'
```

### Complete Secret Removal Workflow

```bash
# 1. Clone fresh (mirror)
git clone --mirror https://github.com/org/repo.git
cd repo.git

# 2. Create replacement file
echo 'actual_password==>REDACTED' > replacements.txt
echo 'secret_token==>REDACTED' >> replacements.txt

# 3. Run filter-repo
git filter-repo --replace-text replacements.txt

# 4. Verify no secrets remain
git grep -i "password\|token\|secret" || echo "Clean!"

# 5. Force push
git push --force --all
git push --force --tags

# 6. Team: re-clone
# Everyone must re-clone, not pull
```

### Integration with Static HTML5 E-commerce Site

```bash
# Clean accidental commits
git filter-repo --path .env --invert-paths

# If credentials were ever committed:
git filter-repo --replace-text <(echo 'FTP_PASS=.*==>FTP_PASS=REMOVED')
```

---

## 17. Git Debug

### What It Does and Why It Matters

Git provides extensive debug logging via environment variables. These trace internal operations, performance, network activity, and more - essential for diagnosing problems.

### Trace Variables

```bash
# General traces
GIT_TRACE=1                    # Basic traces
GIT_TRACE=2                    # More verbose
GIT_TRACE=/path/to/log        # Log to file

# Setup and discovery
GIT_TRACE_SETUP=1             # Repository setup

# Performance
GIT_TRACE_PERFORMANCE=1       # Timing data

# Network operations
GIT_TRACE_CURL=1              # HTTP requests (like curl -v)

# Pack file operations
GIT_TRACE_PACK_ACCESS=1       # Pack file reads
GIT_TRACE_PACKET=1            # Protocol packets

# Authentication
GIT_TRACE_SSH=1              # SSH connection details

# Merge operations
GIT_MERGE_VERBOSITY=5       # Merge debugging (0-5)
```

### Trace2 (Modern API)

```bash
# Normal format (replaces GIT_TRACE)
GIT_TRACE2=~/log.normal

# Performance format
GIT_TRACE2_PERF=~/log.perf

# Event format (JSON)
GIT_TRACE2_EVENT=~/log.event

# Brief output
GIT_TRACE2_BRIEF=1
```

### Example Debug Sessions

```bash
# Debug push failure
GIT_TRACE=1 GIT_CURL_VERBOSE=1 git push origin main

# Debug clone issues
GIT_TRACE=1 GIT_TRACE_PACKET=1 git clone URL

# Debug garbage collection
GIT_TRACE_PERFORMANCE=$PWD/gc.log git gc --aggressive

# Debug SSH authentication
GIT_SSH_COMMAND="ssh -vvv" git fetch
```

### Integration with Static HTML5 E-commerce Site

```bash
# Debug FTP deployment issues
GIT_TRACE=1 ./scripts/deploy-ftp.sh --dry-run

# Debug Apache serving
GIT_TRACE=1 scripts/serve.sh start

# Debug validation scripts
GIT_TRACE=1 scripts/lint-html.sh pages/index.html
```

---

## 18. Git Maintenance

### What It Does and Why It Matters

Git maintenance runs housekeeping tasks: garbage collection, repacking, pruning, and optimization. Regular maintenance keeps repositories fast and prevents bloat.

### Manual Maintenance

```bash
# Garbage collection (cleanup + repack)
git gc

# Aggressive optimization (takes longer, saves space)
git gc --aggressive

# Immediate pruning
git gc --prune=now

# Keep largest pack, clean others
git gc --keep-largest-pack

# Auto mode (runs if thresholds met)
git gc --auto
```

### Git Maintenance (Modern Command)

```bash
# Run all maintenance tasks
git maintenance run

# Run specific tasks
git maintenance run --task=gc
git maintenance run --task=commit-graph
git maintenance run --task=loose-objects
git maintenance run --task=incremental-repack

# Run with schedule
git maintenance run --schedule=hourly
git maintenance run --schedule=daily
git maintenance run --schedule=weekly

# Auto (based on thresholds)
git maintenance run --auto

# Register repository for background maintenance
git maintenance register

# Start background scheduler
git maintenance start

# Stop background scheduler
git maintenance stop

# Check current schedule
git maintenance schedule
```

### Repository Integrity

```bash
# Check repository integrity
git fsck
git fsck --full

# Find dangling commits
git fsck --lost-found

# Find unreachable objects
git fsck --unreachable

# Verbose output
git fsck --verbose

# Check only connectivity
git fsck --connectivity-only
```

### Configuration Options

```bash
# Auto gc thresholds
git config gc.auto 6700        # Loose objects threshold
git config gc.autoPackLimit 100 # Pack files threshold

# Pruning
git config gc.pruneExpire "2 weeks"
git config gc.reflogExpire "90 days"
git config gc.reflogExpireUnreachable "30 days"

# Worktree pruning
git config gc.worktreePruneExpire "3 months"
```

### Integration with Static HTML5 E-commerce Site

```bash
# Weekly maintenance script
#!/bin/sh
echo "Running repository maintenance..."
git fsck --full
git maintenance run --task=gc
git maintenance run --task=commit-graph
git maintenance run --task=loose-objects
git remote prune origin
git worktree prune
echo "Maintenance complete"

# Monthly deep clean
git maintenance run --task=incremental-repack
```

---

## 19. Gitattributes

### What It Does and Why It Matters

The `.gitattributes` file defines path-based rules that control how Git handles files. It affects line endings, diff generation, merge strategies, archive exports, and more. The project already has a comprehensive `.gitattributes` file.

### Key Attributes

```bash
# Text/binary handling
*.png binary
*.jpg binary

# Line endings
* text=auto
*.sh text eol=lf
*.bat text eol=crlf

# Diff drivers
*.md diff=markdown
*.css diff=css
*.json diff=ruby

# Merge strategies
*.lock merge=ours
package-lock.json merge=ours

# Archive export
README.md export-ignore
.github/ export-ignore

# Filter (clean/smudge)
*.psd filter=lfs diff=lfs merge=lfs -text
```

### Project Existing .gitattributes

The project includes:
- Auto text detection with LF normalization
- Language-specific diff drivers
- Binary marking for images/fonts/media
- Line ending enforcement for scripts and configs

### Common Patterns

```bash
# Prevent merge conflicts in lock files
*.lock merge=ours
package-lock.json merge=ours
pnpm-lock.yaml merge=ours

# Language-aware diffs
*.go diff=golang
*.sql diff=sql

# Disable diff for generated files
*.min.js -diff
*.map -diff

# Exclude from archives
.gitignore export-ignore
.env export-ignore
*.log export-ignore

# Custom merge driver
*.sql merge=union
```

### Integration with Static HTML5 E-commerce Site

The project `.gitattributes` already handles:
- HTML/CSS/JS line endings
- Binary files (images, fonts)
- Diff drivers for various languages

Additional rules for e-commerce:

```bash
# In .gitattributes
# Generated files
*.generated merge=ours
build/ export-ignore

# Env files
.env export-ignore
.env.production export-ignore
```

---

## 20. GitMailmap/.mailmap

### What It Does and Why It Matters

The `.mailmap` file maps author names and emails to canonical identities. It consolidates fragmented contributor stats when people use different emails/machines and provides clean attribution in `git shortlog` and similar commands.

### Syntax

```bash
# Simple: canonical name and email
Proper Name <proper@email.xx>

# Email only (keeps existing name)
<proper@email.xx> <commit@email.xx>

# Full: replace both name and email
Proper Name <proper@email.xx> <commit@email.xx>

# Comments and blank lines allowed
# Jane various emails
Jane Doe <jane@work.com>
Jane Doe <jane@home.com>
Jane Doe <jane@personal.com>
```

### Practical Usage

```bash
# View canonical name
git check-mailmap "Jane Doe <jane@work.com>"

# Show contributors with mailmap applied
git shortlog --sn

# Show log with mailmap
git log --use-mailmap

# Export contributor list
git shortlog --sn --use-mailmap > contributors.txt

# Check mailmap entries
git log --format="%aN <%aE>" | sort -u | while read name email; do
    git check-mailmap "$name <$email>"
done
```

### Example .mailmap for Project

```bash
# .mailmap
# Developer with multiple emails
Developer Name <dev@company.com>
Developer Name <personal@email.com>

# Consultant with different email
Client Name <client@external.com>

# Normalize former team member
Current Name <current@company.com> <former@oldcompany.com>
```

### Integration with Static HTML5 E-commerce Site

```bash
# If project has multiple contributors with varying emails:

# .mailmap
Jane Developer <jane@company.com>
Jane Developer <jane.developer@personal.net>

# Then contributor stats consolidate:
git shortlog --sn --use-mailmap
```

---

## Summary and Recommendations

### Core Techniques for Project

Based on the project needs (static HTML5 e-commerce site with FTP deployment), the most relevant advanced techniques are:

1. **Git Tags** - Release marking, deployment versioning
2. **Git Worktrees** - Parallel feature development (already documented)
3. **Git Hooks** - Pre-commit linting, deployment tracking (already in place)
4. **Gitattributes** - Line ending control (already comprehensive)
5. **Git Notes** - Deployment audit trail
6. **Git Reflog** - Recovery and audit
7. **Git Archive** - Clean release packaging
8. **Git Bundle** - Offline transfer for deployment
9. **Git Maintenance** - Repository health

### Techniques to Enable

```bash
# Enable rerere
git config --global rerere.enabled true

# Extend reflog for safety
git config gc.reflogExpire "180 days"

# Configure maintenance
git maintenance register
git maintenance start
```

### Techniques for Advanced Use

- **Git Bisect** - When bugs need to be traced
- **Git Filter-repo** - If sensitive data needs removal
- **Git Blame** - Code ownership investigation
- **Git Stash** - Context switching (already documented)
- **Git Bundle** - Offline deployment workflows

### Techniques to Use Cautiously

- **Git Replace** - Local only, does not transfer
- **Git Submodules** - Overcomplicated for static site
- **Git Filter-repo** - History rewriting, team coordination needed

---

## References

- [Git Official Documentation](https://git-scm.com/docs)
- [Pro Git Book](https://git-scm.com/book)
- [Git Filter-repo](https://github.com/newren/git-filter-repo)
- [Project AGENTS.md](AGENTS.md)
- [Project hooks/](hooks/)
- [Project .gitattributes](.gitattributes)

---

*Research compiled: April 2026*
