# GitHub CI/CD Setup Guide

This document provides comprehensive instructions for setting up and configuring the GitHub Actions CI/CD pipeline for NaviKid-v1.

## Table of Contents

- [Overview](#overview)
- [Required GitHub Secrets](#required-github-secrets)
- [Branch Protection Rules](#branch-protection-rules)
- [Environment Configuration](#environment-configuration)
- [Workflow Overview](#workflow-overview)
- [Manual Workflow Triggers](#manual-workflow-triggers)
- [Deployment Procedures](#deployment-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

NaviKid-v1 uses GitHub Actions for continuous integration and deployment with the following workflows:

1. **Backend CI/CD** (`backend-ci.yml`) - Backend service testing and deployment
2. **Frontend CI/CD** (`frontend-ci.yml`) - React Native app testing and builds
3. **Security Scanning** (`security.yml`) - Vulnerability scanning with Trivy
4. **Manual Deployment** (`deploy.yml`) - Controlled deployments to staging/production

---

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings at:
**Settings → Secrets and variables → Actions → New repository secret**

### Essential Secrets

| Secret Name | Description | Required For | Example/Notes |
|-------------|-------------|--------------|---------------|
| `EXPO_TOKEN` | Expo authentication token for EAS builds | Frontend CI/CD | Get from: `npx expo login && npx expo whoami` |
| `CODECOV_TOKEN` | Codecov token for coverage reporting | Both CI/CD pipelines | Get from: codecov.io |
| `SENTRY_DSN` | Sentry error tracking DSN | Production deployments | Get from Sentry project settings |

### Backend Secrets

| Secret Name | Description | Required For | Example/Notes |
|-------------|-------------|--------------|---------------|
| `STAGING_DATABASE_URL` | PostgreSQL connection string for staging | Backend deployment | `postgresql://user:pass@host:5432/db` |
| `PRODUCTION_DATABASE_URL` | PostgreSQL connection string for production | Backend deployment | `postgresql://user:pass@host:5432/db` |
| `STAGING_REDIS_URL` | Redis connection string for staging | Backend deployment | `redis://host:6379` |
| `PRODUCTION_REDIS_URL` | Redis connection string for production | Backend deployment | `redis://host:6379` |
| `STAGING_DEPLOY_KEY` | SSH key or deployment token for staging | Backend deployment | SSH private key or API token |
| `PRODUCTION_DEPLOY_KEY` | SSH key or deployment token for production | Backend deployment | SSH private key or API token |
| `JWT_SECRET` | JWT signing secret | Backend | Random 32+ character string |

### Optional Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SLACK_WEBHOOK_URL` | Slack webhook for deployment notifications | `https://hooks.slack.com/...` |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | `https://discord.com/api/webhooks/...` |
| `AWS_ACCESS_KEY_ID` | AWS credentials (if using AWS) | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | IAM secret key |

---

## Branch Protection Rules

Configure branch protection for `main` branch at:
**Settings → Branches → Add branch protection rule**

### Recommended Configuration

#### Branch name pattern
```
main
```

#### Protection settings

**Require a pull request before merging**
- ✅ Require approvals: **2**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (if using CODEOWNERS file)

**Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging
- Required status checks:
  - `Lint & Code Quality` (frontend-ci)
  - `TypeScript Type Check` (frontend-ci)
  - `Unit Tests` (frontend-ci)
  - `Lint & Code Quality` (backend-ci)
  - `TypeScript Type Check` (backend-ci)
  - `Unit Tests` (backend-ci)
  - `Security Audit` (security)

**Require conversation resolution before merging**
- ✅ Require all conversations on code to be resolved before merging

**Require signed commits**
- ⚪ Optional but recommended for security

**Require linear history**
- ⚪ Optional - prevents merge commits

**Include administrators**
- ✅ Enforce all configured restrictions for administrators

**Restrict who can push to matching branches**
- ⚪ Optional - Configure if you want to restrict push access

**Allow force pushes**
- ❌ Disable force pushes to protected branches

**Allow deletions**
- ❌ Disable branch deletion

---

## Environment Configuration

GitHub Environments provide deployment protection rules and environment-specific secrets.

### Create Environments

Go to: **Settings → Environments → New environment**

Create the following environments:

#### 1. `staging-backend`
- **Deployment branches:** Selected branches → `main`
- **Required reviewers:** None (auto-deploy)
- **Wait timer:** 0 minutes
- **Environment URL:** `https://staging-api.navikid.app`

#### 2. `staging-frontend`
- **Deployment branches:** Selected branches → `main`
- **Required reviewers:** None (auto-deploy)
- **Wait timer:** 0 minutes
- **Environment URL:** `https://staging-app.navikid.app`

#### 3. `production-backend`
- **Deployment branches:** Selected branches → `main`
- **Required reviewers:** 2 reviewers (select team members)
- **Wait timer:** 5 minutes (cooling period)
- **Environment URL:** `https://api.navikid.app`

#### 4. `production-frontend`
- **Deployment branches:** Selected branches → `main`
- **Required reviewers:** 2 reviewers (select team members)
- **Wait timer:** 5 minutes (cooling period)
- **Environment URL:** `https://app.navikid.app`

---

## Workflow Overview

### Backend CI/CD (`backend-ci.yml`)

**Triggers:**
- Push to `main` branch (only when backend files change)
- Pull requests to `main` (only when backend files change)

**Jobs:**
1. **Lint & Code Quality** - ESLint and formatting checks
2. **TypeScript Type Check** - Type validation
3. **Security Audit** - npm audit for vulnerabilities
4. **Build** - Compile TypeScript to JavaScript
5. **Unit Tests** - Run unit tests with coverage
6. **Integration Tests** - Run with PostgreSQL and Redis containers
7. **Database Migration Tests** - Test migration scripts
8. **Deploy to Staging** - Auto-deploy on main branch (optional)

**Coverage Threshold:** 70%

---

### Frontend CI/CD (`frontend-ci.yml`)

**Triggers:**
- Push to `main` branch (excluding backend changes)
- Pull requests to `main` (excluding backend changes)

**Jobs:**
1. **Lint & Code Quality** - ESLint checks
2. **TypeScript Type Check** - Type validation
3. **Security Audit** - Dependency scanning
4. **Unit Tests** - Jest tests with coverage
5. **Build Validation** - Validate Expo configuration
6. **Build Android (Staging)** - EAS build for Android
7. **Build iOS (Staging)** - EAS build for iOS
8. **Publish Expo Update** - OTA update to staging channel

**Coverage Threshold:** 60%

---

### Security Scanning (`security.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Weekly schedule (Monday 2 AM UTC)
- Manual trigger

**Jobs:**
1. **Scan Frontend Dependencies** - npm audit
2. **Scan Backend Dependencies** - npm audit
3. **Trivy Filesystem Scan** - Scan for vulnerabilities
4. **Trivy Configuration Scan** - Scan configs and IaC
5. **Secret Scanning** - Check for hardcoded secrets
6. **Docker Image Scan** - Scan Docker images (if applicable)

**Results:** Uploaded to GitHub Security tab (SARIF format)

---

### Manual Deployment (`deploy.yml`)

**Trigger:** Manual workflow dispatch only

**Inputs:**
- **Environment:** `staging` or `production`
- **Service:** `frontend`, `backend`, or `both`
- **Run Migrations:** `true` or `false`
- **Skip Tests:** `true` or `false`
- **Deployment Message:** Custom message

**Jobs:**
1. **Pre-Deployment Validation** - Check configuration
2. **Deploy Backend** - Deploy backend service
3. **Deploy Frontend** - Deploy frontend app
4. **Post-Deployment Verification** - Health checks
5. **Rollback** - Auto-rollback on production failure

---

## Manual Workflow Triggers

### Trigger Deployment Workflow

1. Go to **Actions** tab in GitHub
2. Select **Manual Deployment** workflow
3. Click **Run workflow**
4. Fill in the parameters:
   - **Environment:** Select `staging` or `production`
   - **Service:** Select what to deploy
   - **Run migrations:** Check if database migrations needed
   - **Skip tests:** Only for emergency deployments
   - **Message:** Add deployment notes
5. Click **Run workflow**

### Trigger Security Scan

1. Go to **Actions** tab
2. Select **Security Scanning** workflow
3. Click **Run workflow**
4. Select scan level:
   - `CRITICAL` - Only critical vulnerabilities
   - `CRITICAL,HIGH` - Critical and high (recommended)
   - `CRITICAL,HIGH,MEDIUM` - Include medium severity
   - `ALL` - All severity levels
5. Click **Run workflow**

---

## Deployment Procedures

### Staging Deployment (Automatic)

Staging deployments happen automatically when code is merged to `main`:

1. Create a pull request to `main`
2. Wait for CI checks to pass
3. Get 2 code review approvals
4. Merge the pull request
5. Backend CI/CD will auto-deploy to staging
6. Frontend CI/CD will publish OTA update

**Staging URLs:**
- Backend: `https://staging-api.navikid.app`
- Frontend: Expo channel `staging`

---

### Production Deployment (Manual)

Production requires manual approval:

1. Verify staging is working correctly
2. Go to **Actions → Manual Deployment**
3. Configure deployment:
   ```
   Environment: production
   Service: both
   Run migrations: true (if DB changes)
   Skip tests: false
   Message: "v1.2.0 - Feature X release"
   ```
4. Click **Run workflow**
5. Workflow will wait for 2 reviewers approval
6. After approval, deployment proceeds
7. Monitor health checks
8. Verify production functionality

**Production URLs:**
- Backend: `https://api.navikid.app`
- Frontend: App stores + Expo channel `production`

---

### Emergency Hotfix Procedure

For critical production issues:

1. Create hotfix branch from `main`: `hotfix/critical-bug-fix`
2. Make minimal changes to fix the issue
3. Test locally
4. Create PR to `main` with `[HOTFIX]` prefix
5. Request expedited review
6. Merge to `main`
7. Run manual deployment with:
   ```
   Environment: production
   Service: (affected service)
   Skip tests: true (only if absolutely necessary)
   Message: "HOTFIX: Critical bug fix"
   ```

---

## Troubleshooting

### Common Issues

#### 1. EAS Build Fails

**Problem:** `eas build` fails with authentication error

**Solution:**
```bash
# Regenerate Expo token
npx expo login
npx expo whoami
eas whoami

# Update GitHub secret EXPO_TOKEN with new token
```

#### 2. Database Migration Fails

**Problem:** Migration fails during deployment

**Solution:**
- Check database connectivity
- Verify `DATABASE_URL` secret is correct
- Run migration manually:
  ```bash
  npm run migrate:up
  ```
- Check migration logs in workflow artifacts

#### 3. Coverage Below Threshold

**Problem:** Tests pass but coverage is below threshold

**Solution:**
- Add more test cases
- Or temporarily adjust threshold in workflow files:
  ```yaml
  env:
    COVERAGE_THRESHOLD: 60  # Adjust as needed
  ```

#### 4. Security Vulnerabilities Found

**Problem:** Security workflow fails with vulnerabilities

**Solution:**
- Review vulnerability details in workflow logs
- Update dependencies:
  ```bash
  npm audit fix
  ```
- For unfixable vulnerabilities, add to audit exceptions
- Consider using `npm audit --audit-level=high` to ignore low/moderate

#### 5. Workflow Permissions Error

**Problem:** Workflow can't upload SARIF or create artifacts

**Solution:**
- Go to **Settings → Actions → General**
- Under "Workflow permissions", select:
  - ✅ Read and write permissions
  - ✅ Allow GitHub Actions to create and approve pull requests

---

## Monitoring and Notifications

### View Workflow Status

- **All workflows:** Go to **Actions** tab
- **Failed runs:** Filter by "Failure" status
- **Artifacts:** Download from completed workflow runs
- **Logs:** Click on any job to view detailed logs

### Setup Notifications

Configure GitHub notifications for workflow failures:

1. Go to **Settings → Notifications**
2. Enable "Actions" notifications
3. Select notification method (email, mobile, etc.)

### Status Badges

Add these badges to your README.md:

```markdown
![Backend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Backend%20CI%2FCD/badge.svg)
![Frontend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Frontend%20CI%2FCD/badge.svg)
![Security Scanning](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Security%20Scanning/badge.svg)
```

---

## Best Practices

### 1. Code Review
- Require 2 approvals for all PRs
- Review test coverage in PR
- Check security scan results before merging

### 2. Testing
- Write tests before pushing code
- Aim for >70% backend coverage, >60% frontend coverage
- Run tests locally: `npm test`

### 3. Commits
- Use conventional commits: `feat:`, `fix:`, `chore:`
- Reference issues: `fixes #123`
- Keep commits atomic and focused

### 4. Deployments
- Always test in staging first
- Deploy during low-traffic hours
- Have rollback plan ready
- Monitor logs after deployment

### 5. Security
- Never commit secrets or API keys
- Use `.env` files locally (gitignored)
- Rotate secrets periodically
- Review security scan results weekly

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Codecov Documentation](https://docs.codecov.com/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/)

---

## Support

For issues with CI/CD pipeline:

1. Check workflow logs for error details
2. Review this documentation
3. Search GitHub Actions community forums
4. Contact DevOps team
5. Create an issue in the repository

---

**Last Updated:** 2025-11-04
**Maintained By:** DevOps Team
**Version:** 1.0.0
