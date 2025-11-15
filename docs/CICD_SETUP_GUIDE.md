# CI/CD Setup Guide for NaviKid

Complete guide to set up the CI/CD pipeline for NaviKid from scratch.

## Prerequisites

Before setting up CI/CD, ensure you have:

- [ ] GitHub repository with admin access
- [ ] Expo/EAS account with active subscription
- [ ] Codecov account (optional but recommended)
- [ ] Cloud hosting provider account (AWS/Digital Ocean/Heroku/Railway/VPS)
- [ ] Database hosting (PostgreSQL)
- [ ] Redis hosting
- [ ] Domain names configured

---

## Step 1: Configure GitHub Repository

### 1.1 Enable GitHub Actions

1. Go to repository **Settings**
2. Navigate to **Actions** → **General**
3. Under **Actions permissions**, select:
   - ✅ **Allow all actions and reusable workflows**
4. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 1.2 Create GitHub Environments

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Create three environments:

**Staging Environment**:

- Name: `staging`
- No required reviewers
- No deployment branches restrictions

**Production Environment**:

- Name: `production`
- Required reviewers: Add 2 team members
- Deployment branches: Only `main` branch
- Wait timer: 0 minutes (optional: add delay)

---

## Step 2: Configure GitHub Secrets

### 2.1 Essential Secrets

Navigate to **Settings** → **Secrets and variables** → **Actions**

Click **New repository secret** and add:

#### Expo/EAS Token

1. Generate token:
   ```bash
   npx expo login
   # Visit: https://expo.dev/accounts/[account]/settings/access-tokens
   ```
2. Create token with **Read and write** permissions
3. Add to GitHub:
   - Name: `EXPO_TOKEN`
   - Secret: `[paste token]`

#### Codecov Token (Optional)

1. Visit https://codecov.io/
2. Sign up with GitHub account
3. Add your repository
4. Copy token from Settings
5. Add to GitHub:
   - Name: `CODECOV_TOKEN`
   - Secret: `[paste token]`

### 2.2 Backend Deployment Secrets

Add these secrets based on your deployment method:

#### For All Deployments

```
STAGING_DATABASE_URL
PRODUCTION_DATABASE_URL
STAGING_DEPLOY_KEY
DEPLOY_KEY
```

#### AWS Deployment

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCOUNT_ID
```

Generate AWS credentials:

```bash
# Create IAM user with programmatic access
# Attach policies: AmazonECS_FullAccess, AmazonEC2ContainerRegistryFullAccess
# Copy Access Key ID and Secret Access Key
```

#### Digital Ocean Deployment

```
DO_APP_ID
DIGITALOCEAN_ACCESS_TOKEN
```

Generate DO token:

```bash
# Visit: https://cloud.digitalocean.com/account/api/tokens
# Create new token with read/write scope
```

#### Heroku Deployment

```
HEROKU_API_KEY
```

Get Heroku API key:

```bash
heroku auth:token
```

#### VPS Deployment

```
VPS_HOST=your-server.com
VPS_USER=deploy
VPS_SSH_KEY=[paste private key]
```

Generate SSH key:

```bash
ssh-keygen -t ed25519 -C "github-actions@navikid"
# Add public key to VPS: ~/.ssh/authorized_keys
# Copy private key to GitHub secret
```

### 2.3 Environment-Specific Secrets

Create separate secrets for staging and production:

**Staging Secrets**:

```
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/navikid_staging
STAGING_REDIS_URL=redis://host:6379
STAGING_JWT_SECRET=[generate with: openssl rand -hex 32]
STAGING_DEPLOY_KEY=[staging deployment key]
```

**Production Secrets**:

```
PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/navikid_production
PRODUCTION_REDIS_URL=redis://host:6379
PRODUCTION_JWT_SECRET=[generate with: openssl rand -hex 32]
DEPLOY_KEY=[production deployment key]
```

### 2.4 Optional Notification Secrets

```
SLACK_WEBHOOK=[your webhook URL]
SENTRY_DSN=[your Sentry DSN]
```

---

## Step 3: Configure Branch Protection Rules

### 3.1 Main Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add rule** or edit existing `main` rule
3. Branch name pattern: `main`
4. Configure:

**Required Settings**:

- ✅ Require a pull request before merging
  - Required approvals: `2`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Add status checks (search for):
    - `lint-and-typecheck` (Frontend CI)
    - `lint-and-typecheck` (Backend CI)
    - `test` (Frontend CI)
    - `test` (Backend CI)
    - `integration-tests` (Backend CI)
    - `build` (Backend CI)
    - `build-expo` (Frontend CI)
- ✅ Require conversation resolution before merging
- ✅ Require linear history

**Optional (Recommended)**:

- ✅ Require signed commits
- ✅ Include administrators
- ✅ Restrict pushes that create matching branches
- ✅ Allow force pushes: OFF
- ✅ Allow deletions: OFF

5. Click **Create** or **Save changes**

### 3.2 Develop Branch Protection

1. Add another rule for `develop`
2. Configure (lighter requirements):

- ✅ Require a pull request before merging
  - Required approvals: `1`
- ✅ Require status checks to pass before merging
  - Add: `lint-and-typecheck`, `test` (both frontend and backend)
- ✅ Require conversation resolution before merging

---

## Step 4: Set Up Backend Infrastructure

### 4.1 Database Setup

**PostgreSQL** (choose one):

**Option A: Managed Service (Recommended)**

- AWS RDS: https://aws.amazon.com/rds/postgresql/
- Digital Ocean Managed Databases: https://www.digitalocean.com/products/managed-databases
- Supabase: https://supabase.com/
- Neon: https://neon.tech/

**Option B: Self-Hosted**

```bash
# On your VPS
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb navikid_staging
sudo -u postgres createdb navikid_production
```

**Create database user**:

```sql
CREATE USER navikid WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE navikid_staging TO navikid;
GRANT ALL PRIVILEGES ON DATABASE navikid_production TO navikid;
```

### 4.2 Redis Setup

**Option A: Managed Service**

- Redis Cloud: https://redis.com/try-free/
- AWS ElastiCache: https://aws.amazon.com/elasticache/
- Upstash: https://upstash.com/

**Option B: Self-Hosted**

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 4.3 Create Dockerfile for Backend

Check if `/home/nixstation-remote/tbmobb813/NaviKid-v1/backend/Dockerfile` exists, if not create:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

### 4.4 Configure Backend Deployment

Choose your deployment method and configure:

**AWS ECS/Fargate**:

1. Create ECS cluster
2. Create task definition
3. Create service
4. Configure load balancer
5. Set environment variables in task definition

**Digital Ocean App Platform**:

1. Connect repository
2. Configure build/run commands
3. Set environment variables
4. Configure health checks

**Heroku**:

```bash
# Create apps
heroku create navikid-backend-staging
heroku create navikid-backend-production

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini -a navikid-backend-staging
heroku addons:create heroku-postgresql:standard-0 -a navikid-backend-production

