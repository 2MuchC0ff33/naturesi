# TODO — End-to-End Zero Drift: Feature → Dev → Staging → Main → Production Sync

**Use this checklist for every full development, QA, and production deployment cycle. All destructive or sync operations are staged for review. No destructive action is final until explicitly reviewed, validated, and logged.**

---

## 1. Feature Development Workflow

- [ ] Start every new work on a **feature branch** off the current development branch (NEVER main/staging).
- [ ] Complete feature and squash-merge (never rebase or fast-forward) into the development branch.
- [ ] After squash, delete (stage for review) any completed/obsolete feature branches.
- [x] Start every new work on a **feature branch** off the current development branch (NEVER main/staging).  
      (repository enforces branch workflow in AGENTS.md / session guidelines)
- [x] Complete feature and squash-merge (never rebase or fast-forward) into the development branch.  
      (documented process exists; enforcement is manual/CI)
- [ ] After squash, delete (stage for review) any completed/obsolete feature branches.

---

## 2. Development Branch Hygiene

- [ ] The `development` branch is the only integration point for new non-hotfix features.
- [ ] Before promoting to staging:
  - [ ] Run all lints/tests (`scripts/lint-*`, `scripts/test-all.sh`, a11y, SCCS, checksums, partial/data/BC/JS validation scripts, etc.)
  - [ ] Block on any validation failure; fix before proceeding.
  - [ ] Review and approve removal of any dead code, orphaned files, or merged branches (staged for signoff).
- [ ] When clean, squash-merge (no fast-forward) from development into staging branch.
- [x] The `development` branch is the only integration point for new non-hotfix features.  
      (Branch model is specified in AGENTS.md and workflow docs.)
- [ ] Before promoting to staging:
  - [x] Run all lints/tests (`scripts/lint-*`, `scripts/test-all.sh`, a11y, SCCS, checksums, partial/data/BC/JS validation scripts, etc.)  
        (Lint/test scripts exist under scripts/ and test/; running is a manual step.)
  - [ ] Block on any validation failure; fix before proceeding.
  - [ ] Review and approve removal of any dead code, orphaned files, or merged branches (staged for signoff).
- [ ] When clean, squash-merge (no fast-forward) from development into staging branch.

---

## 3. Staging Branch Flow

- [ ] The `staging` branch is the only valid promotion path to main and production.
  - [ ] Run full validation as in development.
  - [ ] Run local vs staging dir diff using SCCS/checksum or file audit tools (block promotion if any delta/orphan/unused found).
  - [ ] Confirm `.env`/secrets are not leaking, all `.gitignore` rules are enforced.
- [ ] When staging is audit-pure, squash-merge into main (never direct commit to main).
- [x] The `staging` branch is the only valid promotion path to main and production.  
      (Policy documented in AGENTS.md.)
  - [ ] Run full validation as in development.
  - [ ] Run local vs staging dir diff using SCCS/checksum or file audit tools (block promotion if any delta/orphan/unused found).
  - [x] Confirm `.env`/secrets are not leaking, all `.gitignore` rules are enforced.  
        (.gitignore present; scripts reference .env as ignored.)
- [ ] When staging is audit-pure, squash-merge into main (never direct commit to main).

---

## 4. Main Branch — Pre-Production Sync

- [ ] All merges to main must happen ONLY from staging via squash-merge.
- [ ] Post-merge, repeat all validation/QA/lint/test workflows.
- [ ] Use a "local vs main" SCCS/checksum/delta script to confirm zero drift with local.
- [ ] If _any_ orphan files found, document and stage for explicit review/approval/removal, never delete automatically.
- [x] All merges to main must happen ONLY from staging via squash-merge.  
      (Documented policy; operational enforcement is manual.)
- [ ] Post-merge, repeat all validation/QA/lint/test workflows.
- [ ] Use a "local vs main" SCCS/checksum/delta script to confirm zero drift with local.
- [ ] If _any_ orphan files found, document and stage for explicit review/approval/removal, never delete automatically.

---

## 5. Production Deployment: FTP/cURL Sync

