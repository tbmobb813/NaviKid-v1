import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import '../types/fastify.d.ts';
import { z } from 'zod';
import { query, transaction } from '../db/connection';
import rateLimit from '@fastify/rate-limit';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validatePassword,
  isValidEmail,
  getClientIP,
  getUserAgent,
  getAuthUser,
} from '../utils/auth';
import { JWTPayload } from '../types';
import { config } from '../config';

// Request schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['parent', 'child']),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export async function authRoutes(server: FastifyInstance) {
  // Register the rate limit plugin if not already registered
  // (Safe to register repeatedly, Fastify will handle it)
  // Make sure not to register globally elsewhere, or remove this if globally registered.
  // See: https://github.com/fastify/fastify-rate-limit
  await server.register(rateLimit, {
    global: false, // Only use per-route rate limiting unless global is desired
  });

  /**
   * POST /api/auth/register
   * Register a new user
   */
  server.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);

    // Validate email
    if (!isValidEmail(body.email)) {
      return reply.badRequest('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.valid) {
      return reply.badRequest(passwordValidation.errors.join('. '));
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [
      body.email,
    ]);

    if ((existingUser.rowCount ?? 0) > 0) {
      return reply.conflict('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, first_name, last_name, created_at`,
      [body.email, passwordHash, body.role, body.firstName || null, body.lastName || null]
    );

    const user = result.rows[0];

    // Generate email verification token
    const verificationToken = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, verificationToken, expiresAt]
    );

    // TODO: Send verification email

    // Generate JWT tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = server.jwt.sign(payload);
    const refreshToken = generateToken();

    // Store refresh token
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        refreshToken,
        refreshExpiresAt,
        getClientIP(request),
        getUserAgent(request),
      ]
    );

    reply.code(201).send({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessExpiresIn,
      },
    });
  });

  /**
   * POST /api/auth/login
   * User login
   */
  // Use Fastify's built-in rate limit plugin on this route, plugin handles per-IP rate limiting.

  server.post(
    '/login',
    {
      // Ensure per-route rate limiting is applied for this sensitive route.
      // The plugin was registered with global: false above, so we configure it here.
      config: {
        rateLimit: {
          max: 5, // max 5 requests per time window per IP
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function (_req, _context) {
            return { error: 'Too many login attempts. Please try again later.' };
          },
        },
      },
      // As an extra safeguard, call the rateLimit decorator if available.
      // This is a no-op when the plugin doesn't expose a decorator but harmless otherwise.
      preHandler: (server as any).rateLimit ? [(server as any).rateLimit] : undefined,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = loginSchema.parse(request.body);
      // Find user
      const result = await query(
        `SELECT id, email, password_hash, role, first_name, last_name, is_active
       FROM users
       WHERE email = $1`,
        [body.email]
      );

      if (result.rowCount === 0) {
        return reply.unauthorized('Invalid email or password');
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return reply.forbidden('Account is disabled');
      }

      // Verify password
      const isValid = await verifyPassword(body.password, user.password_hash);
      if (!isValid) {
        return reply.unauthorized('Invalid email or password');
      }

      // Update last login
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      // Generate JWT tokens
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = server.jwt.sign(payload);
      const refreshToken = generateToken();

      // Store refresh token
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          refreshToken,
          refreshExpiresAt,
          getClientIP(request),
          getUserAgent(request),
        ]
      );

      reply.send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwt.accessExpiresIn,
        },
      });
    }
  );

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  server.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshTokenSchema.parse(request.body);

    // Verify refresh token
    const result = await query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
              u.email, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1`,
      [body.refreshToken]
    );

    if (result.rowCount === 0) {
      return reply.unauthorized('Invalid refresh token');
    }

    const tokenData = result.rows[0];

    // Check if token is revoked
    if (tokenData.revoked) {
      return reply.unauthorized('Refresh token has been revoked');
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return reply.unauthorized('Refresh token has expired');
    }

    // Check if user is active
    if (!tokenData.is_active) {
      return reply.forbidden('Account is disabled');
    }

    // Generate new access token
    const payload: JWTPayload = {
      userId: tokenData.user_id,
      email: tokenData.email,
      role: tokenData.role,
    };

    const accessToken = server.jwt.sign(payload);

    reply.send({
      accessToken,
      expiresIn: config.jwt.accessExpiresIn,
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user (revoke refresh token)
   */
  server.post(
    '/logout',
    {
      preHandler: [server.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = refreshTokenSchema.parse(request.body);

      // Revoke refresh token
      await query(
        `UPDATE refresh_tokens
       SET revoked = TRUE, revoked_at = NOW()
       WHERE token = $1`,
        [body.refreshToken]
      );

      reply.send({ message: 'Logged out successfully' });
    }
  );

  /**
   * POST /api/auth/request-password-reset
   * Request password reset
   */
  server.post(
    '/request-password-reset',
    {
      config: {
        rateLimit: {
          max: 3, // Very strict - only 3 attempts per minute
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function (_req: any, _context: any) {
            return {
              error: 'Too many password reset requests. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
            };
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = resetPasswordRequestSchema.parse(request.body);

      // Find user
      const result = await query(
        'SELECT id, email FROM users WHERE email = $1 AND is_active = TRUE',
        [body.email]
      );

      // Always return success to prevent email enumeration
      if (result.rowCount === 0) {
        return reply.send({
          message:
            'If an account exists with this email, a password reset link has been sent',
        });
      }

      const user = result.rows[0];

      // Generate reset token
      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
        [user.id, resetToken, expiresAt]
      );

      // TODO: Send password reset email

      reply.send({
        message:
          'If an account exists with this email, a password reset link has been sent',
      });
    }
  );

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  server.post(
    '/reset-password',
    {
      config: {
        rateLimit: {
          max: 5, // Allow 5 attempts per minute
          timeWindow: 60 * 1000, // 1 minute
          errorResponseBuilder: function (_req: any, _context: any) {
            return {
              error: 'Too many password reset attempts. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
            };
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = resetPasswordSchema.parse(request.body);

      // Validate password strength
      const passwordValidation = validatePassword(body.newPassword);
      if (!passwordValidation.valid) {
        return reply.badRequest(passwordValidation.errors.join('. '));
      }

      // Verify token
      const result = await query(
        `SELECT id, user_id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`,
        [body.token]
      );

      if (result.rowCount === 0) {
        return reply.badRequest('Invalid password reset token');
      }

      const tokenData = result.rows[0];

      // Check if already used
      if (tokenData.used) {
        return reply.badRequest('Password reset token has already been used');
      }

      // Check if expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return reply.badRequest('Password reset token has expired');
      }

      await transaction(async (client) => {
        // Hash new password
        const passwordHash = await hashPassword(body.newPassword);

        // Update password
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, tokenData.user_id]
        );

        // Mark token as used
        await client.query(
          'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1',
          [tokenData.id]
        );

        // Revoke all refresh tokens for security
        await client.query(
          'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE user_id = $1',
          [tokenData.user_id]
        );
      });

      reply.send({ message: 'Password reset successfully' });
    }
  );

  /**
   * GET /api/auth/verify-email/:token
   * Verify email address
   */
  server.get(
    '/verify-email/:token',
    async (
      request: FastifyRequest<{
        Params: { token: string };
      }>,
      reply: FastifyReply
    ) => {
      const { token } = request.params;

      // Verify token
      const result = await query(
        `SELECT id, user_id, expires_at, verified
       FROM email_verification_tokens
       WHERE token = $1`,
        [token]
      );

      if (result.rowCount === 0) {
        return reply.badRequest('Invalid verification token');
      }

      const tokenData = result.rows[0];

      // Check if already verified
      if (tokenData.verified) {
        return reply.send({ message: 'Email already verified' });
      }

      // Check if expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return reply.badRequest('Verification token has expired');
      }

      await transaction(async (client) => {
        // Mark email as verified
        await client.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [
          tokenData.user_id,
        ]);

        // Mark token as verified
        await client.query(
          'UPDATE email_verification_tokens SET verified = TRUE, verified_at = NOW() WHERE id = $1',
          [tokenData.id]
        );
      });

      reply.send({ message: 'Email verified successfully' });
    }
  );

  /**
   * GET /api/auth/me
   * Get current user info
   */
  server.get(
    '/me',
    {
      preHandler: [server.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);

      // Get full user details
      const result = await query(
        `SELECT id, email, role, first_name, last_name, phone_number,
              email_verified, created_at, last_login_at
       FROM users
       WHERE id = $1`,
        [user.userId]
      );

      if (result.rowCount === 0) {
        return reply.notFound('User not found');
      }

      const userData = result.rows[0];

      reply.send({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phoneNumber: userData.phone_number,
        emailVerified: userData.email_verified,
        createdAt: userData.created_at,
        lastLoginAt: userData.last_login_at,
      });
    }
  );
}
