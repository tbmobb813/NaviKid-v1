# NaviKid Infrastructure Setup Guide

## 🚨 Executive Summary

**You were right!** While the frontend code is production-ready (98/100), the **backend infrastructure requires significant setup and deployment work**. Here's what needs to be done:

---

## 📊 Current Infrastructure Status

### ✅ Complete & Ready

- **Frontend (React Native/Expo):** Production-ready, all TODOs resolved
- **Transit Adapter Service:** Fully implemented in `server/` directory
- **CI/CD Workflows:** Comprehensive GitHub Actions workflows exist
- **Database Schema:** PostgreSQL schema defined
- **Docker Configs:** Dockerfiles and compose files ready
- **Kubernetes Manifests:** K8s YAMLs for deployment ready

### ⚠️ **NOT** Complete - Requires Setup

- **Backend API Server:** Configuration exists but NO implementation
- **PostgreSQL Database:** Schema exists but not deployed
- **Redis Cache:** Configuration exists but not deployed
- **Transit Adapter Deployment:** Server code exists but not deployed
- **Environment Variables:** Production values not configured
- **Third-Party Services:** Not configured (Sentry, Plausible, MTA API)
- **Domain/Hosting:** No infrastructure provisioned

---

## 🏗️ Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NaviKid Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐                                        │
│  │  Mobile App      │                                        │
│  │  (React Native)  │                                        │
│  └────────┬─────────┘                                        │
│           │                                                   │
│           ├──────────────────────┬───────────────────────┐   │
│           ↓                      ↓                       ↓   │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────┐   │
│  │ Main Backend   │    │ Transit Adapter│    │ External │   │
│  │ API (Port 3000)│    │ (Port 3001)    │    │ Services │   │
│  │                │    │                │    │          │   │
│  │ • Auth (JWT)   │    │ • GTFS-RT      │    │ • Sentry │   │
│  │ • User Data    │    │ • Feed Cache   │    │ • MTA API│   │
│  │ • Geofencing   │    │ • Enrichment   │    │ • ORS API│   │
│  └────────┬───────┘    └────────┬───────┘    └──────────┘   │
│           │                     │                            │
│           ↓                     ↓                            │
│  ┌────────────────┐    ┌────────────────┐                   │
│  │  PostgreSQL    │    │     Redis      │                   │
│  │  (Main DB)     │    │  (Feed Cache)  │                   │
│  └────────────────┘    └────────────────┘                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔴 Critical Missing Components

### 1. **Main Backend API Server (Port 3000)**

**Status:** ⚠️ **Configuration only - NO implementation exists**

**What Exists:**

- `backend/.env` - Configuration file with database/Redis settings
- `.github/workflows/backend-ci.yml` - CI/CD pipeline ready
- Frontend code expects: `http://localhost:3000/api`

**What's Missing:**

- **NO backend server code** - The `backend/` directory only contains:
  - `.env` (configuration)
  - `package-lock.json` (no package.json!)
- **NO API endpoints** implemented
- **NO authentication handlers**
- **NO database models/migrations**

**Required Implementation:**

```
backend/
├── src/
│   ├── server.ts          # Main Fastify/Express server
│   ├── routes/
│   │   ├── auth.ts        # POST /api/auth/login, /register, /reset-password
│   │   ├── users.ts       # User profile management
│   │   ├── locations.ts   # Location history tracking
│   │   ├── geofences.ts   # Safe zone management
│   │   └── health.ts      # Health check endpoint
│   ├── middleware/
│   │   ├── auth.ts        # JWT verification
│   │   ├── rateLimit.ts   # Rate limiting
│   │   └── errorHandler.ts
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── db/
│       ├── migrations/    # Database migrations
│       └── seeds/         # Test data
├── package.json           # MISSING - needs to be created
├── tsconfig.json          # MISSING
└── Dockerfile             # MISSING
```

**Estimated Work:** 40-60 hours of development

---

### 2. **Transit Adapter Service (Port 3001)**

**Status:** ✅ **Fully implemented** but ⚠️ **NOT deployed**

