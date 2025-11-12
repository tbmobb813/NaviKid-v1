# CI/CD Quick Reference Guide

Quick commands and procedures for the NaviKid-v1 CI/CD pipeline.

## Table of Contents
- [Quick Commands](#quick-commands)
- [Workflow Triggers](#workflow-triggers)
- [Emergency Procedures](#emergency-procedures)
- [Common Tasks](#common-tasks)
- [Troubleshooting Quick Fixes](#troubleshooting-quick-fixes)

---

## Quick Commands

### Local Testing Before Push

```bash
# Run all checks locally before pushing
npm run lint                 # Lint check
npm run typecheck            # TypeScript check
npm test                     # Run tests
npm audit                    # Security audit

# Backend specific (from /backend directory)
cd backend
npm run lint
npm run typecheck
npm test
npm run build
```

### Trigger CI/CD

```bash
# Push to trigger CI
git add .
git commit -m "feat: your feature description"
git push origin your-branch

# Empty commit to re-trigger CI
git commit --allow-empty -m "chore: trigger CI"
git push
```

### Check CI Status

```bash
# Using GitHub CLI
gh workflow list
gh run list --workflow=backend-ci.yml
gh run watch

# View latest run
gh run view --web
```

---

## Workflow Triggers

### Backend CI (`backend-ci.yml`)

**Auto-triggers:**
- Push to `main` with backend file changes
- PR to `main` with backend file changes

**Files watched:**
- `backend/**`
- `.github/workflows/backend-ci.yml`

**Manual trigger:** Not supported (push to trigger)

---

### Frontend CI (`frontend-ci.yml`)

**Auto-triggers:**
- Push to `main` (excluding backend changes)
- PR to `main` (excluding backend changes)

**Files ignored:**
- `backend/**`
- `.github/workflows/backend-ci.yml`
- `**.md`

**Manual trigger:** Not supported (push to trigger)

---

### Security Scanning (`security.yml`)

**Auto-triggers:**
- Push to `main` or `develop`
- PR to `main`
- Every Monday at 2 AM UTC

**Manual trigger:**
1. Go to Actions → Security Scanning
2. Run workflow → Select scan level
3. Click Run workflow

---

### Manual Deployment (`deploy.yml`)

**Trigger:** Manual only

**Quick Deploy:**
1. Actions → Manual Deployment → Run workflow
2. Select options:
   - Environment: `staging` or `production`
   - Service: `frontend`, `backend`, or `both`
   - Run migrations: `true` (if DB changes)
   - Skip tests: `false` (unless emergency)
3. Run workflow

---

## Emergency Procedures

### Critical Production Bug (Hotfix)

```bash
# 1. Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Make minimal fix
# ... edit files ...

# 3. Test locally
npm test

# 4. Commit and push
git add .
git commit -m "fix: [HOTFIX] critical issue description"
git push origin hotfix/critical-issue

# 5. Create PR with [HOTFIX] label
gh pr create --title "[HOTFIX] Critical issue" --base main

# 6. After merge, deploy to production
# Go to Actions → Manual Deployment
# Environment: production
# Service: (affected service)
# Skip tests: true (only if necessary)
```

### Rollback Production

```bash
# 1. Identify last good commit
git log --oneline

# 2. Create rollback branch
git checkout -b rollback/revert-bad-deploy <GOOD_COMMIT_SHA>

# 3. Push and deploy
git push origin rollback/revert-bad-deploy

# 4. Manual deployment from rollback branch
# Actions → Manual Deployment → Run workflow
```

### Force Re-run Failed CI

```bash
# Using GitHub CLI
gh run rerun <RUN_ID>

# Or re-run latest
gh run rerun $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')

# Via web: Go to Actions → Click failed run → Re-run jobs
```

---

## Common Tasks

### Add GitHub Secret

```bash
# Using GitHub CLI
gh secret set SECRET_NAME

# Or via web
# Settings → Secrets and variables → Actions → New repository secret
```

### Update EAS Build

```bash
# 1. Update eas.json configuration
# 2. Commit changes
git add eas.json
git commit -m "chore: update EAS build config"
git push

# 3. Trigger manual deployment or wait for auto-deploy
```

### Run Security Scan

```bash
# Via GitHub CLI
gh workflow run security.yml

# Via web
# Actions → Security Scanning → Run workflow
```

### Check Coverage Report

```bash
# Local coverage
npm test -- --coverage

# View in browser
open coverage/lcov-report/index.html

# CI coverage: Check Codecov badge in README
# Or visit: https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update and test
npm update
npm test
npm run build

# Commit
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push

# CI will run security audit automatically
```

---

## Troubleshooting Quick Fixes

### Issue: EXPO_TOKEN Invalid

```bash
# Regenerate token
npx expo login
npx expo whoami

# Get token
npx eas whoami

# Update GitHub secret
gh secret set EXPO_TOKEN
```

### Issue: Database Migration Fails

```bash
# Test migration locally
cd backend
npm run migrate:up

# If fails, fix migration file
# Then push fix:
git add backend/migrations/
git commit -m "fix: correct migration script"
git push
```

### Issue: Tests Fail on CI but Pass Locally

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run in CI mode
npm test -- --ci

# Check for:
# - Timezone issues
# - Random data in tests
# - Async timing issues
# - Missing environment variables
```

### Issue: Build Fails (Out of Memory)

```bash
# Increase Node memory locally
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# For CI, add to workflow:
# env:
#   NODE_OPTIONS: "--max-old-space-size=4096"
```

### Issue: Coverage Below Threshold

```bash
# Check coverage report
npm test -- --coverage
open coverage/lcov-report/index.html

# Add more tests or adjust threshold in workflow:
# env:
#   COVERAGE_THRESHOLD: 60
```

### Issue: Linting Errors

```bash
# Auto-fix linting issues
npm run lint -- --fix

# Check what will be fixed
npm run lint

# Commit fixes
git add .
git commit -m "style: fix linting issues"
git push
```

### Issue: TypeScript Errors

```bash
# Check types locally
npm run typecheck

# Common fixes:
# - Add type definitions
# - Fix type imports
# - Update tsconfig.json

# Verify fix
npm run typecheck
```

---

## Workflow Status Checks

### Required Status Checks (for PRs)

Before merge, these must pass:
- ✅ Frontend: Lint & Code Quality
- ✅ Frontend: TypeScript Type Check
- ✅ Frontend: Unit Tests
- ✅ Backend: Lint & Code Quality
- ✅ Backend: TypeScript Type Check
- ✅ Backend: Unit Tests
- ✅ Security: Dependency Scan

### Optional Checks

These can fail without blocking merge:
- ⚪ Backend: Integration Tests
- ⚪ Security: Configuration Scan
- ⚪ Performance Tests

---

## CI/CD Workflow URLs

Quick access to workflows:

```
Backend CI:
https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/backend-ci.yml

Frontend CI:
https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/frontend-ci.yml

Security:
https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/security.yml

Manual Deploy:
https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/deploy.yml
```

---

## Environment URLs

### Staging
- Backend API: `https://staging-api.navikid.app`
- Frontend: Expo channel `staging`

### Production
- Backend API: `https://api.navikid.app`
- Frontend: App Stores + Expo channel `production`

---

## Useful GitHub CLI Commands

```bash
# Install GitHub CLI
# macOS: brew install gh
# Linux: sudo apt install gh
# Windows: winget install GitHub.cli

# Authenticate
gh auth login

# View workflows
gh workflow list
gh workflow view backend-ci.yml

# View runs
gh run list
gh run list --workflow=backend-ci.yml --limit 5
gh run view <RUN_ID>
gh run watch

# Secrets
gh secret list
gh secret set SECRET_NAME
gh secret delete SECRET_NAME

# PRs
gh pr list
gh pr status
gh pr create
gh pr merge

# Issues
gh issue list
gh issue create
```

---

## Monitoring Commands

```bash
# Check latest CI status
gh run list --limit 1

# Watch current run
gh run watch

# View failed runs today
gh run list --status failure --created $(date +%Y-%m-%d)

# Download artifacts
gh run download <RUN_ID>

# View logs
gh run view <RUN_ID> --log
```

---

## Quick Links

- **Actions Dashboard:** https://github.com/YOUR_USERNAME/NaviKid-v1/actions
- **Security Tab:** https://github.com/YOUR_USERNAME/NaviKid-v1/security
- **Codecov:** https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1
- **Documentation:** [GITHUB_SETUP.md](./GITHUB_SETUP.md)
- **Badge Guide:** [CI_CD_BADGES.md](./CI_CD_BADGES.md)

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0

---

## Need Help?

1. Check [GITHUB_SETUP.md](./GITHUB_SETUP.md) for detailed docs
2. View workflow logs in Actions tab
3. Search existing GitHub Issues
4. Contact DevOps team
5. Create new issue with `ci/cd` label
