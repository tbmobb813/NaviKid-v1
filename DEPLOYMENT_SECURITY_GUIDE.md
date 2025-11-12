# NaviKid v1 - Production Deployment Security Guide

**Version:** 1.0
**Last Updated:** November 4, 2025
**Audience:** DevOps Engineers, System Administrators, Security Engineers

---

## Table of Contents

1. [Pre-Deployment Security Checklist](#1-pre-deployment-security-checklist)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Security](#3-database-security)
4. [SSL/TLS Configuration](#4-ssltls-configuration)
5. [Network Security](#5-network-security)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Secrets Management](#7-secrets-management)
8. [Backup & Disaster Recovery](#8-backup--disaster-recovery)
9. [Incident Response Procedures](#9-incident-response-procedures)
10. [Post-Deployment Verification](#10-post-deployment-verification)

---

## 1. Pre-Deployment Security Checklist

### Code Security

- [ ] All HIGH and MEDIUM severity security issues resolved
- [ ] `npm audit` shows 0 vulnerabilities (run in both frontend and backend)
- [ ] No hardcoded secrets in code (check with `git grep -E '(password|secret|key|token).*=.*["\']'`)
- [ ] All environment variables properly configured
- [ ] Debug logging disabled (`LOG_LEVEL=warn` or higher)
- [ ] Source code reviewed for security issues
- [ ] Dependencies up to date (`npm outdated`)

### Database Security

- [ ] Database encryption at rest enabled
- [ ] SSL/TLS for database connections enabled
- [ ] Database user has minimal required permissions
- [ ] Database backups configured and tested
- [ ] Connection pooling configured
- [ ] Database firewall rules configured (only backend can connect)

### Infrastructure Security

- [ ] Firewall rules configured (allow only HTTP/HTTPS, SSH with key auth)
- [ ] SSH password authentication disabled
- [ ] System packages updated (`apt update && apt upgrade`)
- [ ] Fail2ban or equivalent installed
- [ ] Intrusion detection system configured (optional)
- [ ] DDoS protection enabled (Cloudflare, AWS Shield, etc.)

### Application Security

- [ ] HTTPS enforced (HTTP -> HTTPS redirect)
- [ ] SSL certificates installed and valid
- [ ] Security headers configured (@fastify/helmet)
- [ ] CORS origins restricted to production domain
- [ ] Rate limiting configured appropriately
- [ ] Error messages sanitized (no stack traces)
- [ ] File upload restrictions (if applicable)
- [ ] Session timeout configured

### Monitoring & Logging

- [ ] Application monitoring configured (Sentry, New Relic, etc.)
- [ ] Log aggregation configured (CloudWatch, ELK, etc.)
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot, etc.)
- [ ] Security event alerts configured
- [ ] Disk space monitoring configured
- [ ] Performance monitoring configured

### Compliance

- [ ] Privacy policy published and accessible
- [ ] Terms of service published
- [ ] COPPA compliance verified (parental consent flow)
- [ ] GDPR compliance verified (data export, deletion)
- [ ] Data retention policy implemented (30-day cleanup)
- [ ] Audit logging enabled
- [ ] Incident response plan documented

---

## 2. Environment Configuration

### Backend Environment Variables

Create `/home/nixstation-remote/tbmobb813/NaviKid-v1/backend/.env` in production:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration (PostgreSQL)
DB_HOST=<YOUR_RDS_ENDPOINT>
DB_PORT=5432
DB_NAME=navikid_production
DB_USER=navikid_app
DB_PASSWORD=<STRONG_PASSWORD_FROM_SECRETS_MANAGER>
DB_SSL=true

# Redis Configuration
REDIS_HOST=<YOUR_ELASTICACHE_ENDPOINT>
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_AUTH_TOKEN>
REDIS_DB=0

# JWT Configuration
# CRITICAL: Use cryptographically secure random strings (64+ characters)
# Generate with: openssl rand -base64 64
JWT_ACCESS_SECRET=<GENERATE_STRONG_SECRET>
JWT_REFRESH_SECRET=<GENERATE_DIFFERENT_STRONG_SECRET>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Sentry Configuration (Error Monitoring)
SENTRY_DSN=https://<YOUR_SENTRY_DSN>@sentry.io/<PROJECT_ID>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Data Retention (COPPA Compliance)
LOCATION_RETENTION_DAYS=30

# CORS Configuration
CORS_ORIGIN=https://app.navikid.com,https://www.navikid.com

# Logging
LOG_LEVEL=warn
LOG_PRETTY=false
```

### Frontend Environment Variables

Create `/home/nixstation-remote/tbmobb813/NaviKid-v1/.env.production`:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.navikid.com
EXPO_PUBLIC_API_TIMEOUT=15000

# WebSocket Configuration
EXPO_PUBLIC_WS_URL=wss://api.navikid.com/ws

# Sentry Configuration
EXPO_PUBLIC_SENTRY_DSN=https://<YOUR_SENTRY_DSN>@sentry.io/<PROJECT_ID>

# Feature Flags (optional)
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_DEBUG=false
```

### Generating Strong Secrets

**DO NOT USE DEFAULT OR WEAK SECRETS IN PRODUCTION**

```bash
# Generate JWT Access Secret
openssl rand -base64 64

# Generate JWT Refresh Secret (MUST be different)
openssl rand -base64 64

# Generate Database Password
openssl rand -base64 32

# Generate Redis Password
openssl rand -base64 32
```

### Environment Variable Validation

Add this to `backend/src/config/index.ts`:

```typescript
// Production security checks
if (process.env.NODE_ENV === 'production') {
  const requiredSecrets = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_PASSWORD',
  ];

  for (const secret of requiredSecrets) {
    const value = process.env[secret];
    if (!value || value.includes('change-me') || value.includes('default')) {
      throw new Error(`FATAL: ${secret} not configured properly for production`);
    }
    if (value.length < 32) {
      throw new Error(`FATAL: ${secret} is too short (minimum 32 characters)`);
    }
  }

  // Verify JWT secrets are different
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL: JWT access and refresh secrets must be different');
  }

  // Verify CORS is restricted
  if (process.env.CORS_ORIGIN?.includes('*')) {
    throw new Error('FATAL: CORS wildcard not allowed in production');
  }

  // Verify DB SSL is enabled
  if (process.env.DB_SSL !== 'true') {
    console.warn('WARNING: Database SSL is not enabled');
  }
}
```

---

## 3. Database Security

### PostgreSQL Configuration

#### Enable SSL/TLS

Edit `postgresql.conf`:

```conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
ssl_ca_file = '/path/to/ca.crt'

# Require SSL for all connections
ssl_min_protocol_version = 'TLSv1.2'
```

Edit `pg_hba.conf` to require SSL:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
hostssl navikid_production navikid_app 10.0.0.0/16              md5
# Reject non-SSL connections
hostnossl all all 0.0.0.0/0 reject
```

#### Enable Encryption at Rest

**AWS RDS:**
```bash
# Enable encryption when creating RDS instance
aws rds create-db-instance \
  --db-instance-identifier navikid-prod \
  --storage-encrypted \
  --kms-key-id <your-kms-key-id> \
  ...
```

**Self-Hosted PostgreSQL:**
```bash
# Use encrypted file system (LUKS, dm-crypt)
# Or use pgcrypto for field-level encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

#### Create Database User with Minimal Permissions

```sql
-- Create application user
CREATE USER navikid_app WITH PASSWORD '<STRONG_PASSWORD>';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE navikid_production TO navikid_app;
GRANT USAGE ON SCHEMA public TO navikid_app;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO navikid_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO navikid_app;

-- DO NOT grant:
-- - SUPERUSER
-- - CREATE DATABASE
-- - CREATE ROLE
-- - REPLICATION

-- Verify permissions
\du navikid_app
```

#### Configure Connection Pooling

```typescript
// backend/src/database/index.ts
this.pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: {
    rejectUnauthorized: true,  // IMPORTANT: Enable certificate validation
    ca: fs.readFileSync('/path/to/ca-cert.pem').toString(),
  },
  max: 20,                      // Maximum pool size
  min: 5,                       // Minimum pool size
  idleTimeoutMillis: 30000,     // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Fail fast on connection issues
  statement_timeout: 30000,     // Query timeout (30 seconds)
});
```

#### Automated Backups

**AWS RDS:**
```bash
# Enable automated backups (7-day retention)
aws rds modify-db-instance \
  --db-instance-identifier navikid-prod \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

**Self-Hosted:**
```bash
#!/bin/bash
# /etc/cron.daily/pg_backup.sh

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/navikid_$DATE.sql.gz"

# Create backup
pg_dump -h localhost -U postgres navikid_production | gzip > $BACKUP_FILE

# Encrypt backup
gpg --encrypt --recipient security@navikid.com $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gpg s3://navikid-backups/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz*" -mtime +7 -delete
```

---

## 4. SSL/TLS Configuration

### Obtain SSL Certificate

**Option 1: Let's Encrypt (Free)**

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d api.navikid.com

# Certificates will be in:
# /etc/letsencrypt/live/api.navikid.com/fullchain.pem
# /etc/letsencrypt/live/api.navikid.com/privkey.pem
```

**Option 2: AWS Certificate Manager (ACM)**

Use ACM with Application Load Balancer for free SSL certificates.

### Configure HTTPS in Backend

**Option 1: HTTPS in Fastify (Development/Testing)**

```typescript
// backend/src/index.ts
import fs from 'fs';
import https from 'https';

const fastify = Fastify({
  logger: false,
  trustProxy: true,
  https: {
    key: fs.readFileSync('/etc/letsencrypt/live/api.navikid.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api.navikid.com/fullchain.pem'),
  },
});

await fastify.listen({ port: 443, host: '0.0.0.0' });
```

**Option 2: Nginx Reverse Proxy (Recommended)**

```nginx
# /etc/nginx/sites-available/navikid

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.navikid.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name api.navikid.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.navikid.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.navikid.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting (additional layer)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy to backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400; # 24 hours for WebSocket
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/navikid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Auto-Renew SSL Certificates

```bash
# Add to crontab
sudo crontab -e

# Renew certificates twice daily (Let's Encrypt recommended)
0 0,12 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

---

## 5. Network Security

### Firewall Configuration (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (with rate limiting)
sudo ufw limit 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from backend server (if separate)
sudo ufw allow from 10.0.1.10 to any port 5432 proto tcp

# Allow Redis only from backend server (if separate)
sudo ufw allow from 10.0.1.10 to any port 6379 proto tcp

# Deny all other incoming traffic
sudo ufw default deny incoming

# Allow all outgoing traffic
sudo ufw default allow outgoing

# Check status
sudo ufw status verbose
```

### Security Groups (AWS)

**Backend EC2 Security Group:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| HTTP | TCP | 80 | 0.0.0.0/0 | Allow HTTP (redirect to HTTPS) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Allow HTTPS |
| SSH | TCP | 22 | YOUR_IP/32 | SSH access (restricted IP) |
| Custom TCP | TCP | 3000 | ALB Security Group | Backend from load balancer |

**RDS Security Group:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| PostgreSQL | TCP | 5432 | Backend SG | Allow backend to database |

**ElastiCache Security Group:**

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| Redis | TCP | 6379 | Backend SG | Allow backend to Redis |

### DDoS Protection

**Cloudflare (Recommended):**
1. Add domain to Cloudflare
2. Update DNS to point to Cloudflare
3. Enable "Under Attack Mode" if needed
4. Configure rate limiting rules
5. Enable WAF (Web Application Firewall)

**AWS Shield:**
- AWS Shield Standard: Enabled by default (free)
- AWS Shield Advanced: $3000/month (optional, for large-scale DDoS)

---

## 6. Monitoring & Logging

### Application Monitoring (Sentry)

```typescript
// backend/src/index.ts
import * as Sentry from '@sentry/node';

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    tracesSampleRate: config.sentry.tracesSampleRate,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    },
  });
}

// Error handler integration
fastify.setErrorHandler((error, request, reply) => {
  Sentry.captureException(error);
  // ... rest of error handling
});
```

### Log Aggregation

**CloudWatch Logs (AWS):**

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure log collection
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/navikid/app.log",
            "log_group_name": "/navikid/production/app",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/navikid/production/nginx",
            "log_stream_name": "access"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/navikid/production/nginx",
            "log_stream_name": "error"
          }
        ]
      }
    }
  }
}
EOF

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### Security Event Alerts

**CloudWatch Alarms:**

```bash
# Failed login attempts (>10 in 5 minutes)
aws cloudwatch put-metric-alarm \
  --alarm-name navikid-failed-logins \
  --alarm-description "Alert on excessive failed login attempts" \
  --metric-name FailedLoginAttempts \
  --namespace NaviKid/Security \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:security-alerts

# Rate limit violations
aws cloudwatch put-metric-alarm \
  --alarm-name navikid-rate-limit-violations \
  --metric-name RateLimitViolations \
  --namespace NaviKid/Security \
  --statistic Sum \
  --period 300 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:security-alerts
```

### Uptime Monitoring

**UptimeRobot Configuration:**

1. Add HTTP(S) Monitor
   - URL: https://api.navikid.com/health
   - Interval: 5 minutes
   - Alert contacts: security@navikid.com, devops@navikid.com

2. Add Keyword Monitor
   - URL: https://api.navikid.com/health
   - Keyword: "healthy"
   - Alert if keyword not found

---

## 7. Secrets Management

### AWS Secrets Manager (Recommended)

```bash
# Store JWT access secret
aws secretsmanager create-secret \
  --name navikid/production/jwt-access-secret \
  --secret-string "$(openssl rand -base64 64)"

# Store JWT refresh secret
aws secretsmanager create-secret \
  --name navikid/production/jwt-refresh-secret \
  --secret-string "$(openssl rand -base64 64)"

# Store database credentials
aws secretsmanager create-secret \
  --name navikid/production/db-credentials \
  --secret-string '{
    "username": "navikid_app",
    "password": "'"$(openssl rand -base64 32)"'",
    "host": "navikid-prod.abcdef.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "navikid_production"
  }'
