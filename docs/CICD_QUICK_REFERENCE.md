# CI/CD Quick Reference Card

## Common Tasks

### Deploy to Staging

**Backend**:
```bash
./scripts/deploy-backend.sh staging
```

**Frontend** (OTA Update):
```bash
./scripts/deploy-frontend.sh staging update
```

**Frontend** (Full Build):
```bash
./scripts/deploy-frontend.sh staging all
```

---

### Deploy to Production

**Backend**:
```bash
./scripts/deploy-backend.sh production v1.0.0
```

**Frontend** (OTA Update):
```bash
./scripts/deploy-frontend.sh production update v1.0.0
```

**Via GitHub Actions**:
1. Go to **Actions** → **Manual Deployment**
2. Click **Run workflow**
3. Select environment: `production`
4. Select component: `backend` / `frontend` / `all`
5. Enter version tag (optional)
6. Click **Run workflow**
7. Wait for approval (production only)

---

### Check CI/CD Status

**GitHub UI**: https://github.com/[org]/NaviKid-v1/actions

**Command Line**:
```bash
gh run list --limit 10
gh run watch
```

---

### Run Tests Locally

**Frontend**:
```bash
npm run test
npm run lint
npm run typecheck
```

**Backend**:
```bash
cd backend
npm run test
npm run lint
npm run typecheck
```

---

### Security Scan

**Automatic**: Runs weekly on Sundays

**Manual**:
1. Go to **Actions** → **Security Scanning**
2. Click **Run workflow**

**Local**:
```bash
npm audit
cd backend && npm audit
```

---

### Rollback Deployment

**Backend** (Docker):
```bash
# Deploy previous version
./scripts/deploy-backend.sh production abc1234
```

**Frontend** (OTA):
```bash
# Republish previous update
eas update:republish --channel production --group <group-id>
```

---

## Workflow Triggers

| Workflow | Auto Trigger | Manual |
|----------|--------------|--------|
| Backend CI | Push to main/develop, PR to main | ✅ |
| Frontend CI | Push to main/develop, PR to main | ✅ |
| Security Scan | Push, PR, Weekly (Sun 00:00 UTC) | ✅ |
| Manual Deploy | - | ✅ Only |

---

## Status Checks Required for Merge

**Backend**:
- ✅ lint-and-typecheck
- ✅ build
- ✅ test
- ✅ integration-tests

**Frontend**:
- ✅ lint-and-typecheck
- ✅ build-expo
- ✅ test

**Security**:
- ✅ trivy-scan
- ✅ npm-audit-frontend
- ✅ npm-audit-backend

---

## GitHub Secrets Required

### Essential
- `EXPO_TOKEN` - Expo/EAS authentication
- `CODECOV_TOKEN` - Coverage reporting (optional)

### Backend Deployment
- `STAGING_DATABASE_URL` - PostgreSQL (staging)
- `PRODUCTION_DATABASE_URL` - PostgreSQL (production)
- `STAGING_DEPLOY_KEY` - Deployment credentials
- `DEPLOY_KEY` - Production deployment

### Optional (based on platform)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `DIGITALOCEAN_ACCESS_TOKEN` / `DO_APP_ID`
- `HEROKU_API_KEY`
- `VPS_HOST` / `VPS_USER` / `VPS_SSH_KEY`

---

## Emergency Procedures

### Production Outage
1. Check monitoring and logs
2. Identify recent changes
3. Rollback if needed (see above)
4. Notify team
5. Create incident report

### Secrets Leaked
1. **Immediately** rotate all secrets
2. Update GitHub secrets
3. Revoke compromised credentials
4. Scan for unauthorized access
5. Notify security team

### Main Branch Broken
1. Identify breaking commit: `git log --oneline main`
2. Revert: `git revert <commit-sha>`
3. Or reset (if very recent): `git reset --hard <good-sha>`
4. Push fix
5. Notify team

---

## Build Times

| Workflow | Typical Duration |
|----------|-----------------|
| Backend CI | 5-8 minutes |
| Frontend CI | 4-6 minutes |
| Security Scan | 10-15 minutes |
| Manual Deploy | 10-20 minutes |
| EAS Build | 15-30 minutes |

---

## Coverage Targets

- **Backend**: > 70% line coverage
- **Frontend**: > 60% line coverage

---

## Useful Links

- **Actions**: https://github.com/[org]/NaviKid-v1/actions
- **Security**: https://github.com/[org]/NaviKid-v1/security
- **Codecov**: https://app.codecov.io/gh/[org]/NaviKid-v1
- **Expo Builds**: https://expo.dev/accounts/[account]/projects/navikid/builds

---

## Documentation

- **Full Runbook**: `/docs/CICD_RUNBOOK.md`
- **Setup Guide**: `/docs/CICD_SETUP_GUIDE.md`
- **Implementation Summary**: `/CICD_IMPLEMENTATION_SUMMARY.md`

---

## Support Contacts

- **DevOps Lead**: [Contact]
- **On-Call**: [Contact]
- **Security Team**: [Contact]

---

**Last Updated**: 2025-11-04
