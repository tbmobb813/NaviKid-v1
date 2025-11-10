# NaviKid Backend API

Production-ready backend API for the NaviKid child safety application.

## Features

- ✅ JWT-based authentication with refresh tokens
- ✅ User management (parents and children)
- ✅ Parent-child account linking
- ✅ Real-time location tracking
- ✅ Geofencing (safe zones) with event tracking
- ✅ Password reset functionality
- ✅ Email verification
- ✅ PostgreSQL database with migrations
- ✅ Redis caching and session management
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Sentry error tracking
- ✅ Comprehensive API documentation
- ✅ Docker support
- ✅ Health check endpoints

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Fastify 4.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Authentication:** JWT
- **Validation:** Zod
- **Logging:** Pino
- **Error Tracking:** Sentry (optional)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

### Option 1: Docker Compose (Recommended for Development)

1. **Clone and navigate to backend directory:**
```bash
cd backend
```

2. **Start all services:**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000

3. **View logs:**
```bash
docker-compose logs -f backend
```

4. **Stop services:**
```bash
docker-compose down
```

### Option 2: Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL and Redis:**
```bash
# Using Docker:
docker-compose up -d postgres redis

# Or use local installations
```

4. **Run database migrations:**
```bash
npm run migrate
```

5. **Start development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the backend directory:

```bash
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=navikid_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (GENERATE NEW VALUES FOR PRODUCTION!)
JWT_ACCESS_SECRET=your-256-bit-secret-here
JWT_REFRESH_SECRET=your-256-bit-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Sentry (optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Data Retention
LOCATION_RETENTION_DAYS=30

# CORS
CORS_ORIGIN=http://localhost:8081,exp://localhost:8081

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
```

### Generating Secrets

```bash
# Generate JWT secrets (256-bit)
openssl rand -base64 32

# Generate API keys
openssl rand -hex 32
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email/:token` - Verify email address
- `GET /api/auth/me` - Get current user info

### Users

- `GET /api/users/me` - Get user profile
- `PATCH /api/users/me` - Update user profile
- `DELETE /api/users/me` - Deactivate account
- `POST /api/users/change-password` - Change password
- `GET /api/users/children` - Get linked children (parents)
- `GET /api/users/parents` - Get linked parents (children)
- `POST /api/users/link-child` - Link child account
- `DELETE /api/users/unlink-child/:childId` - Unlink child

### Locations

- `POST /api/locations` - Store location update
- `GET /api/locations` - Get location history
- `GET /api/locations/latest/:userId?` - Get latest location
- `DELETE /api/locations/:id` - Delete specific location
- `DELETE /api/locations` - Delete all location history

### Safe Zones (Geofences)

- `POST /api/safe-zones` - Create safe zone
- `GET /api/safe-zones` - Get all safe zones
- `GET /api/safe-zones/:id` - Get specific safe zone
- `PATCH /api/safe-zones/:id` - Update safe zone
- `DELETE /api/safe-zones/:id` - Delete safe zone
- `POST /api/safe-zones/events` - Record geofence event
- `GET /api/safe-zones/:id/events` - Get events for safe zone

### Health

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe

## Database Schema

### Tables

- `users` - User accounts (parents and children)
- `user_relationships` - Parent-child linkages
- `refresh_tokens` - JWT refresh tokens
- `location_history` - Location tracking (30-day retention)
- `safe_zones` - Geofenced safe zones
- `geofence_events` - Safe zone entry/exit events
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification
- `audit_log` - Security audit trail

### Migrations

Migrations are located in `src/db/migrations/` and run automatically on first startup or manually via:

```bash
npm run migrate
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm run start:prod
```

## Docker Deployment

### Build Image

```bash
docker build -t navikid-backend:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379 \
  -e JWT_ACCESS_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-secret \
  navikid-backend:latest
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Generate new JWT secrets** for each environment
3. **Enable Sentry** for error tracking
4. **Set up rate limiting** on your reverse proxy
5. **Use strong passwords** (validated automatically)
6. **Enable email verification** for new accounts
7. **Regular security audits** of dependencies
8. **Database backups** with encrypted storage
9. **Monitor authentication failures** for suspicious activity
10. **Implement IP whitelisting** if possible

## Monitoring

### Health Checks

The API includes comprehensive health checks:

- `/api/health` - Quick health status
- `/api/health/detailed` - Database and Redis status
- `/api/health/ready` - Kubernetes readiness
- `/api/health/live` - Kubernetes liveness

### Logging

All logs are structured JSON (via Pino) and include:
- Request ID
- User ID (if authenticated)
- IP address
- Response time
- Error details

### Metrics

Consider integrating:
- **Prometheus** for metrics collection
- **Grafana** for dashboards
- **Sentry** for error tracking
- **DataDog** or **New Relic** for APM

## Data Retention

Automated cleanup functions run daily:

- Location history: 30 days
- Geofence events: 90 days
- Expired tokens: Immediate
- Audit logs: 1 year

Configure retention periods via environment variables.

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
psql -h localhost -U postgres -d navikid_db
```

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
```

### Migration Errors

```bash
# Reset database (DANGER: Deletes all data)
psql -h localhost -U postgres -d navikid_db < src/db/migrations/001_initial_schema.sql
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Run linter before committing
5. Use conventional commits

## License

UNLICENSED - Private

## Support

For issues or questions, contact the NaviKid development team.