```

**Load secrets in application:**

```typescript
// backend/src/config/secrets.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });

export async function loadSecrets() {
  if (process.env.NODE_ENV !== 'production') {
    return; // Use .env in development
  }

  try {
    // Load JWT secrets
    const jwtAccessSecret = await client.getSecretValue({
      SecretId: 'navikid/production/jwt-access-secret',
    });
    process.env.JWT_ACCESS_SECRET = jwtAccessSecret.SecretString;

    const jwtRefreshSecret = await client.getSecretValue({
      SecretId: 'navikid/production/jwt-refresh-secret',
    });
    process.env.JWT_REFRESH_SECRET = jwtRefreshSecret.SecretString;

    // Load database credentials
    const dbCreds = await client.getSecretValue({
      SecretId: 'navikid/production/db-credentials',
    });
    const creds = JSON.parse(dbCreds.SecretString!);

    process.env.DB_HOST = creds.host;
    process.env.DB_USER = creds.username;
    process.env.DB_PASSWORD = creds.password;
    process.env.DB_NAME = creds.database;

    logger.info('Secrets loaded from AWS Secrets Manager');
  } catch (error) {
    logger.error('Failed to load secrets', error);
    process.exit(1);
  }
}
```

**Update backend startup:**

```typescript
// backend/src/index.ts
import { loadSecrets } from './config/secrets';

