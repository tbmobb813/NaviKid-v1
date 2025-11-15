# NaviKid Integration Quick Start

Get NaviKid frontend and backend running together in minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Expo CLI

## Quick Setup

### 1. Start Backend (Terminal 1)

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run migrations
npm run db:migrate

# Start server
npm run dev
```

Backend will run on http://localhost:3000

### 2. Start Frontend (Terminal 2)

```bash
# From project root
npm install

# Setup environment
cp .env.example .env

# Edit .env
nano .env
# Set: EXPO_PUBLIC_API_URL=http://localhost:3000

# Start Expo
npm start
```

### 3. Verify Connection

```bash
# Test backend connection
npx ts-node scripts/test-backend-connection.ts
```

### 4. Run Integration Tests

```bash
# Make sure backend is running, then:
npm run test:integration
```

## What You Get

✅ **Authentication**: JWT-based auth with token refresh
✅ **Location Tracking**: Real-time location sync to backend
✅ **Safe Zones**: Geofencing with backend validation
✅ **Emergency Alerts**: Instant alerts via WebSocket
✅ **Offline Support**: Queue actions and sync when online
✅ **Real-time Updates**: WebSocket for live notifications

## File Structure

```
/services
  ├── api.ts              # Complete API client
  ├── websocket.ts        # Real-time WebSocket
  ├── locationService.ts  # Location tracking
  ├── safeZoneService.ts  # Geofencing
  ├── emergencyService.ts # Emergency system
  └── offlineQueue.ts     # Offline sync

/backend
  ├── src/
  │   ├── routes/         # API endpoints
  │   ├── services/       # Business logic
  │   └── database/       # Database layer
  └── .env               # Backend config
```

## Quick API Examples

### Register User

```typescript
import apiClient from '@/services/api';

const result = await apiClient.auth.register('user@example.com', 'Password123!', 'parent');
```

### Send Location

```typescript
const result = await apiClient.locations.sendLocation(
  40.7128, // latitude
  -74.006, // longitude
  10, // accuracy
  { batteryLevel: 85, isMoving: true },
);
```

### Create Safe Zone

```typescript
const result = await apiClient.safeZones.create(
  'Home',
  40.7128,
  -74.006,
  200, // radius in meters
  'home',
);
```

### Trigger Emergency

```typescript
const result = await apiClient.emergency.triggerAlert();
```

## Common Issues

### "Network request failed"

**For iOS Simulator:**

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**For Android Emulator:**

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**For Physical Device:**

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000
```

### "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/navikid
```

### "Redis connection failed"

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

## Next Steps

1. **Read Full Documentation**: See [INTEGRATION.md](./INTEGRATION.md)
2. **API Reference**: Check service method signatures
3. **Testing**: Run full test suite
4. **Deploy**: Follow production deployment guide

## Need Help?

- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **Backend Docs**: [backend/README.md](./backend/README.md)
- **Frontend Docs**: [README.md](./README.md)

## Development Commands

```bash
# Start backend
npm run dev:backend

# Start frontend
npm start

# Start both concurrently
npm run dev:full

# Test backend connection
npm run test:backend

# Run integration tests
npm run test:integration
```

## Success Checklist

- [ ] Backend running on port 3000
- [ ] PostgreSQL connected
- [ ] Redis connected
- [ ] Frontend app launched
- [ ] User registration works
- [ ] Location tracking works
- [ ] Safe zones work
- [ ] Emergency alerts work
- [ ] WebSocket connected
- [ ] Offline sync works

🎉 **You're all set!** Start building amazing features with NaviKid.