**What Exists:**

- ✅ Complete Fastify server implementation (`server/index.js`)
- ✅ GTFS-RT protobuf decoder
- ✅ PostgreSQL support with schema
- ✅ Redis cache integration
- ✅ Docker and Kubernetes configs
- ✅ Comprehensive test suite

**What's Needed:**

1. **Database Setup:**

   ```bash
   # Create PostgreSQL database
   createdb transit_adapter

   # Run schema migration
   psql -d transit_adapter -f server/db/schema.sql

   # Import GTFS static data
   cd server
   npm install
   node tools/import-static-gtfs.js
   ```

2. **Environment Configuration:**

   ```bash
   # server/.env
   PORT=3001
   MTA_API_KEY=your_mta_api_key_here
   DATABASE_URL=postgresql://user:pass@localhost:5432/transit_adapter
   REDIS_URL=redis://localhost:6379
   API_AUTH_KEY=your_api_auth_key_here
   JWT_SECRET=your_jwt_secret_here
   ```

3. **Deployment Options:**
   - **Docker:** `docker build -t transit-adapter server/`
   - **Kubernetes:** Use `server/k8s-*.yaml` manifests
   - **Cloud Run:** Direct Docker deploy
   - **VM:** Systemd service + nginx reverse proxy

**Estimated Work:** 4-8 hours (configuration + deployment)

---

### 3. **PostgreSQL Database**

**Status:** ⚠️ **Schema defined** but **NOT provisioned**

**Required Databases:**

1. **Main Database** (`navikid_db`):

   ```sql
   -- User accounts
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL, -- 'parent' or 'child'
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Location history (30-day retention)
   CREATE TABLE location_history (
     id BIGSERIAL PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     latitude DOUBLE PRECISION NOT NULL,
     longitude DOUBLE PRECISION NOT NULL,
     accuracy DOUBLE PRECISION,
     timestamp TIMESTAMP DEFAULT NOW(),
     INDEX idx_user_timestamp (user_id, timestamp)
   );

   -- Safe zones (geofences)
   CREATE TABLE safe_zones (
     id UUID PRIMARY KEY,
     parent_id UUID REFERENCES users(id),
     child_id UUID REFERENCES users(id),
     name VARCHAR(255) NOT NULL,
     latitude DOUBLE PRECISION NOT NULL,
     longitude DOUBLE PRECISION NOT NULL,
     radius DOUBLE PRECISION NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Geofence events
   CREATE TABLE geofence_events (
     id BIGSERIAL PRIMARY KEY,
     safe_zone_id UUID REFERENCES safe_zones(id),
     event_type VARCHAR(10) NOT NULL, -- 'entry' or 'exit'
     timestamp TIMESTAMP DEFAULT NOW(),
     INDEX idx_zone_timestamp (safe_zone_id, timestamp)
   );
   ```

2. **Transit Database** (`transit_adapter`):
   - Schema already defined in `server/db/schema.sql`
   - Tables: `routes`, `trips`, `stops`, `stop_times`, `shapes`

**Hosting Options:**

- **AWS RDS:** Managed PostgreSQL with automated backups
- **Google Cloud SQL:** Fully managed with high availability
- **DigitalOcean Managed Databases:** Cost-effective option
- **Self-hosted:** PostgreSQL 15+ on Ubuntu/Debian VM

**Estimated Work:** 4-6 hours (provisioning + setup + data loading)

---

### 4. **Redis Cache**

**Status:** ⚠️ **NOT provisioned**

**Purpose:**

- Transit feed caching (10-30 second TTL)
- Rate limiting state
- Session management
- Real-time data invalidation

**Configuration:**

```bash
# Production Redis config
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

**Hosting Options:**

- **AWS ElastiCache:** Managed Redis with automatic failover
- **Google Cloud Memorystore:** Fully managed Redis
- **Redis Cloud:** Redis Labs managed service
- **Self-hosted:** Redis 7.x on Ubuntu VM

**Estimated Work:** 2-3 hours (provisioning + configuration)

---

### 5. **Environment Variables & Secrets**

**Status:** ⚠️ **Example files exist** but **production values NOT configured**

**Required Production Configuration:**

**Mobile App (`.env.production`):**

```bash
# API Endpoints
API_URL=https://api.navikid.app
TRANSIT_API_URL=https://transit.navikid.app