async function start() {
  // Load secrets before starting server
  await loadSecrets();

  // ... rest of startup
}
```

### Secret Rotation

```bash
# Rotate JWT secrets (schedule quarterly)
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# 2. Update in Secrets Manager
aws secretsmanager update-secret \
  --secret-id navikid/production/jwt-access-secret \
  --secret-string "$NEW_SECRET"

# 3. Rolling restart backend instances to load new secret
# (Kubernetes: kubectl rollout restart deployment navikid-backend)
# (EC2: Auto Scaling Group rolling replacement)

# 4. Wait for all instances to reload (15 minutes)

# 5. Old tokens will expire naturally after 15m (access token expiry)
```

---

## 8. Backup & Disaster Recovery

### Database Backups

**Automated Daily Backups:**

```bash
#!/bin/bash
# /opt/navikid/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/var/backups/navikid"
S3_BUCKET="s3://navikid-backups-prod"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# PostgreSQL backup
echo "Starting database backup..."
pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d navikid_production \
  --format=custom \
  --file="$BACKUP_DIR/db_$DATE.dump"

# Compress backup
gzip "$BACKUP_DIR/db_$DATE.dump"

# Encrypt backup
gpg --encrypt --recipient security@navikid.com \
  "$BACKUP_DIR/db_$DATE.dump.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/db_$DATE.dump.gz.gpg" \
  "$S3_BUCKET/database/" \
  --server-side-encryption AES256

