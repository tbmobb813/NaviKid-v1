import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../database';
import redis from '../database/redis';
import config from '../config';
import logger from '../utils/logger';
import { User, UserRole, AuthTokens, JWTPayload } from '../types';

export class AuthService {
  /**
   * Hash password with bcrypt
   */
  private async hashPassword(
    password: string,
    salt: string
  ): Promise<string> {
    const combined = password + salt;
    return await bcrypt.hash(combined, config.security.bcryptSaltRounds);
  }

  /**
   * Generate random salt
   */
  private generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify password
   */
  private async verifyPassword(
    password: string,
    salt: string,
    hash: string
  ): Promise<boolean> {
    const combined = password + salt;
    return await bcrypt.compare(combined, hash);
  }

  /**
   * Register new user
   */
  public async register(
    email: string,
    password: string,
    role: UserRole = UserRole.PARENT
  ): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await db.query<User>(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Generate salt and hash password
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(password, salt);

      // Insert user
      const result = await db.query<User>(
        `INSERT INTO users (email, password_hash, salt, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role, created_at, updated_at`,
        [email.toLowerCase(), passwordHash, salt, role]
      );

      const user = result.rows[0];

      // Log audit trail
      await this.logAudit(user.id, 'user_registered', { email, role });

      logger.info({ userId: user.id, email  }, 'User registered successfully');

      return user;
    } catch (error) {
      logger.error({ email, error  }, 'Registration failed');
      throw error;
    }
  }

  /**
   * Login user
   */
  public async login(
    email: string,
    password: string,
    ipAddress?: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Find user
      const result = await db.query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Verify password
      const isValid = await this.verifyPassword(
        password,
        user.salt,
        user.password_hash
      );

      if (!isValid) {
        await this.logAudit(user.id, 'login_failed', { email, ipAddress });
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Log audit trail
      await this.logAudit(user.id, 'user_login', { email, ipAddress });

      logger.info({ userId: user.id, email  }, 'User logged in successfully');

      // Remove sensitive data
      delete (user as any).password_hash;
      delete (user as any).salt;

      return { user, tokens };
    } catch (error) {
      logger.error({ email, error  }, 'Login failed');
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = this.createJWT(
      payload,
      config.jwt.accessSecret,
      config.jwt.accessExpiresIn
    );

    // Generate refresh token
    const refreshToken = this.createJWT(
      payload,
      config.jwt.refreshSecret,
      config.jwt.refreshExpiresIn
    );

    // Store refresh token in Redis
    const refreshExpiry = this.parseExpiryToSeconds(
      config.jwt.refreshExpiresIn
    );
    await redis.setSession(user.id, refreshToken, refreshExpiry);

    return { accessToken, refreshToken };
  }

  /**
   * Create JWT token
   */
  private createJWT(payload: JWTPayload, secret: string, expiresIn: string): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiryToSeconds(expiresIn);

    const jwtPayload = {
      ...payload,
      iat: now,
      exp: exp,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT token
   */
  public verifyJWT(token: string, secret: string): JWTPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
      }

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString()
      );

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      logger.error({ error  }, 'JWT verification failed');
      throw new Error('Invalid token');
    }
  }

  /**
   * Refresh access token
   */
  public async refreshAccessToken(
    refreshToken: string
  ): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.verifyJWT(refreshToken, config.jwt.refreshSecret);

      // Check if session exists in Redis
      const session = await redis.getSession(payload.userId, refreshToken);
      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const result = await db.query<User>(
        'SELECT * FROM users WHERE id = $1',
        [payload.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Delete old refresh token session
      await redis.deleteSession(payload.userId, refreshToken);

      logger.info({ userId: user.id  }, 'Access token refreshed');

      return tokens;
    } catch (error) {
      logger.error({ error  }, 'Token refresh failed');
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      await redis.deleteSession(userId, refreshToken);
      await this.logAudit(userId, 'user_logout', {});
      logger.info({ userId  }, 'User logged out');
    } catch (error) {
      logger.error({ userId, error  }, 'Logout failed');
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const result = await db.query<User>(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Verify old password
      const isValid = await this.verifyPassword(
        oldPassword,
        user.salt,
        user.password_hash
      );

      if (!isValid) {
        throw new Error('Invalid old password');
      }

      // Generate new salt and hash
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(newPassword, salt);

      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1, salt = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [passwordHash, salt, userId]
      );

      // Invalidate all sessions
      await redis.deleteAllUserSessions(userId);

      // Log audit trail
      await this.logAudit(userId, 'password_changed', {});

      logger.info({ userId  }, 'Password changed successfully');
    } catch (error) {
      logger.error({ userId, error  }, 'Password change failed');
      throw error;
    }
  }

  /**
   * Delete account
   */
  public async deleteAccount(userId: string): Promise<void> {
    try {
      // Delete user (cascade will delete all related data)
      await db.query('DELETE FROM users WHERE id = $1', [userId]);

      // Delete all sessions
      await redis.deleteAllUserSessions(userId);

      // Log audit trail (before deletion)
      await this.logAudit(userId, 'account_deleted', {});

      logger.info({ userId  }, 'Account deleted');
    } catch (error) {
      logger.error({ userId, error  }, 'Account deletion failed');
      throw error;
    }
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        throw new Error('Invalid expiry format');
    }
  }

  /**
   * Log audit trail
   */
  private async logAudit(
    userId: string,
    action: string,
    details: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      await db.query(
        'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [userId, action, JSON.stringify(details), ipAddress || null]
      );
    } catch (error) {
      logger.error({ userId, action, error  }, 'Failed to log audit trail');
    }
  }
}

export default new AuthService();
