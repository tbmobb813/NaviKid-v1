# NaviKid Frontend-Backend Integration Guide

## Overview

This document describes the complete frontend-backend integration for NaviKid, including setup instructions, architecture overview, API documentation, and testing procedures.

## Architecture

┌─────────────────────────────────────────────────────────────┐
│ React Native App │
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Services │ │ Stores │ │ Screens │ │
│ │ │ │ │ │ │ │
│ │ • API Client │ │ • Auth Store │ │ • Auth │ │
│ │ • WebSocket │ │ • Location │ │ • Map │ │
│ │ • Location │ │ • SafeZones │ │ • Settings │ │
│ │ • SafeZones │ │ • Emergency │ │ │ │
│ │ • Emergency │ │ │ │ │ │
│ │ • Offline │ │ │ │ │ │
│ └──────┬───────┘ └──────────────┘ └──────────────┘ │
│ │ │
└─────────┼───────────────────────────────────────────────────┘
│
│ HTTP/REST WebSocket
│ (JWT Auth) (Real-time)
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Fastify Backend │
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Routes │ │ Services │ │ Database │ │
│ │ │ │ │ │ │ │
│ │ • Auth │ │ • Auth │ │ PostgreSQL │ │
│ │ • Locations │ │ • Location │ │ │ │
│ │ • SafeZones │ │ • SafeZone │ │ • Users │ │
│ │ • Emergency │ │ • Emergency │ │ • Locations │ │
│ │ • Offline │ │ • Offline │ │ • SafeZones │ │
│ │ │ │ │ │ • Contacts │ │
│ └──────────────┘ └──────────────┘ └──────┬───────┘ │
│ │ │
│ ▼ │
│ ┌──────────────┐ │
│ │ Redis │ │
│ │ (Sessions) │ │
│ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Server
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/navikid

   # Redis
   REDIS_URL=redis://localhost:6379

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d

   # CORS
   CORS_ORIGIN=*
   ```

4. **Setup database:**

   ```bash
   npm run db:migrate
   npm run db:seed  # Optional: seed test data
   ```

5. **Start backend server:**

   ```bash
   npm run dev
   ```

   Backend should be running on `http://localhost:3000`

6. **Verify backend health:**

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

### Frontend Setup

1. **Navigate to project root:**

   ```bash
   cd /path/to/NaviKid-v1
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   # Backend API URL
   EXPO_PUBLIC_API_URL=http://localhost:3000

   # Map Configuration (optional)
   EXPO_PUBLIC_MAP_STYLE_URL=
   EXPO_PUBLIC_MAPBOX_TOKEN=
   EXPO_PUBLIC_MAP_DEFAULT_LAT=40.7128
   EXPO_PUBLIC_MAP_DEFAULT_LNG=-74.0060
   EXPO_PUBLIC_MAP_DEFAULT_ZOOM=13

   # ORS Configuration (optional)
   EXPO_PUBLIC_ORS_API_KEY=
   EXPO_PUBLIC_ORS_BASE_URL=https://api.openrouteservice.org
   ```

4. **Start Expo development server:**

   ```bash
   npm start
   ```

5. **Launch on device:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on physical device

## API Client Documentation

### Service Structure

```typescript
/services
  ├── api.ts              # Main API client with all endpoints
  ├── websocket.ts        # WebSocket client for real-time updates
  ├── locationService.ts  # Location tracking integration
  ├── safeZoneService.ts  # Safe zone management
  ├── emergencyService.ts # Emergency contacts and alerts
  └── offlineQueue.ts     # Offline action queue management
```

### API Client Usage

#### Authentication

```typescript
import apiClient from '@/services/api';

// Register
const result = await apiClient.auth.register(email, password, 'parent');

// Login
const result = await apiClient.auth.login(email, password);

// Logout
await apiClient.auth.logout();

// Refresh token (automatic on 401)
const result = await apiClient.auth.refreshToken();

// Get current user
const result = await apiClient.auth.me();

// Change password
await apiClient.auth.changePassword(oldPassword, newPassword);
```

#### Locations

```typescript
import apiClient from '@/services/api';

// Send location
const result = await apiClient.locations.sendLocation(latitude, longitude, accuracy, {
  batteryLevel: 85,
  isMoving: true,
  speed: 2.5,
});

// Get location history
const result = await apiClient.locations.getHistory(startDate, endDate);

// Get current location
const result = await apiClient.locations.getCurrent();

// Delete location
await apiClient.locations.delete(locationId);
```

#### Safe Zones

```typescript
import apiClient from '@/services/api';

// List safe zones
const result = await apiClient.safeZones.list();

// Create safe zone
const result = await apiClient.safeZones.create(
  'Home',
  40.7128,
  -74.006,
  200, // radius in meters
  'home',
);

// Update safe zone
await apiClient.safeZones.update(id, { name: 'New Name', radius: 300 });

// Delete safe zone
await apiClient.safeZones.delete(id);

// Check geofence
const result = await apiClient.safeZones.checkGeofence(latitude, longitude);
```

#### Emergency

