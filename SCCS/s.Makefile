h65135
s 00048/00000/00000
d D 1.1 26/04/12 15:42:38 twomuchcoffee 1 0
c date and time created 26/04/12 15:42:38 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#
# POSIX Makefile — Audit, Lint, Test, and Validation for Static Site
# ---------------------------------------------------------------

# SCCS, Checksums, Patches, Validation (POSIX-only, no Bashisms)
# .checksums/ and .patches/ must pre-exist

.PHONY: all sccs-init checksums patches validate-audit lint test

all: validate-audit

sccs-init:
	@echo "[SCCS] Initializing SCCS (creates s.* files for all tracked content)"
	@mkdir -p SCCS
	@git ls-files | while read f; do \
	  if [ -f "$$f" ]; then sccs admin -n -i"$$f" SCCS/s.$$f 2>/dev/null || true; fi; \
	done

checksums:
	@echo "[CKSUM] Generating .checksums/checksums.txt manifest for all files"
	@mkdir -p .checksums
	@git ls-files | xargs cksum > .checksums/checksums.txt

patches:
	@echo "[PATCHES] Generating .patches/patches.txt (aggregate diff)"
	@mkdir -p .patches
	@git diff HEAD > .patches/patches.txt

validate-audit: sccs-init checksums patches
	@echo "[VALIDATE] Audit trails (SCCS, checksums, patches) refreshed"

lint:
	@echo "[LINT] Running all linters"
	@./scripts/lint-shellcheck.sh && ./scripts/lint-shell.sh && ./scripts/lint-css.sh && ./scripts/lint-html.sh && ./scripts/lint-json.sh

test:
	@echo "[TEST] Running all tests"
	@./scripts/test-all.sh

validate: validate-audit lint test
	@echo "[BUILD] Validation complete"

.PHONY: zero-drift
zero-drift:
	@echo "[ZERO-DRIFT] Running full zero-drift validation (dry-run)"
	@./scripts/zero-drift-check.sh --dry-run

# End of Makefile
E 1
