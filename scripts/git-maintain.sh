#!/bin/sh
# scripts/git-maintain.sh — Run repository maintenance checks and produce report
# Usage: scripts/git-maintain.sh [--prune-remotes]

set -eu

PRUNE=0
if [ "${1:-}" = "--prune-remotes" ]; then
  PRUNE=1
fi

TS=$(date +%Y%m%d%H%M%S)
OUT=.opencode/git-maintenance-report-${TS}.txt
mkdir -p .opencode

printf 'GIT MAINTENANCE REPORT %s\n' "$TS" > "$OUT"
printf '---\n' >> "$OUT"

printf '1) git fsck --full\n' >> "$OUT"
git fsck --full 2>&1 | sed 's/^/FSCK: /' >> "$OUT" || true

printf '\n2) git reflog (last 50)\n' >> "$OUT"
git reflog -50 2>&1 | sed 's/^/REF: /' >> "$OUT" || true

printf '\n3) git branch -vv\n' >> "$OUT"
git branch -vv 2>&1 | sed 's/^/BR: /' >> "$OUT"

printf '\n4) git remote show origin\n' >> "$OUT"
git remote show origin 2>&1 | sed 's/^/RM: /' >> "$OUT" || true

printf '\n5) git worktree list\n' >> "$OUT"
git worktree list 2>&1 | sed 's/^/WT: /' >> "$OUT" || true

printf '\n6) Local branches without upstream\n' >> "$OUT"
for b in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
  upstream=$(git for-each-ref --format='%(upstream:short)' refs/heads/$b || true)
  if [ -z "$upstream" ]; then
    printf 'LOCAL_NO_UPSTREAM: %s\n' "$b" >> "$OUT"
  fi
done

printf '\n7) Remote branches not tracked locally\n' >> "$OUT"
for rb in $(git ls-remote --heads origin | awk '{print $2}' | sed 's#refs/heads/##'); do
  if ! git show-ref --verify --quiet refs/heads/$rb; then
    printf 'REMOTE_ONLY: %s\n' "$rb" >> "$OUT"
  fi
done

if [ "$PRUNE" -eq 1 ]; then
  printf '\n8) git remote prune origin\n' >> "$OUT"
  git remote prune origin 2>&1 | sed 's/^/PRUNE: /' >> "$OUT" || true
fi

printf '\nReport written to %s\n' "$OUT"
cat "$OUT"

exit 0
