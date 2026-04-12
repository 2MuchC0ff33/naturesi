# .opencode/README.md

Project-local OpenCode skills, commands, and infra agent structures.

## Audit/Validation Infra (via Makefile)

- Use the Makefile for all reproducible audit, lint, and validation flows:
  - `make sccs-init` — Initialize SCCS for all repo files (place SCCS histories in SCCS/)
  - `make checksums` — Regenerate `.checksums/checksums.txt` with current repo content hashes
  - `make patches` — Generate `.patches/patches.txt` with current diffs since HEAD
  - `make validate-audit` — Run SCCS/checksums/patch updates in sequence
  - `make lint`/`make test`/`make validate` — Full lint+test+audit

See also `.opencode/skills/README.md` for agent-operable POSIX skill commands.

**Update this file with every infra, skill, or workflow change.**
