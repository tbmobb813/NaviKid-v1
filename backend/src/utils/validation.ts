import { z, ZodError } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { formatError } from './formatError';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z.enum(['parent', 'guardian']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Location validation schemas
export const storeLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  timestamp: z.string().datetime().or(z.date()).or(z.number()),
  context: z
    .object({
      batteryLevel: z.number().min(0).max(100).optional(),
      isMoving: z.boolean().optional(),
      speed: z.number().optional(),
      altitude: z.number().optional(),
      heading: z.number().optional(),
    })
    .optional(),
});

export const locationHistoryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().positive().max(1000).optional().default(100),
  offset: z.number().nonnegative().optional().default(0),
});

export const batchStoreLocationsSchema = z.object({
  locations: z
    .array(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().positive(),
  timestamp: z.string().datetime().or(z.date()).or(z.number()),
        context: z.record(z.any()).optional(),
      })
    )
    .min(1)
    .max(100),
});

// Safe zone validation schemas
export const createSafeZoneSchema = z.object({
  name: z.string().min(1).max(255),
  centerLatitude: z.number().min(-90).max(90),
  centerLongitude: z.number().min(-180).max(180),
  radius: z.number().positive(),
  type: z.enum(['home', 'school', 'friend', 'custom']).optional(),
});

export const updateSafeZoneSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  centerLatitude: z.number().min(-90).max(90).optional(),
  centerLongitude: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  type: z.enum(['home', 'school', 'friend', 'custom']).optional(),
});

export const checkLocationInSafeZoneSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Emergency contact validation schemas
export const createEmergencyContactSchema = z.object({
  name: z.string().min(1).max(255),
  phoneNumber: z.string().min(1).max(50),
  email: z.string().email(),
  relationship: z.string().min(1).max(100),
});

export const updateEmergencyContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phoneNumber: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  relationship: z.string().min(1).max(100).optional(),
});

export const triggerEmergencyAlertSchema = z.object({
  triggerReason: z.enum(['emergency_button', 'geofence_violation', 'manual']),
  locationSnapshot: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  timestamp: z.string().datetime().or(z.date()).or(z.number()),
  }),
});

// Offline sync validation schemas
export const syncOfflineActionsSchema = z.object({
  actions: z
    .array(
      z.object({
        actionType: z.enum(['location_update', 'safe_zone_check', 'emergency_alert']),
        data: z.record(z.any()),
        // Accept timestamp either on the action root or inside data; make optional
        timestamp: z.string().datetime().or(z.date()).or(z.number()).optional(),
      })
    )
    .min(1)
    .max(500),
});

// Profile validation schemas
export const createProfileSchema = z.object({
  childName: z.string().min(1).max(255),
  dateOfBirth: z.string().datetime().or(z.date()),
  phoneNumber: z.string().min(1).max(50).optional(),
});

export const updateProfileSchema = z.object({
  childName: z.string().min(1).max(255).optional(),
  dateOfBirth: z.string().datetime().or(z.date()).optional(),
  phoneNumber: z.string().min(1).max(50).optional(),
});

/**
 * Validation middleware factory
 */
export function validate(schema: z.ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.validatedBody = await schema.parseAsync(request.body);
    } catch (error: unknown) {
      // Prefer Zod error details when available
      let details: unknown = undefined;
      if (error instanceof ZodError) {
        details = error.errors;
      }

      const { message } = formatError(error);
      reply.status(400).send({
        success: false,
        error: {
          message: message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
        },
      });
    }
  };
}
