export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
  GUARDIAN = 'guardian',
}

export enum SafeZoneType {
  HOME = 'home',
  SCHOOL = 'school',
  FRIEND = 'friend',
  CUSTOM = 'custom',
}

export enum EmergencyTriggerReason {
  EMERGENCY_BUTTON = 'emergency_button',
  GEOFENCE_VIOLATION = 'geofence_violation',
  MANUAL = 'manual',
}

export enum OfflineActionType {
  LOCATION_UPDATE = 'location_update',
  SAFE_ZONE_CHECK = 'safe_zone_check',
  EMERGENCY_ALERT = 'emergency_alert',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  child_name: string;
  date_of_birth: Date;
  phone_number?: string;
  created_at: Date;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  context: LocationContext;
  created_at: Date;
}

export interface LocationContext {
  batteryLevel?: number;
  isMoving?: boolean;
  speed?: number;
  altitude?: number;
  heading?: number;
}

export interface SafeZone {
  id: string;
  user_id: string;
  name: string;
  center_latitude: number;
  center_longitude: number;
  radius: number;
  type: SafeZoneType;
  created_at: Date;
  updated_at: Date;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  email: string;
  relationship: string;
  created_at: Date;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  contact_id: string;
  trigger_reason: EmergencyTriggerReason;
  location_snapshot: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  sent_at: Date;
  delivered_at?: Date;
  acknowledged_at?: Date;
}

export interface OfflineAction {
  id: string;
  user_id: string;
  action_type: OfflineActionType;
  data: unknown;
  created_at: Date;
  synced_at?: Date;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: unknown;
  ip_address: string;
  timestamp: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface SocketLike {
  remoteAddress?: string;
  send: (data: string) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  close?: () => void;
}

export interface RedisLike {
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  get?: (key: string) => Promise<string | null>;
  setex?: (key: string, ttl: number, val: string) => Promise<void>;
  set?: (key: string, val: string) => Promise<void>;
  del?: (...keys: string[]) => Promise<void>;
  keys?: (pattern: string) => Promise<string[]>;
  exists?: (key: string) => Promise<number>;
  ping?: () => Promise<string>;
  quit?: () => Promise<void>;
  expire?: (key: string, ttl: number) => Promise<number> | Promise<void>;
  incr?: (key: string) => Promise<number>;
  pipeline?: () => {
    incr: (key: string) => void;
    expire: (key: string, ttl: number) => void;
    exec: () => Promise<Array<[unknown, unknown] | null>>;
  };
}

export interface InternalRedisClient {
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  get: (key: string) => Promise<string | null>;
  setex: (key: string, expires: number, val: string) => Promise<void>;
  set: (key: string, val: string) => Promise<void>;
  del: (...keys: string[]) => Promise<void>;
  keys: (pattern: string) => Promise<string[]>;
  exists: (key: string) => Promise<number>;
  ping: () => Promise<string>;
  quit: () => Promise<void>;
  expire?: (key: string, ttl: number) => Promise<number> | Promise<void>;
  incr?: (key: string) => Promise<number>;
  pipeline?: () => {
    incr: (key: string) => void;
    expire: (key: string, ttl: number) => void;
    exec: () => Promise<Array<[unknown, unknown] | null>>;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId?: string;
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