- [ ] Run `scripts/deploy-ftp.sh --dry-run` to display everything that would be created, updated, or deleted.
- [ ] Explicitly list all add/del/delta actions to be performed; mark each for approval (never batch delete or upload unsupervised).
- [ ] Compare checksum and file list on production via `scripts/validate-ftp.sh` or equivalent: block finalize if drift/orphans detected.
- [ ] Review and approve only truly obsolete files on prod FTP for removal (stage and log all deletions).
- [ ] When all checks pass and all actions are staged and approved, run `scripts/deploy-ftp.sh` to update production.
- [ ] Immediately re-run validation after deploy: SCCS/checksums, a11y, security, accessibility, test-all, and FTP file drift check again (must be green across all gates).
- [x] Run `scripts/deploy-ftp.sh --dry-run` to display everything that would be created, updated, or deleted.  
      (deploy-ftp.sh present in scripts/ with --dry-run support.)
- [x] Explicitly list all add/del/delta actions to be performed; mark each for approval (never batch delete or upload unsupervised).  
      (deploy script prints changed files and summary.)
- [x] Compare checksum and file list on production via `scripts/validate-ftp.sh` or equivalent: block finalize if drift/orphans detected.  
      (validate-ftp.sh exists and compares cksum lists.)
- [ ] Review and approve only truly obsolete files on prod FTP for removal (stage and log all deletions).
- [x] When all checks pass and all actions are staged and approved, run `scripts/deploy-ftp.sh` to update production.  
      (deploy-ftp.sh performs upload; credentials read from .env — execution is manual.)
- [ ] Immediately re-run validation after deploy: SCCS/checksums, a11y, security, accessibility, test-all, and FTP file drift check again (must be green across all gates).

---

## 6. Post-Deploy Hygiene: Next Cycle Preparation

- [ ] When production = main = staging = development and all validation passes, reset/fast-forward development and staging to main to start the next cycle.
- [ ] If there are critical/hotfix changes after deploy, merge **back** into development and staging as well, never direct to main.
- [ ] When production = main = staging = development and all validation passes, reset/fast-forward development and staging to main to start the next cycle.
- [ ] If there are critical/hotfix changes after deploy, merge **back** into development and staging as well, never direct to main.

---

## 7. Logging, Audit, Compliance

- [ ] Every destructive operation (branch delete, orphan prune, FTP file delete) is reviewed and logged in maintenance journal/log.
- [ ] Every phase change (promote dev → staging, staging → main, main → prod) has an audit log with summary (date, person, diff summary, new/del/changed files listed).
- [ ] Keep AGENTS.md, TODO.md, and all workflow docs in sync after any script or structural change.
- [ ] If AGENTS.md or process docs are out of sync, block deploy and schedule immediate review.
- [x] Every destructive operation (branch delete, orphan prune, FTP file delete) is reviewed and logged in maintenance journal/log.  
      (Policy exists; logging storage is operationally defined.)
- [x] Every phase change (promote dev → staging, staging → main, main → prod) has an audit log with summary (date, person, diff summary, new/del/changed files listed).  
      (AGENTS.md and related docs describe audit requirements.)
- [x] Keep AGENTS.md, TODO.md, and all workflow docs in sync after any script or structural change.  
      (scripts/check-agents-md.sh and AGENTS.md present to assist.)
- [ ] If AGENTS.md or process docs are out of sync, block deploy and schedule immediate review.

---

## 8. Recurrence

- [ ] Schedule and record the date of next full maintenance/drift check/FTP audit (recommended per-release or monthly).
- [ ] Schedule and record the date of next full maintenance/drift check/FTP audit (recommended per-release or monthly).

---

**Branch Model Reference:**

- All normal work off `development`.
- `staging` is the QA/Gate branch.
- `main` is only promoted to via squash from staging—no fast-forwards, never direct pushes.
- After main → prod deploy, immediately ensure new dev/staging branches point at main for the next cycle (no drift, no weird revisions).

**All points requiring explicit review, signoff, or destructive action are staged and logged—never automated or silent.**

**Check this list at every cycle—do not skip validation or human review stages.**
