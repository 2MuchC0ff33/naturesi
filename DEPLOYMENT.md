# Deployment Workflow

> How to deploy changes from development to production.

---

## Branch Strategy

```
main (production)
  └── staging (review/QA)
        └── development (feature work)
              └── feature/X, fix/Y, test/Z (short-lived)
```

**Rules:**

- Never commit directly to `main` or `staging`
- All changes flow: feature branch → development → staging → main
- `development` is the working branch for all developers
- `staging` is for QA/review before production
- `main` is always production-ready

---

## Development Workflow

### Daily Developer Workflow

```sh
# 1. Always start on development
git checkout development
git pull origin development

# 2. Create feature branch for work
git checkout -b feat/my-feature

# 3. Make changes, commit frequently
git add <files>
git commit -m "feat(scope): description"

# 4. Push feature branch
git push -u origin feat/my-feature

# 5. When ready, merge to development
git checkout development
git merge feat/my-feature
git push origin development
```

### Before Each Deployment Session

```sh
# Check development status
git checkout development
git status
git log --oneline -3

# Check for uncommitted changes
git diff --stat

# Check production differences (see below)
scripts/check-production-diff.sh

# Review what's changed since last deploy
scripts/check-dev-sync.sh
```

---

## Deployment Process

### Step 1: Prepare for Deployment

```sh
# 1. Ensure development is clean
git checkout development
git pull origin development

# 2. Run validation
scripts/lint-html.sh
scripts/lint-css.sh
scripts/lint-js.sh
scripts/test-all.sh

# 3. Check production diff
scripts/check-production-diff.sh

# 4. Review changes to be deployed
git log development..main  # Should show what's ahead
```

### Step 2: Merge to Staging

```sh
# 1. Create/update staging from development
git checkout staging
git pull origin staging
git merge development
git push origin staging

# 2. Deploy staging to production (dry-run first)
scripts/deploy-ftp.sh --dry-run

# 3. Review the dry-run output carefully
#    - Check for unexpected deletions
#    - Verify key files are included

# 4. If satisfied, deploy to production
scripts/deploy-ftp.sh
```

### Step 3: Production Verification

```sh
# 1. Verify production is updated
curl -s https://naturesinfusions.com.au | grep -i "version\|build\|date"

# 2. Run smoke tests
scripts/test-headless.sh

# 3. Check for any errors in browser console

# 4. If all good, update main branch
git checkout main
git merge staging
git push origin main
```

### Step 4: Post-Deployment

```sh
# 1. Generate new production snapshot
scripts/check-production-diff.sh > PRODUCTION_SNAPSHOT-$(date +%Y%m%d).md

# 2. Update documentation if needed

# 3. Notify team of deployment completion
```

---

## Monitoring Scripts

### Production Diff Checker

```sh
scripts/check-production-diff.sh
```

**What it does:**

- Compares production server files against development branch
- Reports files that differ from expected state
- Generates timestamped report
- Useful for detecting unauthorized changes or drift

**When to run:**

- Before each deployment
- Weekly as part of maintenance
- After any manual server changes

### Development Sync Monitor

```sh
scripts/check-dev-sync.sh
```

**What it does:**

- Checks for uncommitted changes in development
- Reports files modified but not committed
- Warns if deploying would push unintended changes
- Logs developer activity

**When to run:**

- Before starting work each day
- Before deployment sessions
- When investigating deployment issues

---

## Troubleshooting

### "My production has files I didn't deploy"

```sh
# 1. Run diff checker to identify issues
scripts/check-production-diff.sh

# 2. Check if files were manually edited on server
git log --oneline -5 development
git log --oneline -5 main

# 3. Compare specific file
curl -s "https://naturesinfusions.com.au/file.html" > /tmp/server.html
git show development:file.html > /tmp/dev.html
diff /tmp/server.html /tmp/dev.html

# 4. Deploy development to fix
scripts/deploy-ftp.sh
```

### "I accidentally pushed to main"

```sh
# 1. Don't panic - it's recoverable
git log --oneline -3 main

# 2. Reset main to previous state (if not pushed)
git reset --hard HEAD~1
git push --force-with-lease origin main

# 3. If already pushed, create revert commit
git revert HEAD
git push origin main

# 4. Deploy correct state to production
git checkout development
git push origin main:main  # Only if development is correct
scripts/deploy-ftp.sh
```

### "Deployment failed mid-way"

```sh
# 1. Check partial state
scripts/check-production-diff.sh

# 2. If state is inconsistent, deploy again
scripts/deploy-ftp.sh

# 3. Verify files are consistent
curl -s "https://naturesinfusions.com.au/index.html" | cksum
git show development:index.html | cksum

# 4. If still broken, full redeploy
#    - Sync with team to pause updates
#    - Deploy development branch
#    - Verify all files
```

---

## Rollback Procedure

If a deployment causes issues:

```sh
# 1. Immediately notify team
# "Deployment issue detected, investigating"

# 2. Identify last known good state
git log --oneline -10 main

# 3. Option A: Revert to main state before deploy
git checkout main
git log --oneline -3
# Find the commit before last deploy
git reset --hard <previous-commit>
git push --force-with-lease origin main

# 4. Option B: Redeploy from previous commit
git checkout development
git reset --hard <known-good-commit>
scripts/deploy-ftp.sh

# 5. Verify rollback
scripts/check-production-diff.sh
curl -s https://naturesinfusions.com.au | grep -i "error\|warning"

# 6. Document incident
#    - What went wrong
#    - What was affected
#    - How it was fixed
#    - Preventative measures
```

---

## Developer Onboarding

When a new developer joins:

1. Clone the repository

   ```sh
   git clone git@github.com:2MuchC0ff33/naturesi.git
   cd naturesi
   ```

2. Read documentation
   - [README.md](./README.md)
   - [AGENTS.md](./AGENTS.md)
   - This file

3. Setup local environment

   ```sh
   cp .env.template .env
   # Edit .env with your values
   scripts/serve.sh start
   ```

4. Review branch strategy
   - All work on feature branches
   - Merge to development when ready
   - Never commit directly to main/staging

5. Understand deployment
   - Read this DEPLOYMENT.md
   - Shadow a deployment before doing one solo
   - Use --dry-run flag

---

## Emergency Contacts

| Role              | Contact                                           |
| ----------------- | ------------------------------------------------- |
| Primary Developer | Adrian Gallo (2MuchC0ff33)                        |
| Production Issues | Check production diff first, then contact primary |
| Security Issues   | See SECURITY.md                                   |

---

## Related Documentation

- [PRODUCTION_SNAPSHOT.md](./PRODUCTION_SNAPSHOT.md) - Current production state
- [AGENTS.md](./AGENTS.md) - Agent and developer guidelines
- [scripts/check-production-diff.sh](../scripts/check-production-diff.sh) - Production diff tool
- [scripts/check-dev-sync.sh](../scripts/check-dev-sync.sh) - Dev sync monitor