# Add Redis
heroku addons:create heroku-redis:mini -a navikid-backend-staging
heroku addons:create heroku-redis:premium-0 -a navikid-backend-production
```

---

## Step 5: Configure Expo/EAS for Frontend

### 5.1 Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 5.2 Configure Project

```bash
cd /home/nixstation-remote/tbmobb813/NaviKid-v1
eas build:configure
```

### 5.3 Update `eas.json`

Ensure your `eas.json` has proper profiles:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "staging": {
      "distribution": "internal",
      "channel": "staging",
      "env": {
        "API_URL": "https://staging-api.navikid.app"
      }
    },
    "production": {
      "channel": "production",
      "env": {
        "API_URL": "https://api.navikid.app"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./android/service-account.json"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234"
      }
    }
  }
}
```

### 5.4 Configure App Credentials

**iOS**:

```bash
eas credentials:configure -p ios
# Follow prompts to set up Apple certificates
```

**Android**:

```bash
eas credentials:configure -p android
# Follow prompts to set up keystore
```

---

## Step 6: Test Workflows Locally

### 6.1 Install Dependencies

```bash
# Frontend
npm ci

# Backend
cd backend
npm ci
cd ..
```

### 6.2 Run Linting and Type Checking

```bash
# Frontend
npm run lint
npm run typecheck
npm run format:check

# Backend
cd backend
npm run lint
npm run typecheck
npm run format:check
cd ..
```

### 6.3 Run Tests

```bash
# Frontend
npm run test

# Backend (requires local PostgreSQL and Redis)
cd backend
npm run test
cd ..
```

### 6.4 Test Build

```bash
# Frontend
npx expo config --type public

# Backend
cd backend
npm run build
cd ..
```

---

## Step 7: Trigger First CI/CD Run

### 7.1 Create Test Branch

```bash
git checkout -b ci/test-pipeline
```

### 7.2 Make Small Change

```bash
echo "# CI/CD Pipeline Active" >> docs/CI_STATUS.md
git add docs/CI_STATUS.md
git commit -m "test: trigger CI/CD pipeline"
git push origin ci/test-pipeline
```

### 7.3 Create Pull Request

1. Go to GitHub repository
2. Click **Pull requests** → **New pull request**
3. Base: `main`, Compare: `ci/test-pipeline`
4. Create pull request
5. Watch CI/CD workflows run

### 7.4 Monitor Workflows

1. Go to **Actions** tab
2. You should see:
   - Backend CI/CD
   - Frontend CI/CD
   - Security Scanning