# Third-party Services
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
EXPO_PUBLIC_ORS_API_KEY=your_openrouteservice_key
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token (optional)

# Analytics
PLAUSIBLE_ENDPOINT=https://plausible.io/api/event
PLAUSIBLE_SITE_ID=navikid.app
PLAUSIBLE_SHARED_KEY=your_shared_key

# Feature Flags
PERF_TIME_MULTIPLIER=1
```

**Backend API (Production):**

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@db.navikid.app:5432/navikid_db
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=redis://:password@redis.navikid.app:6379/0

# JWT Secrets (MUST GENERATE NEW VALUES)
JWT_ACCESS_SECRET=<generate-256-bit-random-secret>
JWT_REFRESH_SECRET=<generate-256-bit-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.2

# CORS
CORS_ORIGIN=https://navikid.app,exp://navikid.app
```

**Transit Adapter (Production):**

```bash
PORT=3001
NODE_ENV=production

# MTA API (register at https://datamine.mta.info/)
MTA_API_KEY=your_mta_api_key_here

# Database
DATABASE_URL=postgresql://user:pass@db.navikid.app:5432/transit_adapter

# Redis Cache
REDIS_URL=redis://:password@redis.navikid.app:6379/1

# Authentication
API_AUTH_KEY=<generate-random-api-key>
JWT_SECRET=<generate-256-bit-secret>

# Feed Refresh
FEED_REFRESH_ENABLED=true
FEED_REFRESH_INTERVAL_SEC=30
```

**Secret Generation Commands:**

```bash
# Generate JWT secrets (256-bit)
openssl rand -base64 32

# Generate API keys
openssl rand -hex 32

# Generate bcrypt salt
node -e "console.log(require('bcrypt').genSaltSync(12))"
```

**Estimated Work:** 3-4 hours (generation + secure storage + configuration)

---

### 6. **Third-Party Service Registration**

**Status:** ⚠️ **NOT registered/configured**

**Required Services:**

#### A. **Sentry** (Error Tracking)

- **Sign up:** <https://sentry.io/signup/>
- **Create project:** "NaviKid Mobile" (React Native)
- **Get DSN:** Settings → Client Keys
- **Configure:**
  - Release tracking
  - Source maps upload
  - Performance monitoring (20% sample rate)
  - User feedback integration
- **Cost:** Free tier: 5K errors/month, $26/month for 50K

#### B. **MTA API** (Real-time Transit Data)

- **Register:** <https://datamine.mta.info/>
- **Request API key:** Free for development, paid for production
- **Configure feeds:**
  - Subway: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs`
  - Bus: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bus`
- **Rate limits:** 300 requests/5 minutes
- **Cost:** Free for <5K requests/day

#### C. **OpenRouteService** (Routing)

- **Sign up:** <https://openrouteservice.org/sign-up/>
- **Get API key:** Dashboard → API Key
- **Configure:**
  - Profile: `foot-walking`
  - Timeout: 15 seconds
  - Max requests: 2,000/day (free tier)
- **Cost:** Free tier: 2K requests/day, €24/month for 50K

#### D. **Plausible Analytics** (Privacy-focused Analytics)

- **Sign up:** <https://plausible.io/register>
- **Add site:** `navikid.app` (or your domain)
- **Get:**
  - Site ID
  - Shared Key (for goal tracking)
  - API endpoint
- **Configure:**
  - Goals: `geofence_entry`, `geofence_exit`, `route_search`
  - Custom dimensions: `user_type` (parent/child)
- **Cost:** $9/month for 10K pageviews

#### E. **Mapbox** (Optional - Better Maps)

