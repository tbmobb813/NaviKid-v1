# NaviKid Backend - Quick Start Guide

Get the backend running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 13+ installed and running
- Redis 6+ installed and running

## Step 1: Install Dependencies

```bash
cd /home/nixstation-remote/tbmobb813/NaviKid-v1/backend
npm install
```

## Step 2: Set Up Database

Create the PostgreSQL database:

```bash
createdb navikid_db
```

## Step 3: Configure Environment

The `.env` file is already configured for local development. Review and adjust if needed:

```bash
cat .env
```

Key settings:
- `DB_NAME=navikid_db`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres` (change to your PostgreSQL password)
- `REDIS_HOST=localhost`

## Step 4: Run Database Migrations

```bash
npm run db:migrate
```

Expected output:
```
Starting database migrations...
Executing migration: 001_initial_schema.sql
Migration 001_initial_schema.sql completed successfully
All migrations completed successfully
```

## Step 5: Start the Server

```bash
npm run dev
```

Expected output:
```
Server started successfully
Host: 0.0.0.0
Port: 3000
URL: http://0.0.0.0:3000
```

## Step 6: Test the API

Check health status:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T...",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

## Step 7: Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123",
    "role": "parent"
  }'
```

## Step 8: Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123"
  }'
```

Save the `accessToken` from the response for authenticated requests.

## Common Issues

### PostgreSQL Connection Error

**Error**: `Connection refused`

**Solution**: Start PostgreSQL
```bash
# On macOS/Linux
sudo service postgresql start

# Or check if running
sudo service postgresql status
```

### Redis Connection Error

**Error**: `Redis client error`

**Solution**: Start Redis
```bash
# On macOS/Linux
sudo service redis-server start

# Or check if running
redis-cli ping
# Should return: PONG
```

### Database Migration Error

**Error**: `Database connection failed`

**Solution**: Check PostgreSQL credentials in `.env`
```bash
# Test connection
psql -U postgres -d navikid_db -c "SELECT 1"
```

### Port Already in Use

**Error**: `Port 3000 already in use`

**Solution**: Change port in `.env`
```env
PORT=3001
```

## Next Steps

- Read `/backend/API_DOCUMENTATION.md` for all endpoints
- Test with Postman/Insomnia
- Connect your React Native frontend
- Set up WebSocket for real-time updates

## Useful Commands

```bash
# Development (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Run migrations
npm run db:migrate

# Run cleanup (data retention)
npm run cleanup

# Run tests (when implemented)
npm test
```

## API Base URL

All API requests should use:
```
http://localhost:3000
```

## Authentication

Include the JWT token in headers:
```
Authorization: Bearer <your_access_token>
```

## Support

See `README.md` for detailed documentation or `API_DOCUMENTATION.md` for endpoint reference.