# Clean up local files
rm "$BACKUP_DIR/db_$DATE.dump.gz"*

# Delete old backups from S3 (older than RETENTION_DAYS)
aws s3 ls "$S3_BUCKET/database/" | \
  awk '{print $4}' | \
  while read file; do
    file_date=$(echo $file | grep -oP '\d{8}')
    if [ ! -z "$file_date" ]; then
      age_days=$(( ($(date +%s) - $(date -d "$file_date" +%s)) / 86400 ))
      if [ $age_days -gt $RETENTION_DAYS ]; then
        echo "Deleting old backup: $file"
        aws s3 rm "$S3_BUCKET/database/$file"
      fi
    fi
  done

echo "Backup completed successfully"
```

**Schedule backup:**

```bash
# Add to crontab
sudo crontab -e

# Run daily at 3 AM
0 3 * * * /opt/navikid/scripts/backup.sh >> /var/log/navikid/backup.log 2>&1
```

### Redis Snapshots

**Enable Redis persistence:**

```conf
# /etc/redis/redis.conf

# RDB snapshots
save 900 1      # After 900 sec (15 min) if at least 1 key changed
save 300 10     # After 300 sec (5 min) if at least 10 keys changed
save 60 10000   # After 60 sec if at least 10000 keys changed

# Snapshot file location
dir /var/lib/redis
dbfilename dump.rdb

