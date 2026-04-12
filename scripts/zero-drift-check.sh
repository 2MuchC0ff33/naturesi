#!/bin/sh
# scripts/zero-drift-check.sh — Run full zero-drift validation pipeline
# Usage: scripts/zero-drift-check.sh [--dry-run]

set -eu

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

printf '[ZERO-DRIFT] Starting validation pipeline\n'

printf '[ZERO-DRIFT] 1) Audit (checksums, patches) — skipping SCCS init to avoid SCCS tool dependency\n'
printf '[ZERO-DRIFT] [CKSUM] Generating .checksums/checksums.txt manifest for all files\n'
mkdir -p .checksums
git ls-files | xargs cksum > .checksums/checksums.txt || true

printf '[ZERO-DRIFT] [PATCHES] Generating .patches/patches.txt (aggregate diff)\n'
mkdir -p .patches
git diff HEAD > .patches/patches.txt || true

printf '[ZERO-DRIFT] 2) Linting\n'
./scripts/lint-shellcheck.sh
./scripts/lint-shell.sh
./scripts/lint-css.sh
./scripts/lint-html.sh
./scripts/lint-json.sh

printf '[ZERO-DRIFT] 3) Tests\n'
./scripts/test-all.sh

printf '[ZERO-DRIFT] 4) FTP validation (dry-run recommended)\n'
if [ "$DRY_RUN" -eq 1 ]; then
  ./scripts/deploy-ftp.sh --dry-run
else
  ./scripts/deploy-ftp.sh --dry-run
  printf '[ZERO-DRIFT] NOTE: Running deploy dry-run only. To perform real deploy, run deploy-ftp.sh without --dry-run manually.\n'
fi

printf '[ZERO-DRIFT] 5) Validate FTP listing against local\n'
./scripts/validate-ftp.sh --check

printf '[ZERO-DRIFT] Completed\n'

exit 0
