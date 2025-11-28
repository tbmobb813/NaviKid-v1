import { FastifyInstance } from 'fastify';
import authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  validate,
} from '../utils/validation';
import { ApiResponse, UserRole } from '../types';
import { getAuthUser } from '../utils/auth';
import logger from '../utils/logger';
import { formatError } from '../utils/formatError';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * Register new user
   * POST /auth/register
   */
  fastify.post(
    '/register',
    {
      preHandler: validate(registerSchema),
      // Limit registration attempts to slow down automated account creation
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function (_req: any, _context: any) {
            return { error: 'Too many registration attempts. Please try again later.' };
          },
        },
      },
    },
    async (request, reply) => {
      try {
    async (request, reply) => {
      try {
        const { email, password, role } = request.body as {
          email: string;
          password: string;
          role?: UserRole;
        };

        // Create user
        await authService.register(email, password, role);

        // Generate tokens by performing a login so the client receives the
        // same token shape as a normal login flow. This keeps the client-side
        // behavior consistent for downstream tests and usage.
        const { user, tokens } = await authService.login(email, password, request.ip);

        const response: ApiResponse = {
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              createdAt: (user as any).created_at || new Date(),
            },
            tokens,
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(201).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Registration error');
        reply.status(400).send({
          success: false,
          error: {
            message: message || 'Registration failed',
            code: 'REGISTRATION_ERROR',
          },
        });
      }
    }
  );

  /**
   * Login user
   * POST /auth/login
   */
  fastify.post(
    '/login',
    {
      preHandler: validate(loginSchema),
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        const ipAddress = request.ip;

        const { user, tokens } = await authService.login(email, password, ipAddress);

        const response: ApiResponse = {
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
            tokens,
          },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Login error');
        reply.status(401).send({
          success: false,
          error: {
            message: message || 'Login failed',
            code: 'LOGIN_ERROR',
          },
        });
      }
    }
  );

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  fastify.post(
    '/refresh',
    {
      preHandler: validate(refreshTokenSchema),
      // Limit refresh token attempts to mitigate abuse
      config: {
        rateLimit: {
          max: 20,
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function (_req: any, _context: any) {
            return { error: 'Too many token requests. Please try again later.' };
          },
        },
      },
    },
    async (request, reply) => {
    async (request, reply) => {
      try {
        const { refreshToken } = request.body as { refreshToken: string };

        const tokens = await authService.refreshAccessToken(refreshToken);

        const response: ApiResponse = {
  fastify.post(
    '/auth/change-password',
    {
      preHandler: [authMiddleware, validate(changePasswordSchema)],
      // Protect password-change endpoint from abuse
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function (_req: any, _context: any) {
            return { error: 'Too many requests. Please try again later.' };
          },
        },
      },
    },
    async (request, reply) => {
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Token refresh error');
        reply.status(401).send({
          success: false,
          error: {
            message: message || 'Token refresh failed',
            code: 'TOKEN_REFRESH_ERROR',
          },
        });
      }
    }
  );

  /**
   * Logout user
   * POST /auth/logout
   */
  fastify.post(
    '/logout',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        const refreshToken = request.body as { refreshToken: string };

        await authService.logout(userId, refreshToken.refreshToken);

        const response: ApiResponse = {
          success: true,
          data: { message: 'Logged out successfully' },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Logout error');
        reply.status(500).send({
          success: false,
          error: {
            message: message || 'Logout failed',
            code: 'LOGOUT_ERROR',
          },
        });
      }
    }
  );

  /**
   * Change password
   * POST /auth/change-password
   */
  fastify.post(
    '/change-password',
    {
      preHandler: [authMiddleware, validate(changePasswordSchema)],
    },
    async (request, reply) => {
      try {
        const { userId } = getAuthUser(request);
        const { oldPassword, newPassword } = request.body as {
          oldPassword: string;
          newPassword: string;
        };

        await authService.changePassword(userId, oldPassword, newPassword);

        const response: ApiResponse = {
          success: true,
          data: { message: 'Password changed successfully' },
          meta: {
            timestamp: new Date(),
          },
        };

        reply.status(200).send(response);
      } catch (error: unknown) {
        const { message, errorObj } = formatError(error);
        logger.error({ error: errorObj }, 'Password change error');
        reply.status(400).send({
          success: false,
          error: {
            message: message || 'Password change failed',
            code: 'PASSWORD_CHANGE_ERROR',
          },
        });
      }
    }
  );

  /**
   * Get current user
   * GET /auth/me
   */
  fastify.get(
    '/me',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      const response: ApiResponse = {
        success: true,
        data: { user: getAuthUser(request) },
        meta: {
          timestamp: new Date(),
        },
      };

      reply.status(200).send(response);
    }
  );
}
