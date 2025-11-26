import bcrypt from 'bcrypt';
import { FastifyRequest } from 'fastify';
import crypto from 'crypto';
import { config } from '../config';
import { JWTPayload } from '../types';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.security.bcryptSaltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
/** Generate JWT payload for a user (uses canonical type from `../types`) */

/**
 * Extract user from authenticated request
 */
export function getAuthUser(request: FastifyRequest): JWTPayload {
  const req = request as FastifyRequest & { user?: JWTPayload };
  const user = req.user;

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}

/**
 * Extract optional user from request (doesn't throw if not authenticated)
 */
export function getOptionalAuthUser(request: FastifyRequest): JWTPayload | null {
  const req = request as FastifyRequest & { user?: JWTPayload };
  return req.user || null;
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  return request.ip;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: FastifyRequest): string {
  return request.headers['user-agent'] || 'Unknown';
}