- **Sign up:** <https://account.mapbox.com/auth/signup/>
- **Get access token:** Account → Access Tokens
- **Configure:**
  - Style: Streets, Outdoors, or custom
  - SDK: GL Native for React Native
- **Cost:** Free tier: 50K map loads/month

**Estimated Work:** 4-6 hours (registration + configuration + testing)

---

### 7. **Domain & SSL Certificates**

**Status:** ⚠️ **NOT provisioned**

**Required Domains:**

Main App:        navikid.app (or your domain)
API:             api.navikid.app
Transit Adapter: transit.navikid.app
Admin Dashboard: admin.navikid.app (future)

**SSL Certificate Options:**

1. **Let's Encrypt** (Free, auto-renewal)
2. **AWS Certificate Manager** (Free for AWS resources)
3. **Cloudflare** (Free + DDoS protection)

**DNS Configuration:**

A     navikid.app          → Your CDN/hosting IP
A     api.navikid.app      → Backend server IP
A     transit.navikid.app  → Transit adapter IP
CNAME www.navikid.app      → navikid.app

**Estimated Work:** 2-3 hours (domain purchase + DNS setup + SSL)

---

### 8. **Hosting Infrastructure**

**Status:** ⚠️ **NOT provisioned**

**Recommended Production Setup:**

#### **Option A: AWS (Full-featured)**

- EC2 instances (t3.medium): Backend + Transit Adapter
- RDS PostgreSQL (db.t3.micro): Both databases
- ElastiCache Redis (cache.t3.micro): Cache layer
- S3: Static assets, backups
- CloudFront: CDN for assets
- Route 53: DNS management
- Cost: ~$150-200/month

#### **Option B: Google Cloud Platform (Modern)**

- Cloud Run: Backend + Transit Adapter (serverless)
- Cloud SQL PostgreSQL: Both databases
- Cloud Memorystore Redis: Cache
- Cloud Storage: Backups
- Cloud CDN: Asset delivery
- Cost: ~$120-180/month (pay-per-use)

#### **Option C: DigitalOcean (Cost-effective)**

- Droplets (2x $12/month): Backend + Transit
- Managed Database PostgreSQL ($15/month): Both DBs
- Managed Redis ($15/month): Cache
- Spaces: S3-compatible storage
- Cost: ~$50-70/month

#### **Option D: Kubernetes (Scalable)**

- GKE/EKS/DOKS cluster
- Use existing k8s manifests in server/
- Auto-scaling, load balancing
- Cost: ~$100-150/month (small cluster)

**Estimated Work:** 8-16 hours (provisioning + setup + testing)

---

## 📝 Implementation Checklist

### Phase 1: Backend API Development (Week 1-2)

- [ ] **Create backend package.json** with dependencies
  - Fastify/Express
  - PostgreSQL client (pg)
  - Redis client (ioredis)
  - JWT libraries
  - Validation (zod/joi)
  - Testing (jest)

- [ ] **Implement authentication endpoints**
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - JWT token generation
  - `POST /api/auth/refresh` - Refresh token
  - `POST /api/auth/logout` - Token invalidation
  - `POST /api/auth/reset-password` - Password recovery
  - `POST /api/auth/verify-email` - Email verification

- [ ] **Implement user management**
  - `GET /api/users/me` - Current user profile
  - `PATCH /api/users/me` - Update profile
  - `DELETE /api/users/me` - Account deletion

- [ ] **Implement location tracking**
  - `POST /api/locations` - Store location update
  - `GET /api/locations` - Get location history
  - `DELETE /api/locations/:id` - Delete location

- [ ] **Implement geofencing**
  - `POST /api/safe-zones` - Create safe zone
  - `GET /api/safe-zones` - List safe zones
  - `PATCH /api/safe-zones/:id` - Update safe zone
  - `DELETE /api/safe-zones/:id` - Delete safe zone
  - `GET /api/safe-zones/:id/events` - Event history

- [ ] **Create database migrations**
  - User schema
  - Location schema
  - Geofence schema
  - Indexes and constraints

