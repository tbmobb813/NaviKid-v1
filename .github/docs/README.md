# GitHub Actions CI/CD Documentation

Welcome to the NaviKid-v1 CI/CD documentation!

## Quick Links

- **[GitHub Setup Guide](./GITHUB_SETUP.md)** - Complete setup instructions
- **[Quick Reference](./CI_CD_QUICK_REFERENCE.md)** - Quick commands and procedures
- **[Badge Guide](./CI_CD_BADGES.md)** - Status badges for README
- **[Implementation Summary](../../CI_CD_IMPLEMENTATION_SUMMARY.md)** - Complete implementation overview

## Available Workflows

### 1. Backend CI/CD
**File:** `.github/workflows/backend-ci.yml`

Continuous integration for the Node.js + Fastify backend with PostgreSQL and Redis testing.

### 2. Frontend CI/CD
**File:** `.github/workflows/frontend-ci.yml`

Continuous integration for React Native + Expo frontend with EAS builds.

### 3. Security Scanning
**File:** `.github/workflows/security.yml`

Weekly security scanning with Trivy and dependency audits.

### 4. Manual Deployment
**File:** `.github/workflows/deploy.yml`

Manual deployment workflow for staging and production environments.

## Getting Started

1. Read the [GitHub Setup Guide](./GITHUB_SETUP.md)
2. Configure required GitHub secrets
3. Set up branch protection rules
4. Create GitHub environments
5. Test workflows by pushing code

## Need Help?

- Check the [Quick Reference Guide](./CI_CD_QUICK_REFERENCE.md) for common tasks
- Review workflow logs in the Actions tab
- Search existing issues
- Create a new issue with the `ci/cd` label

---

**Last Updated:** 2025-11-04
