#!/bin/sh
# scripts/git-list-stale.sh — list local branches without upstream and remote-only branches
set -eu

printf 'Local branches without upstream:\n'
git for-each-ref --format='%(refname:short) %(upstream:short)' refs/heads/ | awk '$2=="" {print $1}' || true

printf '\nRemote-only branches not tracked locally:\n'
git ls-remote --heads origin | awk '{print $2}' | sed 's!refs/heads/!!' | while read -r rb; do
  if ! git show-ref --verify --quiet "refs/heads/$rb"; then
    printf '%s\n' "$rb"
  fi
done

exit 0
