# .opencode/skills/README.md

## POSIX Audit and Validation Skills

Agents and humans must invoke these audit/validation workflows via Makefile targets (POSIX-only):

- `make sccs-init` → Version every tracked file with SCCS.
- `make checksums` → Refresh all-file CRC32 checksums into `.checksums/checksums.txt`.
- `make patches` → Capture diffs in `.patches/patches.txt`, for canonical audit/review.
- `make validate-audit` → Full audit trail refresh (sccs, checksums, patches).
- `make lint`, `make test`, `make validate` → Full lint/test/audit run.

**Agents must update `.checksums/`, `.patches/`, and SCCS/ whenever a substantive change occurs.**

Document every new infra/skill/command here.
