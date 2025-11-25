import { FastifyInstance, FastifyRequest, FastifyReply, RouteShorthandOptions } from 'fastify';
import { z } from 'zod';
import { query, transaction } from '../db/connection';
import { getAuthUser, hashPassword, validatePassword } from '../utils/auth';

// Request schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

const linkChildSchema = z.object({
  childEmail: z.string().email(),
});

export async function userRoutes(server: FastifyInstance) {
  const authOpts: RouteShorthandOptions = { preHandler: [server.authenticate] } as RouteShorthandOptions;
  /**
   * GET /api/users/me
   * Get current user profile
   */
  server.get(
    '/me',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);

      const result = await query(
        `SELECT id, email, role, first_name, last_name, phone_number,
              email_verified, is_active, created_at, updated_at, last_login_at
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
        isActive: userData.is_active,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        lastLoginAt: userData.last_login_at,
      });
    }
  );

  /**
   * PATCH /api/users/me
   * Update current user profile
   */
  server.patch(
    '/me',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const body = updateProfileSchema.parse(request.body);

      const updates: string[] = [];
  const values: unknown[] = [];
      let paramCount = 1;

      if (body.firstName !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(body.firstName);
      }

      if (body.lastName !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(body.lastName);
      }

      if (body.phoneNumber !== undefined) {
        updates.push(`phone_number = $${paramCount++}`);
        values.push(body.phoneNumber);
      }

      if (updates.length === 0) {
        return reply.badRequest('No fields to update');
      }

      values.push(user.userId);

      const result = await query(
        `UPDATE users
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, email, role, first_name, last_name, phone_number, updated_at`,
        values
      );

      const userData = result.rows[0];

      reply.send({
        message: 'Profile updated successfully',
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phoneNumber: userData.phone_number,
          updatedAt: userData.updated_at,
        },
      });
    }
  );

  /**
   * POST /api/users/change-password
   * Change user password
   */
  server.post(
    '/change-password',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const body = changePasswordSchema.parse(request.body);

      // Get current password hash
      const result = await query('SELECT password_hash FROM users WHERE id = $1', [
        user.userId,
      ]);

      if (result.rowCount === 0) {
        return reply.notFound('User not found');
      }

      // Verify current password
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(
        body.currentPassword,
        result.rows[0].password_hash
      );

      if (!isValid) {
        return reply.unauthorized('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = validatePassword(body.newPassword);
      if (!passwordValidation.valid) {
        return reply.badRequest(passwordValidation.errors.join('. '));
      }

      // Hash new password
      const newPasswordHash = await hashPassword(body.newPassword);

      await transaction(async (client) => {
        // Update password
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [newPasswordHash, user.userId]
        );

        // Revoke all refresh tokens for security
        await client.query(
          'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE user_id = $1',
          [user.userId]
        );
      });

      reply.send({ message: 'Password changed successfully. Please log in again.' });
    }
  );

  /**
   * DELETE /api/users/me
   * Delete user account
   */
  server.delete(
    '/me',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);

      await query(
        'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
        [user.userId]
      );

      reply.send({ message: 'Account deactivated successfully' });
    }
  );

  /**
   * GET /api/users/children
   * Get linked children (for parents)
   */
  server.get(
    '/children',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);

      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can access this endpoint');
      }

      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
              ur.id as relationship_id, ur.status, ur.created_at as linked_at
       FROM user_relationships ur
       JOIN users u ON ur.child_id = u.id
       WHERE ur.parent_id = $1 AND ur.status = 'active'
       ORDER BY ur.created_at DESC`,
        [user.userId]
      );

      reply.send({
        children: result.rows.map((row) => ({
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          relationshipId: row.relationship_id,
          status: row.status,
          linkedAt: row.linked_at,
        })),
      });
    }
  );

  /**
   * GET /api/users/parents
   * Get linked parents (for children)
   */
  server.get(
    '/parents',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);

      if (user.role !== 'child') {
        return reply.forbidden('Only children can access this endpoint');
      }

      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name,
              ur.id as relationship_id, ur.status, ur.created_at as linked_at
       FROM user_relationships ur
       JOIN users u ON ur.parent_id = u.id
       WHERE ur.child_id = $1 AND ur.status = 'active'
       ORDER BY ur.created_at DESC`,
        [user.userId]
      );

      reply.send({
        parents: result.rows.map((row) => ({
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          relationshipId: row.relationship_id,
          status: row.status,
          linkedAt: row.linked_at,
        })),
      });
    }
  );

  /**
   * POST /api/users/link-child
   * Link a child account (for parents)
   */
  server.post(
    '/link-child',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
      const body = linkChildSchema.parse(request.body);

      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can link children');
      }

      // Find child user
      const childResult = await query(
        'SELECT id, role FROM users WHERE email = $1 AND is_active = TRUE',
        [body.childEmail]
      );

      if (childResult.rowCount === 0) {
        return reply.notFound('Child account not found');
      }

      const child = childResult.rows[0];

      if (child.role !== 'child') {
        return reply.badRequest('User is not a child account');
      }

      // Check if already linked
      const existingLink = await query(
        'SELECT id, status FROM user_relationships WHERE parent_id = $1 AND child_id = $2',
        [user.userId, child.id]
      );

      if ((existingLink.rowCount ?? 0) > 0) {
        return reply.conflict('Child account already linked');
      }

      // Create relationship
      const result = await query(
        `INSERT INTO user_relationships (parent_id, child_id, status)
       VALUES ($1, $2, 'active')
       RETURNING id, status, created_at`,
        [user.userId, child.id]
      );

      const relationship = result.rows[0];

      reply.code(201).send({
        message: 'Child account linked successfully',
        relationship: {
          id: relationship.id,
          parentId: user.userId,
          childId: child.id,
          status: relationship.status,
          createdAt: relationship.created_at,
        },
      });
    }
  );

  /**
   * DELETE /api/users/unlink-child/:childId
   * Unlink a child account (for parents)
   */
  server.delete(
    '/unlink-child/:childId',
    authOpts,
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = getAuthUser(request);
  const { childId } = request.params as { childId: string };

      if (user.role !== 'parent') {
        return reply.forbidden('Only parents can unlink children');
      }

      const result = await query(
        'DELETE FROM user_relationships WHERE parent_id = $1 AND child_id = $2 RETURNING id',
        [user.userId, childId]
      );

      if (result.rowCount === 0) {
        return reply.notFound('Child link not found');
      }

      reply.send({ message: 'Child account unlinked successfully' });
    }
  );
}
