import { FastifyRequest, FastifyReply } from 'fastify';
import authService from '../services/auth.service';
import config from '../config';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';
import { getAuthUser } from '../utils/auth';

// Extend FastifyRequest to include user

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: {
          message: 'Missing or invalid authorization header',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
  const payload = authService.verifyJWT(token, config.jwt.accessSecret);

    // Attach user to request (typed via Fastify declaration merge)
    request.user = payload;
  } catch (error: unknown) {
    const { errorObj } = formatError(error);
    logger.warn({ error: errorObj }, 'Authentication failed');
    return reply.status(401).send({
      success: false,
      error: {
        message: 'Invalid or expired token',
        code: 'UNAUTHORIZED',
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
  const payload = authService.verifyJWT(token, config.jwt.accessSecret);
      request.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug({ error }, 'Optional auth failed');
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const user = getAuthUser(request);
    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
      });
    }
  };
}
