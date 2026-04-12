#!/bin/sh
# scripts/promote.sh — Promote branches: development -> staging -> main
# WARNING: This script performs git operations that change branches and push.
# Use only with explicit human approval or in controlled automation.

set -eu

usage() {
  cat <<EOF
Usage: $0 [--dry-run]
  --dry-run   Print actions but do not perform branch updates or pushes
EOF
  exit 1
}

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

run() {
  printf '[PROMOTE] %s\n' "$1"
  if [ "$DRY_RUN" -eq 0 ]; then
    sh -c "$1"
  fi
}

# 1) Ensure working tree clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  printf '[PROMOTE] Working tree not clean — aborting. Commit or stash changes first.\n'
  exit 1
fi

# 2) Promote development -> staging
printf '[PROMOTE] Promote development -> staging\n'
run "git checkout staging"
run "git pull origin staging"
run "git merge --squash development"
run "git commit -m 'chore(promote): squash-merge development -> staging' || true"
run "git push origin staging"

# 3) Promote staging -> main
printf '[PROMOTE] Promote staging -> main\n'
run "git checkout main"
run "git pull origin main"
run "git merge --squash staging"
run "git commit -m 'chore(promote): squash-merge staging -> main' || true"
run "git push origin main"

printf '[PROMOTE] Promotion complete (dry-run=%d)\n' "$DRY_RUN"

exit 0