```typescript
import apiClient from '@/services/api';

// List emergency contacts
const result = await apiClient.emergency.listContacts();

// Add contact
const result = await apiClient.emergency.addContact(
  'John Doe',
  '+1234567890',
  'john@example.com',
  'Parent',
);

// Update contact
await apiClient.emergency.updateContact(id, { name: 'Jane Doe' });

// Delete contact
await apiClient.emergency.deleteContact(id);

// Trigger emergency alert
const result = await apiClient.emergency.triggerAlert();
```

#### Offline Sync

```typescript
import apiClient from '@/services/api';

// Sync offline actions
const result = await apiClient.offline.syncActions([
  {
    id: '1',
    type: 'location_update',
    data: { latitude, longitude, accuracy },
    timestamp: Date.now(),
  },
]);
```

### WebSocket Client Usage

```typescript
import wsClient from '@/services/websocket';

// Connect (automatically called on auth)
wsClient.connect(accessToken);

// Disconnect
wsClient.disconnect();

// Listen for location updates
const unsubscribe = wsClient.onLocationUpdate((location) => {
  console.log('Location update:', location);
});

// Listen for geofence alerts
wsClient.onGeofenceAlert((alert) => {
  console.log('Geofence alert:', alert);
});

// Listen for emergency alerts
wsClient.onEmergencyAlert((alert) => {
  console.log('Emergency alert:', alert);
});

// Listen for connection status
wsClient.onConnectionStatus((status) => {
  console.log('Connected:', status.connected);
});

// Send custom message
wsClient.send({ type: 'custom', data: { ... } });
```

### High-Level Services

#### Location Service

```typescript
import locationService from '@/services/locationService';

// Start tracking
await locationService.startTracking();

// Stop tracking
await locationService.stopTracking();

// Get current location (one-time)
const location = await locationService.getCurrentLocation();

// Get location history
const history = await locationService.getLocationHistory(startDate, endDate);

// Listen for location updates
const unsubscribe = locationService.addListener((location) => {
  console.log('New location:', location);
});

// Get last known location
const lastLocation = locationService.getLastLocation();

// Check tracking status
const isTracking = locationService.isTrackingActive();
```

#### Safe Zone Service

```typescript
import safeZoneService from '@/services/safeZoneService';

// Fetch all safe zones
await safeZoneService.fetchSafeZones();

// Create safe zone
const zone = await safeZoneService.createSafeZone('School', 40.7128, -74.006, 300, 'school');

// Update safe zone
await safeZoneService.updateSafeZone(id, { radius: 400 });

// Delete safe zone
await safeZoneService.deleteSafeZone(id);

// Check geofence
const result = await safeZoneService.checkGeofence(latitude, longitude);

// Listen for safe zone updates
const unsubscribe = safeZoneService.addListener((zones) => {
  console.log('Safe zones updated:', zones);
});

// Listen for geofence alerts
safeZoneService.addAlertListener((alert) => {
  console.log('Geofence alert:', alert);
});
```

#### Emergency Service

```typescript
import emergencyService from '@/services/emergencyService';

// Fetch contacts
await emergencyService.fetchContacts();

// Add contact
const contact = await emergencyService.addContact(
  'Mom',
  '+1234567890',
  'mom@example.com',
  'Parent',
);

// Update contact
await emergencyService.updateContact(id, { phone: '+9876543210' });

// Delete contact
await emergencyService.deleteContact(id);

// Trigger emergency alert
const alert = await emergencyService.triggerEmergencyAlert();

// Listen for contact updates
const unsubscribe = emergencyService.addContactListener((contacts) => {
  console.log('Contacts updated:', contacts);
});

// Listen for emergency alerts
emergencyService.addAlertListener((alert) => {
  console.log('Emergency alert:', alert);
});
```

#### Offline Queue Service

```typescript
import offlineQueue from '@/services/offlineQueue';

// Add action to queue
await offlineQueue.addAction({
  type: 'location_update',
  data: { latitude, longitude, accuracy },
  timestamp: Date.now(),
});

// Sync queue with backend
await offlineQueue.syncQueue();

// Get queue status
const status = offlineQueue.getStatus();
console.log('Queue size:', status.queueSize);
console.log('Syncing:', status.isSyncing);
console.log('Failed:', status.failedCount);

// Listen for sync status updates
const unsubscribe = offlineQueue.addListener((status) => {
  console.log('Sync status:', status);
});

// Clear queue
await offlineQueue.clearQueue();

// Check network status
const isOnline = offlineQueue.isNetworkOnline();
```

## Integration Testing

### Running Tests

1. **Start backend server:**

   ```bash
   cd backend && npm run dev
   ```

2. **Run integration tests:**

   ```bash
   npm run test:integration
   ```

### Test Scenarios

The integration test suite covers all 8 required scenarios:

1. **User Registration & Login**
   - Register new user via frontend
   - Verify JWT tokens received and stored
   - Verify tokens persist across app restart
   - Verify logout clears tokens