- [ ] **Add middleware**
  - JWT authentication
  - Rate limiting
  - Error handling
  - Request validation
  - CORS configuration

- [ ] **Write tests**
  - Unit tests for services
  - Integration tests for API
  - E2E tests for critical flows
  - Load tests for performance

### Phase 2: Database Setup (Week 2)

- [ ] **Provision PostgreSQL databases**
  - Main database (`navikid_db`)
  - Transit database (`transit_adapter`)

- [ ] **Run migrations**
  - Main DB schema
  - Transit DB schema (from `server/db/schema.sql`)

- [ ] **Import GTFS data**
  - Download MTA GTFS static files
  - Run `server/tools/import-static-gtfs.js`
  - Verify data integrity

- [ ] **Set up backup strategy**
  - Daily automated backups
  - Point-in-time recovery
  - Backup retention (30 days)

### Phase 3: Redis Setup (Week 2)

- [ ] **Provision Redis instance**
  - Production configuration
  - Persistence enabled
  - Memory limits configured

- [ ] **Configure caching**
  - Transit feed cache (30s TTL)
  - Session cache
  - Rate limit counters

### Phase 4: Transit Adapter Deployment (Week 3)

- [ ] **Configure environment variables**
  - MTA API key
  - Database connection
  - Redis connection
  - API authentication key

- [ ] **Deploy service**
  - Build Docker image
  - Deploy to hosting (K8s/Cloud Run/VM)
  - Configure auto-scaling
  - Set up health checks

- [ ] **Test feeds**
  - Verify MTA subway feed
  - Verify MTA bus feed
  - Test feed enrichment
  - Monitor cache hit rates

### Phase 5: Third-Party Services (Week 3)

- [ ] **Register and configure Sentry**
  - Create projects (mobile + backend)
  - Configure DSNs
  - Set up release tracking
  - Test error reporting

- [ ] **Register and configure MTA API**
  - Get API key
  - Test feed access
  - Monitor rate limits

- [ ] **Register and configure OpenRouteService**
  - Get API key
  - Test routing
  - Monitor quotas

- [ ] **Register and configure Plausible**
  - Add site
  - Configure goals
  - Test event tracking

### Phase 6: Domain & SSL (Week 3)

- [ ] **Purchase domain**
  - Register `navikid.app` (or your choice)

- [ ] **Configure DNS**
  - A records for API endpoints
  - SSL certificates
  - CDN setup

- [ ] **Verify SSL**
  - Test HTTPS on all endpoints
  - Configure certificate auto-renewal

### Phase 7: Backend API Deployment (Week 4)

- [ ] **Build Docker image**
  - Multi-stage build
  - Production optimizations

- [ ] **Deploy to production**
  - Deploy backend API
  - Configure environment
  - Set up monitoring

- [ ] **Configure reverse proxy**
  - Nginx/Traefik configuration
  - Load balancing
  - Rate limiting

### Phase 8: Integration Testing (Week 4)

- [ ] **Test mobile app with production backend**
  - Authentication flow
  - Location tracking
  - Geofencing
  - Transit data

- [ ] **Load testing**
  - Concurrent users simulation
  - API response times
  - Database performance
  - Cache effectiveness

- [ ] **Security testing**
  - Penetration testing
  - Vulnerability scanning
  - Rate limit validation
  - JWT validation

### Phase 9: Monitoring & Observability (Week 4)

- [ ] **Set up application monitoring**
  - Sentry for errors
  - Plausible for analytics
  - Custom dashboards

- [ ] **Set up infrastructure monitoring**
  - Server metrics (CPU, RAM, disk)
  - Database metrics (connections, queries)
  - Redis metrics (cache hit rate)
  - Network metrics (bandwidth, latency)

- [ ] **Configure alerting**
  - Error rate alerts
  - Performance degradation alerts
  - Database connection alerts
  - Certificate expiration alerts

### Phase 10: Documentation (Week 4)

- [ ] **Write API documentation**
  - OpenAPI/Swagger spec
  - Authentication guide
  - Rate limits
  - Error codes

