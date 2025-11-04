# NaviKid API Documentation

Version 1.0.0 - Privacy-first family location tracking backend

Base URL: `http://localhost:3000` (development)

## Authentication

Most endpoints require authentication. Include the JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
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
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* optional error details */ }
  },
  "meta": {
    "timestamp": "2025-11-04T00:00:00Z",
    "requestId": "req-123"
  }
}
```

## API Endpoints

### Authentication

#### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123",
  "role": "parent"  // optional: "parent" or "guardian"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "parent@example.com",
      "role": "parent",
      "createdAt": "2025-11-04T00:00:00Z"
    }
  }
}
```

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "parent@example.com",
      "role": "parent"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### Refresh Token
```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### Logout
```
POST /auth/logout
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`

#### Change Password
```
POST /auth/change-password
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "oldPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Response:** `200 OK`

#### Get Current User
```
GET /auth/me
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "uuid",
      "email": "parent@example.com",
      "role": "parent"
    }
  }
}
```

---

### Location Tracking

#### Store Location
```
POST /locations
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 10.5,
  "timestamp": "2025-11-04T12:00:00Z",
  "context": {
    "batteryLevel": 85,
    "isMoving": true,
    "speed": 5.2,
    "altitude": 100,
    "heading": 45
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "location": {
      "id": "uuid",
      "user_id": "uuid",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 10.5,
      "timestamp": "2025-11-04T12:00:00Z",
      "context": { /* context object */ },
      "created_at": "2025-11-04T12:00:05Z"
    }
  }
}
```

#### Get Location History
```
GET /locations?startDate=<ISO8601>&endDate=<ISO8601>&limit=100&offset=0
```
**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `limit` (optional): Number of results (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "locations": [ /* array of location objects */ ],
    "pagination": {
      "total": 250,
      "limit": 100,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Get Current Location
```
GET /locations/current
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "location": { /* latest location object */ }
  }
}
```

#### Delete Location
```
DELETE /locations/:id
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

#### Batch Store Locations (Offline Sync)
```
POST /locations/batch
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "locations": [
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 10.5,
      "timestamp": "2025-11-04T12:00:00Z",
      "context": { /* optional context */ }
    },
    // ... more locations (max 100)
  ]
}
```

**Response:** `201 Created`

---

### Safe Zones (Geofencing)

#### List Safe Zones
```
GET /safe-zones
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "safeZones": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "Home",
        "center_latitude": 37.7749,
        "center_longitude": -122.4194,
        "radius": 100,
        "type": "home",
        "created_at": "2025-11-04T00:00:00Z",
        "updated_at": "2025-11-04T00:00:00Z"
      }
    ]
  }
}
```

#### Get Safe Zone by ID
```
GET /safe-zones/:id
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

#### Create Safe Zone
```
POST /safe-zones
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "School",
  "centerLatitude": 37.7749,
  "centerLongitude": -122.4194,
  "radius": 200,
  "type": "school"  // optional: "home", "school", "friend", "custom"
}
```

**Response:** `201 Created`

#### Update Safe Zone
```
PUT /safe-zones/:id
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "radius": 250
  // any field from create is optional
}
```

**Response:** `200 OK`

#### Delete Safe Zone
```
DELETE /safe-zones/:id
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

#### Check Location in Safe Zones
```
POST /safe-zones/check
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "isInSafeZone": true,
    "safeZones": [ /* array of matching safe zones */ ]
  }
}
```

---

### Emergency Contacts & Alerts

#### List Emergency Contacts
```
GET /emergency-contacts
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

#### Add Emergency Contact
```
POST /emergency-contacts
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "relationship": "parent"
}
```

**Response:** `201 Created`

#### Update Emergency Contact
```
PUT /emergency-contacts/:id
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phoneNumber": "+0987654321"
}
```

**Response:** `200 OK`

#### Delete Emergency Contact
```
DELETE /emergency-contacts/:id
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

#### Trigger Emergency Alert
```
POST /emergency/alert
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "triggerReason": "emergency_button",  // "emergency_button", "geofence_violation", "manual"
  "locationSnapshot": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "2025-11-04T12:00:00Z"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "alerts": [ /* array of alert objects */ ],
    "count": 3,
    "message": "Emergency alert sent to 3 contact(s)"
  }
}
```

#### Get Alert History
```
GET /emergency/alerts?limit=50&offset=0
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

#### Acknowledge Alert
```
POST /emergency/alerts/:id/acknowledge
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### Offline Sync

#### Sync Offline Actions
```
POST /offline-actions/sync
```
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "actions": [
    {
      "actionType": "location_update",  // "location_update", "safe_zone_check", "emergency_alert"
      "data": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "accuracy": 10.5,
        "context": {}
      },
      "timestamp": "2025-11-04T12:00:00Z"
    }
    // ... more actions (max 500)
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "processed": 10,
    "failed": 0,
    "errors": []
  }
}
```

#### Get Pending Actions
```
GET /offline-actions/pending
```
**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### Health & Monitoring

#### Health Check
```
GET /health
```

**Response:** `200 OK` (healthy) or `503 Service Unavailable` (unhealthy)
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00Z",
  "services": {
    "database": "up",
    "redis": "up"
  }
}
```

#### API Info
```
GET /
```

**Response:** `200 OK`
```json
{
  "name": "NaviKid API",
  "version": "1.0.0",
  "description": "Privacy-first family location tracking backend",
  "endpoints": { /* endpoint groups */ }
}
```

---

### WebSocket

#### Real-time Location Updates
```
WS /ws/locations
```

Connect to WebSocket and send location updates:

**Client → Server:**
```json
{
  "type": "location_update",
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "2025-11-04T12:00:00Z"
  }
}
```

**Server → Client:**
```json
{
  "type": "ack",
  "timestamp": "2025-11-04T12:00:01Z",
  "message": "Location update received"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `REGISTRATION_ERROR` | 400 | User registration failed |
| `LOGIN_ERROR` | 401 | Invalid credentials |
| `TOKEN_REFRESH_ERROR` | 401 | Invalid refresh token |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

- **Limit**: 100 requests per minute per IP address
- **Headers**: Rate limit info returned in response headers
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time until limit resets

## Data Retention

- **Location History**: Automatically deleted after 30 days (COPPA compliance)
- **Offline Actions**: Deleted 7 days after successful sync
- **Audit Logs**: Retained for 90 days

## Security

- **Password Requirements**: Minimum 8 characters with at least one uppercase, one lowercase, and one number
- **Token Expiry**: Access tokens expire after 15 minutes, refresh tokens after 7 days
- **Session Management**: Sessions stored in Redis, invalidated on logout
- **Audit Logging**: All user actions logged with timestamp and IP address

## Support

For questions or issues, refer to the main README.md or contact the development team.
