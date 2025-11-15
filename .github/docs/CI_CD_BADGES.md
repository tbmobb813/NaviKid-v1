# CI/CD Status Badges

This document provides status badges and monitoring information for the NaviKid-v1 CI/CD pipeline.

## Quick Status Overview

Add these badges to your README.md to display real-time CI/CD status:

### Main Pipeline Status

```markdown
![Backend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Backend%20CI%2FCD/badge.svg)
![Frontend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Frontend%20CI%2FCD/badge.svg)
![Security Scanning](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Security%20Scanning/badge.svg)
```

### Alternative: Using Actions Badge

```markdown
[![Backend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/backend-ci.yml)
[![Frontend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/frontend-ci.yml)
[![Security Scanning](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/security.yml)
```

### Branch-Specific Badges

**Main Branch:**

```markdown
![Backend CI](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Backend%20CI%2FCD/badge.svg?branch=main)
![Frontend CI](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Frontend%20CI%2FCD/badge.svg?branch=main)
```

**Develop Branch:**

```markdown
![Backend CI](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Backend%20CI%2FCD/badge.svg?branch=develop)
![Frontend CI](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Frontend%20CI%2FCD/badge.svg?branch=develop)
```

---

## Code Coverage Badges

### Codecov

Add to README.md after setting up Codecov integration:

```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1)
```

### Backend Coverage

```markdown
[![Backend Coverage](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1/branch/main/graph/badge.svg?flag=backend-unit)](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1)
```

### Frontend Coverage

```markdown
[![Frontend Coverage](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1)
```

---

## Security Badges

### Security Scorecard

```markdown
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/YOUR_USERNAME/NaviKid-v1/badge)](https://api.securityscorecards.dev/projects/github.com/YOUR_USERNAME/NaviKid-v1)
```

### Known Vulnerabilities

```markdown
[![Known Vulnerabilities](https://snyk.io/test/github/YOUR_USERNAME/NaviKid-v1/badge.svg)](https://snyk.io/test/github/YOUR_USERNAME/NaviKid-v1)
```

---

## Deployment Status Badges

### Staging Environment

```markdown
![Staging Deployment](https://img.shields.io/badge/staging-deployed-success)
```

### Production Environment

```markdown
![Production Deployment](https://img.shields.io/badge/production-deployed-success)
```

---

## Custom Shields.io Badges

### Build Status

```markdown
![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/NaviKid-v1/backend-ci.yml?label=Backend%20Build)
![Build Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/NaviKid-v1/frontend-ci.yml?label=Frontend%20Build)
```

### Last Commit

```markdown
![Last Commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/NaviKid-v1)
```

### License

```markdown
![License](https://img.shields.io/github/license/YOUR_USERNAME/NaviKid-v1)
```

### Version

```markdown
![Version](https://img.shields.io/github/package-json/v/YOUR_USERNAME/NaviKid-v1)
```

### Languages

```markdown
![Top Language](https://img.shields.io/github/languages/top/YOUR_USERNAME/NaviKid-v1)
![Languages Count](https://img.shields.io/github/languages/count/YOUR_USERNAME/NaviKid-v1)
```

### Issues and PRs

```markdown
![Issues](https://img.shields.io/github/issues/YOUR_USERNAME/NaviKid-v1)
![Pull Requests](https://img.shields.io/github/issues-pr/YOUR_USERNAME/NaviKid-v1)
```

---

## Complete README Badge Section

Here's a complete badge section you can copy to your README.md:

```markdown
# NaviKid-v1

## Project Status

[![Backend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/backend-ci.yml)
[![Frontend CI/CD](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/frontend-ci.yml)
[![Security Scanning](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/security.yml/badge.svg)](https://github.com/YOUR_USERNAME/NaviKid-v1/actions/workflows/security.yml)

[![codecov](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1)
[![License](https://img.shields.io/github/license/YOUR_USERNAME/NaviKid-v1)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/NaviKid-v1)](https://github.com/YOUR_USERNAME/NaviKid-v1/commits/main)

---

Your project description here...
```

---

## Badge Colors and Status

GitHub Actions badges automatically show status colors:

- ✅ **Green (passing)** - All checks passed
- 🔴 **Red (failing)** - One or more checks failed
- ⚪ **Gray (no status)** - Workflow hasn't run yet
- 🟡 **Yellow (pending)** - Workflow is currently running

---

## Advanced Badge Configuration

### Show Coverage Percentage

```markdown
[![Coverage](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1)
```

### Show Specific Event

```markdown
![CI on Push](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Backend%20CI%2FCD/badge.svg?event=push)
![CI on PR](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/Backend%20CI%2FCD/badge.svg?event=pull_request)
```

### Custom Shields Badge with Dynamic Data

```markdown
![Backend Tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/YOUR_USERNAME/GIST_ID/raw/backend-tests.json)
```

To create dynamic badges:

1. Create a GitHub Gist with badge data
2. Use shields.io endpoint API
3. Update Gist from workflow using GitHub API

---

## Monitoring Dashboard Links

Add these links to quickly access monitoring:

```markdown
## CI/CD Dashboard

- [GitHub Actions](https://github.com/YOUR_USERNAME/NaviKid-v1/actions)
- [Codecov Dashboard](https://codecov.io/gh/YOUR_USERNAME/NaviKid-v1)
- [Security Alerts](https://github.com/YOUR_USERNAME/NaviKid-v1/security)
- [Dependabot](https://github.com/YOUR_USERNAME/NaviKid-v1/security/dependabot)
```

---

## Updating Badges

### After Repository Creation

1. Replace `YOUR_USERNAME` with your GitHub username
2. Replace `NaviKid-v1` with your repository name (if different)
3. Commit changes to README.md
4. Badges will automatically update after first workflow run

### Testing Badges

Run a workflow to see badges update:

```bash
git commit -m "test: trigger CI" --allow-empty
git push
```

---

## Badge Best Practices

1. **Placement**: Put badges at the top of README for visibility
2. **Relevance**: Only show badges relevant to users/contributors
3. **Limit Count**: Don't overwhelm with too many badges (5-10 max)
4. **Group Logically**: Group related badges (CI, Coverage, Quality, etc.)
5. **Keep Updated**: Remove badges for discontinued services

---

## Troubleshooting Badges

### Badge Not Showing

**Problem:** Badge shows "invalid" or doesn't appear

**Solutions:**

- Verify workflow file name matches badge URL
- Check if workflow has run at least once
- Ensure repository is public (or use tokens for private repos)
- Wait a few minutes for GitHub cache to update

### Badge Shows Wrong Status

**Problem:** Badge doesn't reflect latest run

**Solutions:**

- Clear browser cache
- Add `?cache=none` to badge URL temporarily
- Wait for GitHub cache to expire (usually 5-10 minutes)

### Private Repository Badges

For private repositories, use token authentication:

```markdown
![CI](https://github.com/YOUR_USERNAME/NaviKid-v1/workflows/CI/badge.svg?token=YOUR_TOKEN)
```

---

## Resources

- [GitHub Actions Badges](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)
- [Shields.io](https://shields.io/)
- [Codecov Badges](https://docs.codecov.com/docs/status-badges)
- [Custom Badge Endpoints](https://shields.io/endpoint)

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0