# Enable AOF for better durability
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

**Backup Redis data:**

```bash
#!/bin/bash
# Backup Redis RDB snapshot

DATE=$(date +%Y%m%d_%H%M%S)
cp /var/lib/redis/dump.rdb "/var/backups/navikid/redis_$DATE.rdb"
gzip "/var/backups/navikid/redis_$DATE.rdb"
aws s3 cp "/var/backups/navikid/redis_$DATE.rdb.gz" \
  s3://navikid-backups-prod/redis/
```

### Disaster Recovery Plan

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours

**Disaster Recovery Steps:**

1. **Database Restoration:**
```bash
# Download latest backup from S3
aws s3 cp s3://navikid-backups-prod/database/db_latest.dump.gz.gpg ./

# Decrypt backup
gpg --decrypt db_latest.dump.gz.gpg > db_latest.dump.gz

# Decompress
gunzip db_latest.dump.gz

# Restore to PostgreSQL
pg_restore \
  -h $NEW_DB_HOST \
  -U postgres \
  -d navikid_production \
  --clean \
  --if-exists \
  db_latest.dump

# Run migrations if needed
cd /opt/navikid/backend
npm run db:migrate
```

2. **Application Deployment:**
```bash
# Pull latest code
git clone https://github.com/navikid/backend.git
cd backend

# Install dependencies
npm ci --production

# Load secrets
export $(cat .env.production | xargs)

# Start application
npm run start
```

