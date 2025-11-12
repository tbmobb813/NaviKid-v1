# CI/CD Runbook for NaviKid

This runbook provides operational guidance for the NaviKid CI/CD pipeline.

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Required Secrets](#required-secrets)
4. [Branch Protection Rules](#branch-protection-rules)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)
7. [Emergency Procedures](#emergency-procedures)
8. [Monitoring](#monitoring)

---

## Pipeline Overview

### Architecture

```
┌─────────────────┐
│  Pull Request   │
└────────┬────────┘
         │
         ├──► Frontend CI (Lint, Type Check, Test)
         ├──► Backend CI (Lint, Type Check, Test, Integration)
         └──► Security Scan (Trivy, CodeQL, Secrets)

┌─────────────────┐
│  Push to Main   │
└────────┬────────┘
         │
         ├──► Frontend CI/CD → EAS Build → Deploy Staging
         ├──► Backend CI/CD → Docker Build → Deploy Staging
         └──► Security Scan (Weekly scheduled)

┌─────────────────┐
│ Manual Deploy   │
└────────┬────────┘
         │
         └──► Deploy to Staging/Production (with approval)
```

### Workflows

| Workflow | Trigger | Duration | Purpose |
|----------|---------|----------|---------|
| **Backend CI** | PR, Push to main/develop | ~5-8 min | Lint, test, build backend |
| **Frontend CI** | PR, Push to main/develop | ~4-6 min | Lint, test, build frontend |
| **Security Scan** | PR, Push, Weekly | ~10-15 min | Security vulnerability scanning |
| **Manual Deploy** | Manual trigger | ~10-20 min | Deploy to staging/production |

---

## GitHub Actions Workflows

### 1. Backend CI/CD (`.github/workflows/backend-ci.yml`)

**Purpose**: Validate and deploy backend changes

**Triggers**:
- Push to `main` or `develop` branches (paths: `backend/**`)
- Pull requests to `main` (paths: `backend/**`)
- Manual trigger (`workflow_dispatch`)

**Jobs**:
1. **lint-and-typecheck**: ESLint, TypeScript, Prettier
2. **security**: npm audit
3. **build**: TypeScript compilation
4. **test**: Unit tests with PostgreSQL + Redis
5. **integration-tests**: Database migrations + integration tests
6. **docker-build**: Build Docker image (main/develop only)
7. **deploy-staging**: Deploy to staging (main only)

**Services**:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)

**Artifacts**:
- Build output (`backend/dist`)
- Docker image (7 day retention)
- Coverage reports (uploaded to Codecov)

---

### 2. Frontend CI/CD (`.github/workflows/frontend-ci.yml`)

**Purpose**: Validate and deploy frontend changes

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual trigger (`workflow_dispatch`)

**Jobs**:
1. **lint-and-typecheck**: ESLint, TypeScript, Prettier
2. **security**: npm audit
3. **test**: Unit tests with coverage
4. **build-expo**: Expo config validation
5. **integration-tests**: Integration tests
6. **eas-build-preview**: Build preview for PRs
7. **eas-build-staging**: Build staging (develop branch)
8. **eas-build-production**: Build production (main branch)
9. **deploy-eas-update**: Publish OTA updates

**Artifacts**:
- Test results (7 day retention)
- Coverage reports (uploaded to Codecov)

---

### 3. Security Scanning (`.github/workflows/security.yml`)

**Purpose**: Detect security vulnerabilities

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Weekly schedule (Sundays at midnight UTC)
- Manual trigger (`workflow_dispatch`)

**Jobs**:
1. **dependency-review**: Review dependency changes in PRs
2. **trivy-scan**: Filesystem vulnerability scanning
3. **npm-audit-frontend**: Frontend dependency audit
4. **npm-audit-backend**: Backend dependency audit
5. **codeql-analysis**: Static code analysis
6. **secrets-scan**: Detect committed secrets (TruffleHog)
7. **license-check**: License compliance
8. **docker-security-scan**: Docker image scanning

**Security Levels**:
- **CRITICAL**: Immediate action required
- **HIGH**: Action required within 7 days
- **MEDIUM**: Action required within 30 days
- **LOW**: Review and track

---

### 4. Manual Deployment (`.github/workflows/deploy.yml`)

**Purpose**: Manually trigger deployments with approval

**Inputs**:
- `environment`: staging | production
- `component`: backend | frontend | all
- `skip_tests`: boolean (not allowed for production)
- `version_tag`: optional version identifier

**Safety Guards**:
- Production deployments must be from `main` branch
- Cannot skip tests for production
- Requires environment approval (configured in GitHub)

**Jobs**:
1. **validate**: Validate inputs and branch
2. **test-backend**: Run backend tests (if not skipped)
3. **test-frontend**: Run frontend tests (if not skipped)
4. **deploy-backend**: Deploy backend to chosen environment
5. **deploy-frontend**: Deploy frontend to chosen environment
6. **rollback**: Notification if deployment fails
7. **notify**: Send deployment notifications

---

## Required Secrets

### GitHub Repository Secrets

Configure these in **Settings → Secrets and variables → Actions**:

#### Essential Secrets

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `EXPO_TOKEN` | Expo/EAS authentication token | Frontend builds/deploys |
| `CODECOV_TOKEN` | Codecov upload token | Coverage reports |

#### Backend Deployment Secrets

| Secret Name | Description | Usage |
|-------------|-------------|-------|
| `STAGING_DATABASE_URL` | PostgreSQL connection string | Staging backend |
| `PRODUCTION_DATABASE_URL` | PostgreSQL connection string | Production backend |
| `STAGING_DEPLOY_KEY` | Deployment credentials | Staging deploy |
| `DEPLOY_KEY` | Deployment credentials | Production deploy |

#### Optional Secrets (based on deployment method)

**AWS Deployment**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

**Digital Ocean**:
- `DO_APP_ID`
- `DIGITALOCEAN_ACCESS_TOKEN`

**Heroku**:
- `HEROKU_API_KEY`

**Custom VPS**:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

**Notifications**:
- `SLACK_WEBHOOK` (optional)
- `SENTRY_DSN` (optional)

### How to Create Expo Token

```bash
# Login to Expo
npx expo login

# Generate token
npx eas whoami
# Go to: https://expo.dev/accounts/[account]/settings/access-tokens
# Create new token with "Read and write" permissions
```

### How to Get Codecov Token

1. Visit https://codecov.io/
2. Sign up with GitHub account
3. Add repository
4. Copy token from Settings → General

---

## Branch Protection Rules

### Main Branch (`main`)

Configure in **Settings → Branches → Branch protection rules**:

**Required**:
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Require deployments to succeed before merging (production environment)

**Status Checks** (mark as required):
- `lint-and-typecheck` (Frontend CI)
- `lint-and-typecheck` (Backend CI)
- `test` (Frontend CI)
- `test` (Backend CI)
- `integration-tests` (Backend CI)
- `security` (Security Scan)
- `build-expo` (Frontend CI)
- `build` (Backend CI)

**Code Review**:
- ✅ Require pull request reviews before merging
- Required approvals: **2**
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require review from Code Owners

**Optional** (recommended):
- ✅ Restrict pushes that create matching branches
- ✅ Require signed commits

### Develop Branch (`develop`)

**Required**:
- ✅ Require status checks to pass before merging
- ✅ Require conversation resolution before merging

**Status Checks** (mark as required):
- `lint-and-typecheck` (Frontend CI)
- `lint-and-typecheck` (Backend CI)
- `test` (Frontend CI)
- `test` (Backend CI)

**Code Review**:
- Required approvals: **1**

---

## Common Tasks

### Task 1: Deploy Backend to Staging

**Option A: Automatic (via push)**
```bash
git checkout develop
git pull origin develop
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin develop
# CI/CD automatically deploys to staging
```

**Option B: Manual**
1. Go to **Actions** tab in GitHub
2. Select **Manual Deployment** workflow
3. Click **Run workflow**
4. Choose:
   - Environment: `staging`
   - Component: `backend`
   - Skip tests: `false`
5. Click **Run workflow**
6. Monitor progress

**Option C: Command line**
```bash
./scripts/deploy-backend.sh staging
```

---

### Task 2: Deploy Frontend to Production

**Prerequisites**:
- All tests passing on `main` branch
- Code reviewed and approved
- QA sign-off

**Steps**:
1. Merge PR to `main`
2. Go to **Actions** → **Manual Deployment**
3. Run workflow:
   - Environment: `production`
   - Component: `frontend`
   - Version: `v1.0.0` (semantic version)
4. Wait for approval (if configured)
5. Monitor deployment
6. Verify in production

**Or via command line**:
```bash
./scripts/deploy-frontend.sh production all v1.0.0
```

---

### Task 3: Publish OTA Update

**Use Case**: Hot fix without app store review

```bash
# Staging
./scripts/deploy-frontend.sh staging update

# Production
./scripts/deploy-frontend.sh production update v1.0.1
```

**Or via GitHub Actions**:
1. **Actions** → **Frontend CI/CD**
2. The `deploy-eas-update` job publishes OTA on push to main/develop

---

### Task 4: Run Security Scan Manually

```bash
# Navigate to Actions tab
# Select "Security Scanning"
# Click "Run workflow"
```

Or locally:
```bash
# Trivy scan
docker run --rm -v $(pwd):/workspace aquasecurity/trivy fs /workspace

# npm audit
npm audit
cd backend && npm audit
```

---

### Task 5: Check CI/CD Status

**GitHub UI**:
- Go to **Actions** tab
- View workflow runs
- Click on run for details

**Command Line**:
```bash
# Install GitHub CLI
gh run list --limit 10

# View specific run
gh run view <run-id>

# Watch live
gh run watch
```

---

### Task 6: Rollback Deployment

**Backend Rollback** (if using Docker):
```bash
# List recent versions
docker images navikid-backend

# Rollback to previous version
./scripts/deploy-backend.sh production <previous-sha>
```

**Frontend Rollback**:
```bash
# Republish previous OTA update
eas update:republish --channel production --group <previous-group-id>

# Or rollback to specific branch
eas branch:publish production --input-dir ./dist
```

**Database Rollback** (if migrations break):
```bash
# SSH to server
ssh user@server

# Run migration rollback
cd /opt/navikid/backend
npm run db:rollback
```

---

### Task 7: Add New Environment Variable

**Backend**:
1. Update `.env.example` in `/backend`
2. Add to GitHub Secrets:
   - `STAGING_<VAR_NAME>`
   - `PRODUCTION_<VAR_NAME>`
3. Update deployment workflow to inject variable
4. Redeploy

**Frontend**:
1. Update `.env.example` in project root
2. Add to `eas.json` under appropriate profile
3. Build new version (OTA updates can't change env vars)

---

### Task 8: Update Dependencies

**Monthly Dependency Update**:
```bash
# Frontend
npm outdated
npm update
npm audit fix

# Backend
cd backend
npm outdated
npm update
npm audit fix

# Test thoroughly
npm run test:all

# Commit and push
git add package*.json
git commit -m "chore: update dependencies"
git push
```

---

## Troubleshooting

### Issue 1: CI Failing on TypeScript Errors

**Symptoms**: `typecheck` job fails

**Solution**:
```bash
# Run locally
npm run typecheck

# Fix errors
# Common issues:
# - Missing type definitions: npm install --save-dev @types/<package>
# - Strict mode violations: update code or adjust tsconfig.json
```

---

### Issue 2: Tests Failing in CI but Passing Locally

**Common Causes**:
- Environment differences
- Race conditions
- Missing environment variables

**Solution**:
```bash
# Check CI environment
# Review workflow logs for exact Node version, environment

# Match CI environment locally
nvm use 18
npm ci  # Use exact versions from package-lock.json

# Run tests with same env
NODE_ENV=test npm run test
```

---

### Issue 3: Docker Build Failing

**Symptoms**: `docker-build` job fails

**Debugging**:
```bash
# Test Docker build locally
cd backend
docker build -t navikid-backend:test .

# Check for common issues:
# - Missing .dockerignore
# - node_modules in build context
# - Missing dependencies
# - Incorrect paths
```

---

### Issue 4: EAS Build Failing

**Symptoms**: `eas-build` job fails

**Solution**:
```bash
# Test build locally
eas build --platform android --profile staging --local

# Common fixes:
# - Update eas.json configuration
# - Check credentials: eas credentials
# - Verify app.config.ts
# - Clear cache: eas build:configure
```

---

### Issue 5: Deployment Health Check Failing

**Symptoms**: Deployment succeeds but health check fails

**Debugging**:
```bash
# Check service logs
# For AWS ECS:
aws logs tail /ecs/navikid-backend --follow

# For Docker:
docker logs navikid-backend

# For Heroku:
heroku logs --tail --app navikid-backend-staging

# Common issues:
# - Database connection failure
# - Missing environment variables
# - Port binding issues
# - Startup timeout
```

---

### Issue 6: Coverage Below Threshold

**Symptoms**: Warning about low coverage

**Solution**:
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html

# Identify untested code
# Add tests for critical paths
# Update coverage thresholds in jest.config if reasonable
```

---

### Issue 7: Security Vulnerabilities Found

**Symptoms**: Security scan finds vulnerabilities

**Triage**:
```bash
# Review vulnerabilities
npm audit

# Check severity
npm audit --json | jq '.metadata'

# Fix automatically (if available)
npm audit fix

# For unfixable vulnerabilities:
# 1. Check if it affects production dependencies
npm audit --production

# 2. Check if it's actually exploitable in your context
# 3. Create issue to track
# 4. Add exception if necessary (document why)
```

---

## Emergency Procedures

### Emergency 1: Production Outage

**Immediate Actions**:
1. **Confirm outage**: Check monitoring, health endpoints
2. **Notify team**: Post in incident channel
3. **Check recent changes**: Review recent deployments
4. **Quick rollback** (if caused by deployment):
   ```bash
   # Backend
   ./scripts/deploy-backend.sh production <last-known-good-sha>

   # Frontend
   eas update:rollback --channel production
   ```
5. **Verify recovery**: Check health endpoints, monitoring
6. **Post-mortem**: Document what happened, root cause, prevention

---

### Emergency 2: Secrets Leaked

**Immediate Actions**:
1. **Rotate secrets immediately**:
   - Database passwords
   - API keys
   - JWT secrets
   - OAuth tokens
2. **Update GitHub Secrets**
3. **Revoke leaked credentials** at source (AWS, etc.)
4. **Scan for unauthorized access**
5. **Notify security team**
6. **Update all environments**

---

### Emergency 3: Main Branch Broken

**Symptoms**: Cannot merge PRs, CI failing on main

**Fix**:
1. **Identify breaking commit**:
   ```bash
   git log --oneline main
   git bisect start
   ```
2. **Revert if necessary**:
   ```bash
   git revert <bad-commit-sha>
   git push origin main
   ```
3. **Or force push** (ONLY if recent and coordinated):
   ```bash
   git reset --hard <good-commit-sha>
   git push --force origin main
   ```
4. **Notify team**: Update everyone

---

### Emergency 4: Quota/Rate Limit Exceeded

**Symptoms**: Builds failing with quota errors

**Solutions**:
- **GitHub Actions minutes**: Upgrade plan or optimize workflows
- **Expo builds**: Check EAS subscription limits
- **npm registry**: Wait for rate limit reset or use different token
- **Docker Hub**: Authenticate to increase pull limits

---

## Monitoring

### Metrics to Track

**CI/CD Performance**:
- Build success rate
- Average build duration
- Time to deploy
- Deployment frequency

**Quality**:
- Test coverage %
- Number of vulnerabilities
- Code review time
- Time to fix failures

**Dashboards**:
- GitHub Actions Insights
- Codecov dashboard
- Sentry (errors/performance)

### Alerts to Configure

1. **Build failures** (via GitHub notifications)
2. **Security vulnerabilities** (CRITICAL/HIGH)
3. **Deployment failures** (Slack/email)
4. **Coverage drops** (Codecov)
5. **Production errors** (Sentry)

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Codecov Documentation](https://docs.codecov.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Best Practices](../DEPLOYMENT_SECURITY_GUIDE.md)

---

## Contacts

**On-Call**:
- Primary: [Your on-call schedule]
- Secondary: [Backup contact]

**Escalation**:
- DevOps Lead: [Contact]
- Security Team: [Contact]
- Infrastructure: [Contact]

---

**Last Updated**: 2025-11-04
**Document Owner**: DevOps Team
**Review Cycle**: Monthly