3. Click on each to see detailed logs
4. Verify all checks pass (or fix errors)

---

## Step 8: Fix Common Issues

### Issue: Missing Environment Variables

**Error**: `DATABASE_URL is not defined`

**Fix**: Add to GitHub secrets or workflow env section

### Issue: EAS Token Invalid

**Error**: `Expo authentication failed`

**Fix**:

```bash
# Generate new token
npx eas whoami
# Update EXPO_TOKEN secret in GitHub
```

### Issue: Docker Build Failed

**Error**: `Cannot find module`

**Fix**: Check `backend/Dockerfile` paths, ensure all files are copied

### Issue: Tests Failing

**Error**: Various test failures

**Fix**:

```bash
# Run tests locally with same environment
NODE_ENV=test npm run test

# Check for environment-specific issues
# Update tests or workflow configuration
```

---

## Step 9: Configure Monitoring and Alerts

### 9.1 GitHub Notifications

1. Go to **Settings** → **Notifications**
2. Configure:
   - ✅ Email notifications for workflow failures
   - ✅ Actions workflow notifications

### 9.2 Codecov Notifications

1. Go to Codecov repository settings
2. Configure:
   - Coverage threshold: 70% (backend), 60% (frontend)
   - Notifications: Slack/email on coverage drop

### 9.3 Sentry Integration (Optional)

```bash
# Install Sentry
npm install @sentry/react-native

# Configure in app.config.ts
# Add SENTRY_DSN to GitHub secrets
```

---

## Step 10: Document and Train Team

### 10.1 Share Documentation

Ensure team has access to:

- `/home/nixstation-remote/tbmobb813/NaviKid-v1/docs/CICD_RUNBOOK.md`
- `/home/nixstation-remote/tbmobb813/NaviKid-v1/docs/CICD_SETUP_GUIDE.md` (this file)

### 10.2 Deployment Training

Walk team through:

1. How to read CI/CD logs
2. How to trigger manual deployments
3. How to rollback deployments
4. Emergency procedures

### 10.3 Set Up On-Call Rotation

- Assign team members to on-call rotation
- Create runbook for common incidents
- Set up escalation procedures

---

## Verification Checklist

Use this checklist to verify your setup:

### GitHub Actions

- [ ] Backend CI runs on PRs
- [ ] Frontend CI runs on PRs
- [ ] Security scan runs weekly
- [ ] All workflows complete successfully
- [ ] Status checks block merging when failing

### Secrets

- [ ] EXPO_TOKEN configured and valid
- [ ] CODECOV_TOKEN configured (optional)
- [ ] Database URLs configured for staging/production
- [ ] Deployment keys configured
- [ ] All secrets tested (check workflow runs)

### Branch Protection

- [ ] Main branch protected with 2 required approvals
- [ ] Required status checks configured
- [ ] Force push disabled
- [ ] Linear history enforced

### Deployments

- [ ] Staging environment configured
- [ ] Production environment configured with approval
- [ ] Backend deploys to staging on main push
- [ ] Frontend builds for EAS
- [ ] Health checks pass after deployment

### Infrastructure

- [ ] PostgreSQL database accessible
- [ ] Redis accessible
- [ ] Backend can connect to database
- [ ] Environment variables set correctly

### Documentation

- [ ] Team has access to runbooks
- [ ] Deployment procedures documented
- [ ] Emergency contacts listed
- [ ] On-call rotation configured

---

## Next Steps

1. **Run Production Deployment**:
   - Test manual deployment workflow
   - Deploy to staging first
   - Verify everything works
   - Deploy to production

2. **Set Up Monitoring**:
   - Configure application monitoring (Sentry, DataDog, etc.)
   - Set up uptime monitoring (Pingdom, UptimeRobot)
   - Configure log aggregation (CloudWatch, Loggly)

3. **Optimize Pipeline**:
   - Review build times
   - Optimize slow workflows
   - Add caching where beneficial
   - Parallelize independent jobs

4. **Regular Maintenance**:
   - Review and update dependencies monthly
   - Audit security vulnerabilities weekly
   - Review CI/CD metrics monthly
   - Update documentation as needed

---

## Support

If you encounter issues:

1. Check the [CI/CD Runbook](./CICD_RUNBOOK.md) troubleshooting section
2. Review workflow logs in GitHub Actions
3. Check status of external services (Expo, Codecov, etc.)
4. Contact DevOps team

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Codecov Documentation](https://docs.codecov.com/)
- [NaviKid Deployment Security Guide](../DEPLOYMENT_SECURITY_GUIDE.md)

---

**Setup Complete!** 🎉

Your CI/CD pipeline is now configured. Every push will be tested, and deployments are automated. Happy shipping!

---

**Last Updated**: 2025-11-04
**Document Owner**: DevOps Team