3. **Verify restoration:**
```bash
# Health check
curl https://api.navikid.com/health

# Test authentication
curl -X POST https://api.navikid.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'

# Check database connectivity
psql -h $DB_HOST -U navikid_app -d navikid_production -c "SELECT COUNT(*) FROM users;"
```

---

## 9. Incident Response Procedures

### Security Incident Types

1. **Data Breach** - Unauthorized access to user data
2. **Authentication Bypass** - Vulnerability allowing unauthorized access
3. **DDoS Attack** - Service disruption due to traffic flood
4. **SQL Injection** - Successful database attack
5. **Account Compromise** - User account takeover
6. **Service Outage** - Production downtime

### Incident Response Team

- **Incident Commander:** [Name] - +1-XXX-XXX-XXXX
- **Technical Lead:** [Name] - +1-XXX-XXX-XXXX
- **Security Lead:** [Name] - +1-XXX-XXX-XXXX
- **Legal/Compliance:** [Name] - +1-XXX-XXX-XXXX
- **Communications:** [Name] - +1-XXX-XXX-XXXX

### Incident Response Workflow

```
1. DETECT
   ├─> Monitoring alerts
   ├─> User reports
   └─> Security scan findings

2. ASSESS
   ├─> Severity (Critical/High/Medium/Low)
   ├─> Impact (Users affected, data exposed)
   └─> Containment urgency

3. CONTAIN
   ├─> Isolate affected systems
   ├─> Block malicious IPs
   ├─> Revoke compromised credentials
   └─> Enable "Under Attack" mode

4. INVESTIGATE
   ├─> Review logs (CloudWatch, Nginx, Application)
   ├─> Identify attack vector
   ├─> Determine data exposure
   └─> Document timeline

5. ERADICATE
   ├─> Patch vulnerabilities
   ├─> Remove malicious access
   ├─> Update firewall rules
   └─> Rotate compromised credentials

6. RECOVER
   ├─> Restore from backups if needed
   ├─> Verify system integrity
   ├─> Monitor for recurrence
   └─> Gradual service restoration

7. NOTIFY
   ├─> GDPR: Within 72 hours
   ├─> CCPA: Without unreasonable delay
   ├─> COPPA: FTC notification if children affected
   └─> Affected users

8. POST-MORTEM
   ├─> Root cause analysis
   ├─> Timeline documentation
   ├─> Lessons learned
   └─> Preventive measures
```

### Data Breach Response

**Within 1 Hour:**

1. Confirm breach
2. Activate incident response team
3. Begin containment (block access, isolate systems)
4. Preserve evidence (logs, snapshots)

**Within 24 Hours:**

5. Complete investigation
6. Determine scope (users affected, data exposed)
7. Implement remediation
8. Prepare notification templates

**Within 72 Hours (GDPR Requirement):**

9. Notify supervisory authority (if EU users affected)
10. Notify affected users
11. Post incident update (if public notification required)

**Within 7 Days:**

12. Complete post-mortem
13. Implement preventive measures
14. Update security documentation

### Notification Templates

**Data Breach Email Template:**

