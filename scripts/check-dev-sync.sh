#!/bin/sh
# scripts/check-dev-sync.sh — Monitor development branch for changes
# Purpose: Track developer activity and uncommitted changes
# Usage: scripts/check-dev-sync.sh [--verbose] [--output FILE]

set -e

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
BASE_DIR="$(dirname -- "$SCRIPT_DIR")"

VERBOSE=false
OUTPUT_FILE=""

usage() {
    printf 'usage: %s [--verbose] [--output FILE]\n' "$0"
    printf '  --verbose  Show detailed git status\n'
    printf '  --output    Write report to FILE\n'
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        --verbose) VERBOSE=true; shift ;;
        --output) OUTPUT_FILE="$2"; shift 2 ;;
        *) usage ;;
    esac
done

cd "$BASE_DIR"

# Output function
output() {
    if [ -n "$OUTPUT_FILE" ]; then
        printf '%s\n' "$1" >> "$OUTPUT_FILE"
    fi
    printf '%s\n' "$1"
}

# Header
output "=============================================="
output "DEVELOPMENT SYNC REPORT"
output "=============================================="
output "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
output "Branch: $(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --short HEAD)"
output "Commit: $(git rev-parse --short HEAD)"
output ""

# Check current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")
output "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "detached" ]; then
    output "⚠ WARNING: HEAD is detached! Work may be lost."
    output ""
elif [ "$CURRENT_BRANCH" != "development" ]; then
    output "⚠ WARNING: Not on development branch!"
    output "   Current: $CURRENT_BRANCH"
    output "   Expected: development"
    output ""
fi

# Check for uncommitted changes
output "Checking for uncommitted changes..."
output ""

UNCOMMITTED=$(git status --porcelain)

if [ -z "$UNCOMMITTED" ]; then
    output "✓ No uncommitted changes"
else
    output "⚠ UNCOMMITTED CHANGES FOUND:"
    output ""
    if [ "$VERBOSE" = "true" ]; then
        printf '%s\n' "$UNCOMMITTED" | while IFS= read -r LINE; do
            STATUS=$(printf '%s' "$LINE" | cut -c1-2)
            FILE=$(printf '%s' "$LINE" | cut -c4-)
            case "$STATUS" in
                " M") output "  Modified:  $FILE" ;;
                "??") output "  Untracked: $FILE" ;;
                " D") output "  Deleted:   $FILE" ;;
                "A ") output "  Added:     $FILE" ;;
                "M ") output "  Staged:    $FILE" ;;
                *) output "  $STATUS $FILE" ;;
            esac
        done
    else
        COUNT=$(printf '%s\n' "$UNCOMMITTED" | wc -l | tr -d ' ')
        output "  $COUNT files changed"
        output "  Run with --verbose for details"
    fi
    output ""
    output "⚠ WARNING: These changes are NOT in git history!"
    output "   To save your work:"
    output "     git add <files>"
    output "     git commit -m 'description'"
    output "     git push origin $CURRENT_BRANCH"
    output ""
fi

# Check if development branch is ahead of remote
output "Checking remote sync..."
output ""

LOCAL_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo 0)
REMOTE_COMMITS=$(git rev-list --count origin/development 2>/dev/null || echo 0)

if [ "$LOCAL_COMMITS" -gt "$REMOTE_COMMITS" ]; then
    BEHIND=$((LOCAL_COMMITS - REMOTE_COMMITS))
    output "⚠ Development is $BEHIND commits ahead of origin"
    output "   To push: git push origin development"
elif [ "$LOCAL_COMMITS" -lt "$REMOTE_COMMITS" ]; then
    AHEAD=$((REMOTE_COMMITS - LOCAL_COMMITS))
    output "⚠ Development is $AHEAD commits behind origin"
    output "   To update: git pull origin development"
else
    output "✓ Development is in sync with origin"
fi

# Recent commits
output ""
output "Recent commits on development:"
output ""
git log --oneline -5 | while IFS= read -r LINE; do
    output "  $LINE"
done

# Check for files that shouldn't be committed
output ""
output "Checking for files that should not be deployed..."

SENSITIVE_FILES=""
for FILE in .env .env.local secrets.json credentials.json; do
    if [ -f "$FILE" ] && ! git ls-files --error-unmatch "$FILE" >/dev/null 2>&1; then
        SENSITIVE_FILES="${SENSITIVE_FILES}  - $FILE (exists but not committed - good!)\n"
    fi
done

if [ -f ".env" ]; then
    if git ls-files --error-unmatch ".env" >/dev/null 2>&1; then
        output "⚠ .env is tracked by git (should be .gitignored!)"
    fi
fi

if [ -z "$SENSITIVE_FILES" ]; then
    output "✓ No sensitive files detected"
fi

# Summary
output ""
output "=============================================="
output "SUMMARY"
output "=============================================="

if [ -z "$UNCOMMITTED" ] && [ "$LOCAL_COMMITS" -eq "$REMOTE_COMMITS" ] && [ "$CURRENT_BRANCH" = "development" ]; then
    output "✓ Development branch is clean and in sync"
    output "   Ready for deployment review"
else
    output "⚠ Issues detected - review above"
fi

output ""
output "To check production diff:"
output "  ./scripts/check-production-diff.sh"
output ""

# Save to file
if [ -n "$OUTPUT_FILE" ]; then
    output ""
    output "Report saved to: $OUTPUT_FILE"
fi

exit 0
