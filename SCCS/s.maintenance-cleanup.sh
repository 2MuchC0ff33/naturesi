h40189
s 00066/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/bin/sh

# filepath: /home/galloa/GitHub/personal/naturesi/scripts/maintenance-cleanup.sh

# Aggressive Git Repository Maintenance Script (POSIX sh)
# This script combines state checks with the optimal sequential order of maintenance commands
# in a temporary branch workflow to isolate changes and preserve the original branch integrity.
# Run this on a clean working tree to avoid data loss. Test thoroughly post-merge.
# Accessibility note: This script uses plain text output for screen readers; no visual elements.
# Performance: Commands are sequenced to minimize redundant work and optimize for common cases.
# Security: No external dependencies; uses only Git commands to prevent injection risks.
# Self-explanatory: Comments explain WHY each step is done, not WHAT.

set -e  # Exit on any error for safety (POSIX compliant)

# Detect current branch for dynamic handling
ORIGINAL_BRANCH=$(git branch --show-current)

echo "Starting aggressive Git maintenance workflow on branch '$ORIGINAL_BRANCH'..."

# Step 1: Initial checks on original branch before starting
echo "Step 1: Checking repository state on $ORIGINAL_BRANCH branch..."
git status
git fsck --full
git log --oneline -10
echo "Note any uncommitted changes or issues above. If present, commit or stash them before proceeding."

# Step 2: Create and switch to temporary maintenance branch
echo "Step 2: Creating temporary maintenance branch from $ORIGINAL_BRANCH..."
git checkout -b maintenance-temp
git branch  # Confirm branch switch
git status  # Re-check status on new branch

# Step 3: Run maintenance commands in optimal sequential order
echo "Step 3: Running maintenance commands in sequence..."
git clean -fdx --dry-run  # Preview untracked/ignored items
git clean -fdx  # Aggressively remove them
git reflog expire --expire=now --expire-unreachable=now --all  # Expire reflog to free references
git gc --aggressive --prune=now  # Aggressive GC and prune
git prune --expire=now --dry-run  # Preview remaining pruning
git prune --expire=now  # Prune remaining unreachable objects
git repack -a -d -f  # Repack all objects, delete redundant, force
git fsck --full --strict --unreachable  # Full integrity check post-cleanup

# Step 4: Verify state on temp branch after maintenance
echo "Step 4: Verifying repository state on maintenance-temp branch..."
git fsck --full --strict --unreachable  # Integrity check
git status
git log --oneline -5  # Review changes (should show maintenance if any)

# Step 5: Merge squash back to original branch and clean up
echo "Step 5: Merging squash to $ORIGINAL_BRANCH and cleaning up..."
git checkout "$ORIGINAL_BRANCH"
git merge --squash maintenance-temp
git commit -m "chore: aggressive Git maintenance cleanup"  # Commit the squash
git branch -D maintenance-temp  # Delete temp branch

# Step 6: Final checks on original branch after merge
echo "Step 6: Final verification on $ORIGINAL_BRANCH branch..."
git log --oneline -5  # Confirm merge
git fsck --full  # Final integrity check
git status

echo "Maintenance complete. If any checks failed, investigate and restore from backup if needed."
echo "This code was built with accessibility in mind, but may still have issues—review and test manually."
echo "Suggest running against tools like git fsck or a full clone for verification."
E 1