```
Subject: Important Security Notice - NaviKid Data Incident

Dear NaviKid User,

We are writing to inform you of a security incident that may have affected your account.

WHAT HAPPENED:
On [DATE], we discovered that [BRIEF DESCRIPTION]. We immediately took steps to secure our systems and investigate the incident.

WHAT INFORMATION WAS INVOLVED:
[LIST SPECIFIC DATA: email addresses, location history dates, etc.]
[CLARIFY WHAT WAS NOT AFFECTED: passwords were NOT exposed, payment information was NOT affected]

WHAT WE ARE DOING:
- We have [REMEDIATION ACTIONS]
- We are working with [SECURITY EXPERTS / LAW ENFORCEMENT]
- We have implemented [PREVENTIVE MEASURES]

WHAT YOU SHOULD DO:
- Change your password immediately: [LINK]
- Enable two-factor authentication (if available)
- Monitor your account for suspicious activity
- Contact us if you notice anything unusual

We sincerely apologize for this incident and any inconvenience it may cause.

For more information, please visit: https://navikid.com/security-incident
Contact: security@navikid.com | +1-XXX-XXX-XXXX

Sincerely,
NaviKid Security Team
```

---

## 10. Post-Deployment Verification

### Security Verification Checklist

```bash
#!/bin/bash
# security-check.sh - Run after deployment

echo "=== NaviKid Production Security Verification ==="

# 1. SSL/TLS Check
echo "\n[1/10] Checking SSL/TLS..."
curl -I https://api.navikid.com | grep -i "strict-transport-security"

# 2. Security Headers
echo "\n[2/10] Checking security headers..."
curl -I https://api.navikid.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

# 3. HTTPS Redirect
echo "\n[3/10] Checking HTTP to HTTPS redirect..."
curl -I http://api.navikid.com | grep "301\|302"

# 4. Health Check
echo "\n[4/10] Checking application health..."
curl https://api.navikid.com/health

# 5. Authentication
echo "\n[5/10] Checking authentication requirement..."
curl -I https://api.navikid.com/locations | grep "401"

# 6. CORS
echo "\n[6/10] Checking CORS configuration..."
curl -I -H "Origin: https://evil.com" https://api.navikid.com

# 7. Rate Limiting
echo "\n[7/10] Checking rate limiting..."
for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.navikid.com/health
done | tail -5

# 8. Database Connection
echo "\n[8/10] Checking database connectivity..."
# (Run from backend server)
psql -h $DB_HOST -U navikid_app -d navikid_production -c "SELECT 1;" > /dev/null 2>&1
echo "Database: $?"

# 9. Redis Connection
echo "\n[9/10] Checking Redis connectivity..."
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD ping

# 10. Sentry Integration
echo "\n[10/10] Checking error monitoring..."
# (Check Sentry dashboard for recent events)

echo "\n=== Verification Complete ==="
```

### Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.navikid.com/health

# WebSocket connection test
wscat -c wss://api.navikid.com/ws/locations

# Database query performance
psql -h $DB_HOST -U navikid_app -d navikid_production \
  -c "EXPLAIN ANALYZE SELECT * FROM locations WHERE user_id = 'test-uuid' ORDER BY timestamp DESC LIMIT 100;"
```

### Security Scanning

```bash
# OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.navikid.com

# Nmap port scan
nmap -sV -sC api.navikid.com

# SSL Labs scan
https://www.ssllabs.com/ssltest/analyze.html?d=api.navikid.com
```

---

## Emergency Contacts

**Security Incidents:**
- Email: security@navikid.com
- Phone: +1-XXX-XXX-XXXX (24/7 on-call)
- Slack: #security-incidents

**Infrastructure Issues:**
- Email: devops@navikid.com
- Phone: +1-XXX-XXX-XXXX
- Slack: #devops

**Legal/Compliance:**
- Email: legal@navikid.com
- Phone: +1-XXX-XXX-XXXX

---

**Document Version:** 1.0
**Last Updated:** November 4, 2025
**Next Review:** February 4, 2026

**END OF DEPLOYMENT SECURITY GUIDE**