- [ ] **Write deployment documentation**
  - Infrastructure setup guide
  - Deployment procedures
  - Rollback procedures
  - Troubleshooting guide

- [ ] **Write operational runbooks**
  - Incident response
  - Backup and restore
  - Scaling procedures
  - Certificate renewal

---

## 💰 Estimated Costs

### **Development (One-time)**

- Backend API development: $8,000 - $12,000 (80-120 hours @ $100/hr)
- Database schema & migrations: $1,000 - $2,000
- Deployment & DevOps: $2,000 - $3,000
- Testing & QA: $2,000 - $3,000
- **Total Development:** $13,000 - $20,000

### **Infrastructure (Monthly - Option A: AWS)**

- EC2 instances (2x t3.medium): $60
- RDS PostgreSQL: $30
- ElastiCache Redis: $15
- S3 + CloudFront: $20
- Route 53: $5
- Data transfer: $20
- **Total Monthly (AWS):** ~$150/month

### **Infrastructure (Monthly - Option C: DigitalOcean)**

- Droplets (2x $12): $24
- Managed PostgreSQL: $15
- Managed Redis: $15
- Spaces CDN: $5
- **Total Monthly (DO):** ~$60/month

### **Third-Party Services (Monthly)**

- Sentry: $26 (or free tier)
- Plausible Analytics: $9
- MTA API: Free (or $50/month for higher limits)
- OpenRouteService: Free (or €24/month)
- **Total Services:** $35-110/month

### **Grand Total**

- **Initial Investment:** $13,000 - $20,000
- **Monthly Operating Cost:** $95 - $260/month (depending on hosting choice)

---

## ⏱️ Timeline Summary

**Total Implementation Time: 3-4 weeks (120-160 hours)**

- **Week 1:** Backend API development (40 hours)
- **Week 2:** Database + Redis setup + API completion (40 hours)
- **Week 3:** Transit adapter deployment + Third-party services (30 hours)
- **Week 4:** Testing + Monitoring + Documentation (30 hours)

**Critical Path Dependencies:**

1. Backend API development → Database setup
2. Database setup → Backend deployment
3. Backend deployment → Integration testing
4. Integration testing → Production launch

---

## 🎯 Recommended Next Steps

### **Immediate (This Week)**

1. **Create backend package.json** and project structure
2. **Provision PostgreSQL database** (can use DigitalOcean $15/month managed DB for development)
3. **Provision Redis** (can use local Redis for development)
4. **Register for third-party services** (Sentry, MTA API, ORS)

### **Short-term (Next 2 Weeks)**

1. **Implement authentication endpoints** (login, register, JWT)
2. **Implement location tracking endpoints**
3. **Implement geofencing endpoints**
4. **Deploy transit adapter** to staging environment

### **Medium-term (Next 4 Weeks)**

1. **Complete backend API** implementation
2. **Deploy to production** infrastructure
3. **Integration testing** with mobile app
4. **Launch beta** with limited users

---

## 📞 Decision Points

Before proceeding, you need to decide:

1. **Hosting Provider:** AWS, GCP, DigitalOcean, or Kubernetes?
2. **Backend Framework:** Fastify (fast) or Express (familiar)?
3. **ORM or Raw SQL:** TypeORM, Prisma, Sequelize, or pg directly?
4. **Budget:** Full-featured ($150/month) or cost-effective ($60/month)?
5. **Development:** In-house, contractor, or agency?

---

## ✅ What I Can Help With Next

I can immediately help you with:

1. **Generate backend package.json** with all required dependencies
2. **Create backend project structure** (routes, models, services, middleware)
3. **Write database migration files** for PostgreSQL
4. **Generate authentication endpoints** (login, register, JWT handling)
5. **Create Dockerfile and docker-compose.yml** for local development
6. **Write deployment scripts** for your chosen hosting provider
7. **Generate API documentation** (OpenAPI/Swagger)
8. **Create infrastructure-as-code** (Terraform/Pulumi) for automated provisioning

Would you like me to start with any of these tasks?
