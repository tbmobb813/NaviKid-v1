# NaviKid Backend API

Privacy-first family location tracking backend for NaviKid mobile app.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing, refresh tokens, and session management
- **Location Tracking**: Store, retrieve, and manage GPS location history with COPPA-compliant data retention
- **Safe Zones (Geofencing)**: Create and monitor safe zones, detect geofence violations
- **Emergency Alerts**: Trigger emergency alerts to contacts with location snapshots
- **Offline Sync**: Batch sync offline actions from mobile app
- **Real-time Updates**: WebSocket support for live location updates
- **Security**: Rate limiting, request validation, audit logging
- **Monitoring**: Sentry integration, structured logging with Pino

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL
- **Cache/Sessions**: Redis
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Logging**: Pino
- **Monitoring**: Sentry

## Prerequisites

- Node.js 18+ or higher
- PostgreSQL 13+ or higher
- Redis 6+ or higher
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database and Redis credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=navikid_db
DB_USER=postgres
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### 3. Database Setup

Create the PostgreSQL database:

```bash
createdb navikid_db
```

Run migrations:

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/change-password` - Change password
- `GET /auth/me` - Get current user

### Location Tracking

- `POST /locations` - Store new location
- `GET /locations` - Get location history (with date filters, pagination)
- `GET /locations/current` - Get current (latest) location
- `DELETE /locations/:id` - Delete specific location
- `POST /locations/batch` - Batch store locations (offline sync)

### Safe Zones

- `GET /safe-zones` - List all safe zones
- `POST /safe-zones` - Create safe zone
- `GET /safe-zones/:id` - Get safe zone by ID
- `PUT /safe-zones/:id` - Update safe zone
- `DELETE /safe-zones/:id` - Delete safe zone
- `POST /safe-zones/check` - Check if location is in safe zone

### Emergency Contacts & Alerts

- `GET /emergency-contacts` - List emergency contacts
- `POST /emergency-contacts` - Add emergency contact
- `PUT /emergency-contacts/:id` - Update contact
- `DELETE /emergency-contacts/:id` - Delete contact
- `POST /emergency/alert` - Trigger emergency alert
- `GET /emergency/alerts` - Get alert history
- `POST /emergency/alerts/:id/acknowledge` - Acknowledge alert

### Offline Sync

- `POST /offline-actions/sync` - Sync batch of offline actions
- `GET /offline-actions/pending` - Get pending actions

### Health & Monitoring

- `GET /health` - Health check (database + Redis status)
- `GET /` - API info

### WebSocket

- `WS /ws/locations` - Real-time location updates

## Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Flow

1. Login with email/password → receive `accessToken` (15 min) and `refreshToken` (7 days)
2. Use `accessToken` for API requests
3. When `accessToken` expires, use `refreshToken` to get new tokens
4. Logout to invalidate refresh token

## Request/Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-11-04T00:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-11-04T00:00:00Z",
    "requestId": "req-123"
  }
}
```

## Data Retention & Compliance

- **Location History**: Automatically deleted after 30 days (COPPA compliance)
- **Offline Actions**: Deleted 7 days after sync
- **Audit Logs**: Retained for 90 days

Run cleanup manually:

```bash
npm run cleanup
```

Or set up a daily cron job:

```bash
0 2 * * * cd /path/to/backend && npm run cleanup
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── database/         # Database connection, Redis, migrations
│   ├── middleware/       # Auth, error handling, validation
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic layer
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions, logger, validation
│   ├── scripts/          # Migration, cleanup scripts
│   └── index.ts          # Main application entry point
├── dist/                 # Compiled JavaScript (gitignored)
├── .env                  # Environment variables (gitignored)
├── .env.example          # Example environment file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds + random salt per user
- **JWT Tokens**: Short-lived access tokens, long-lived refresh tokens
- **Session Management**: Redis-based session storage
- **Rate Limiting**: 100 requests per minute per IP
- **Request Validation**: Zod schemas for all inputs
- **Audit Logging**: All user actions logged with IP address
- **CORS**: Configurable allowed origins
- **Error Handling**: Sanitized error messages in production

## Deployment

### Production Checklist

1. Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
2. Configure production database (managed PostgreSQL recommended)
3. Configure production Redis (ElastiCache or managed Redis)
4. Set `NODE_ENV=production`
5. Enable Sentry with production DSN
6. Configure CORS origins for production domains
7. Set up daily cleanup cron job
8. Enable database backups
9. Set up SSL/TLS certificates
10. Configure reverse proxy (nginx/CloudFlare)

### Environment Variables

See `.env.example` for all available configuration options.

### Docker Support

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
npm run build
docker build -t navikid-backend .
docker run -p 3000:3000 --env-file .env navikid-backend
```

## Monitoring & Logging

### Sentry Integration

Set `SENTRY_DSN` in `.env` to enable error tracking:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Structured Logging

All logs include contextual information:

```json
{
  "level": "info",
  "time": "2025-11-04T00:00:00Z",
  "msg": "Request completed",
  "method": "POST",
  "url": "/locations",
  "statusCode": 201,
  "responseTime": 45,
  "requestId": "req-123"
}
```

## Testing

Run tests with:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