2. **Location Tracking**
   - Send location from app to backend
   - Verify backend receives and stores location
   - Fetch location history from backend
   - Verify data matches what was sent
   - Test date range filtering

3. **Safe Zones**
   - Create safe zone via app
   - Verify backend stored it
   - Fetch safe zone list
   - Check geofence detection (simulate location change)
   - Delete safe zone

4. **Emergency Alert**
   - Trigger emergency alert from app
   - Verify backend records alert
   - Verify emergency contacts in database
   - Verify alert notification received by app via WebSocket

5. **Offline Sync**
   - Queue action while offline (disable network)
   - Verify action stored in offline queue
   - Restore network connection
   - Verify action syncs to backend
   - Verify queue cleared

6. **WebSocket Real-Time**
   - Connect WebSocket from app
   - Trigger alert from backend/other device
   - Verify app receives alert in real-time
   - Verify alert shown in UI

7. **Token Refresh**
   - Login user
   - Simulate token expiry (wait 15 mins or mock time)
   - Make API call
   - Verify refresh token used automatically
   - Verify new access token obtained

8. **Offline PIN + Backend Auth**
   - Verify parental PIN still works offline
   - Verify backend authentication still required after PIN
   - Test PIN unlock → Backend login → Access features

## Common Issues & Troubleshooting

### Backend Connection Issues

**Problem:** `Network request failed` or `ECONNREFUSED`

**Solution:**

- Verify backend is running on `http://localhost:3000`
- Check `EXPO_PUBLIC_API_URL` in `.env`
- For iOS Simulator: use `http://localhost:3000`
- For Android Emulator: use `http://10.0.2.2:3000`
- For physical device: use your computer's IP (e.g., `http://192.168.1.100:3000`)

### Authentication Errors

**Problem:** `401 Unauthorized` errors

**Solution:**

- Check JWT secret in backend `.env`
- Verify token expiration settings
- Clear app storage and re-login
- Check backend logs for authentication errors

### WebSocket Connection Issues

**Problem:** WebSocket fails to connect

**Solution:**

- Verify WebSocket endpoint is accessible
- Check firewall settings
- Ensure backend WebSocket support is enabled
- Check browser/app console for connection errors

### Database Connection Issues

**Problem:** Backend fails to connect to PostgreSQL

**Solution:**

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Verify database exists: `psql -l`
- Run migrations: `npm run db:migrate`

### Location Permission Issues

**Problem:** Location tracking doesn't start

**Solution:**

- Check app permissions in device settings
- Request permissions programmatically
- For iOS: add location usage descriptions in `app.config.ts`
- For Android: add location permissions in manifest

## Production Deployment

### Backend Deployment

1. **Environment Configuration:**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure production database
   - Set up Redis for sessions
   - Enable CORS for your domain only

2. **Database:**
   - Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
   - Run migrations before deployment
   - Set up automated backups

3. **Deploy:**
   - Use Docker for containerization
   - Deploy to cloud provider (AWS, GCP, Heroku, Railway, etc.)
   - Set up SSL/TLS certificates
   - Configure health checks and monitoring

### Frontend Deployment

1. **Environment Configuration:**
   - Update `EXPO_PUBLIC_API_URL` to production backend
   - Configure Sentry DSN for error tracking
   - Set up analytics if needed

2. **Build:**
   - iOS: `eas build --platform ios --profile production`
   - Android: `eas build --platform android --profile production`

3. **Submit to App Stores:**
   - iOS: `eas submit --platform ios`
   - Android: `eas submit --platform android`

## Performance Optimization

### API Client

- Implement request caching for read operations
- Use request debouncing for frequent updates
- Implement batch operations for bulk data
- Add request compression (gzip)

### Location Tracking

- Adjust tracking interval based on battery level
- Use significant location changes for battery efficiency
- Implement geofencing on device for instant notifications
- Batch location updates before sending to backend

### WebSocket

- Implement connection pooling
- Use binary protocol for large data transfers
- Add message compression
- Implement heartbeat mechanism

### Offline Queue

- Limit queue size to prevent memory issues
- Implement priority-based syncing
- Compress queued data
- Add background sync workers

## Security Best Practices

1. **Authentication:**
   - Use HTTPS only in production
   - Implement rate limiting on auth endpoints
   - Use secure token storage (SecureStore)
   - Implement token refresh rotation

2. **API Security:**
   - Validate all inputs
   - Implement CORS properly
   - Use parameterized queries (prevent SQL injection)
   - Add request signing for critical operations

3. **Data Privacy:**
   - Encrypt location data at rest
   - Implement data retention policies
   - Allow users to delete their data
   - Comply with GDPR/privacy regulations

4. **WebSocket Security:**
   - Authenticate WebSocket connections
   - Validate all incoming messages
   - Implement rate limiting
   - Add message encryption for sensitive data

## Support

For issues, questions, or contributions:

- **Backend Issues:** Check `backend/README.md`
- **Frontend Issues:** Check main `README.md`
- **Integration Issues:** Review this document
- **Bug Reports:** Create an issue on GitHub

## License

MIT License - See LICENSE file for details
