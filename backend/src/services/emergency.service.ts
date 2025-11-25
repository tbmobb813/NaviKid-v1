import db from '../database';
import logger from '../utils/logger';
import { EmergencyContact, EmergencyAlert, EmergencyTriggerReason } from '../types';

export class EmergencyService {
  /**
   * Add emergency contact
   */
  public async addEmergencyContact(
    userId: string,
    name: string,
    phoneNumber: string,
    email: string,
    relationship: string
  ): Promise<EmergencyContact> {
    try {
      const result = await db.query<EmergencyContact>(
        `INSERT INTO emergency_contacts (user_id, name, phone_number, email, relationship)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, name, phoneNumber, email, relationship]
      );

      const contact = result.rows[0];

      logger.info({ userId, contactId: contact.id }, 'Emergency contact added');

      return contact;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to add emergency contact');
      throw error;
    }
  }

  /**
   * Get all emergency contacts for a user
   */
  public async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const result = await db.query<EmergencyContact>(
        'SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get emergency contacts');
      throw error;
    }
  }

  /**
   * Get emergency contact by ID
   */
  public async getEmergencyContactById(
    userId: string,
    contactId: string
  ): Promise<EmergencyContact | null> {
    try {
      const result = await db.query<EmergencyContact>(
        'SELECT * FROM emergency_contacts WHERE id = $1 AND user_id = $2',
        [contactId, userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error({ userId, contactId, error }, 'Failed to get emergency contact');
      throw error;
    }
  }

  /**
   * Update emergency contact
   */
  public async updateEmergencyContact(
    userId: string,
    contactId: string,
    updates: {
      name?: string;
      phoneNumber?: string;
      email?: string;
      relationship?: string;
    }
  ): Promise<EmergencyContact | null> {
    try {
      const fields: string[] = [];
  const values: unknown[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.phoneNumber !== undefined) {
        fields.push(`phone_number = $${paramIndex}`);
        values.push(updates.phoneNumber);
        paramIndex++;
      }

      if (updates.email !== undefined) {
        fields.push(`email = $${paramIndex}`);
        values.push(updates.email);
        paramIndex++;
      }

      if (updates.relationship !== undefined) {
        fields.push(`relationship = $${paramIndex}`);
        values.push(updates.relationship);
        paramIndex++;
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(contactId, userId);

      const query = `
        UPDATE emergency_contacts
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await db.query<EmergencyContact>(query, values);

      if (result.rows.length > 0) {
        logger.info({ userId, contactId }, 'Emergency contact updated');
        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error({ userId, contactId, error }, 'Failed to update emergency contact');
      throw error;
    }
  }

  /**
   * Delete emergency contact
   */
  public async deleteEmergencyContact(
    userId: string,
    contactId: string
  ): Promise<boolean> {
    try {
      const result = await db.query(
        'DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2',
        [contactId, userId]
      );

      const deleted = (result.rowCount ?? 0) > 0;

      if (deleted) {
        logger.info({ userId, contactId }, 'Emergency contact deleted');
      }

      return deleted;
    } catch (error) {
      logger.error({ userId, contactId, error }, 'Failed to delete emergency contact');
      throw error;
    }
  }

  /**
   * Trigger emergency alert
   */
  public async triggerEmergencyAlert(
    userId: string,
    triggerReason: EmergencyTriggerReason,
    locationSnapshot: {
      latitude: number;
      longitude: number;
      timestamp: Date;
    }
  ): Promise<EmergencyAlert[]> {
    try {
      // Get all emergency contacts
      const contacts = await this.getEmergencyContacts(userId);

      if (contacts.length === 0) {
        logger.warn({ userId }, 'No emergency contacts found for user');
        return [];
      }

      const alerts: EmergencyAlert[] = [];

      // Create alert for each contact
      for (const contact of contacts) {
        const result = await db.query<EmergencyAlert>(
          `INSERT INTO emergency_alerts (user_id, contact_id, trigger_reason, location_snapshot)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [userId, contact.id, triggerReason, JSON.stringify(locationSnapshot)]
        );

        const alert = result.rows[0];
        alerts.push(alert);

        // TODO: Send actual SMS/Email notification
        // For now, just log
        logger.info(
          {
            userId,
            contactId: contact.id,
            alertId: alert.id,
            triggerReason,
          },
          'Emergency alert created'
        );

        // Simulate notification sending
        await this.sendEmergencyNotification(contact, locationSnapshot, triggerReason);
      }

      return alerts;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to trigger emergency alert');
      throw error;
    }
  }

  /**
   * Send emergency notification (stub for SMS/Email)
   */
  private async sendEmergencyNotification(
    contact: EmergencyContact,
    location: { latitude: number; longitude: number; timestamp: Date },
    reason: EmergencyTriggerReason
  ): Promise<void> {
    // TODO: Integrate with SMS/Email service (Twilio, SendGrid, etc.)
    logger.info(
      {
        contactId: contact.id,
        phoneNumber: contact.phone_number,
        email: contact.email,
        location,
        reason,
      },
      'Emergency notification sent (stub)'
    );

    // Simulate async delivery
    setTimeout(async () => {
      try {
        // Mark as delivered
        await db.query(
          `UPDATE emergency_alerts
           SET delivered_at = CURRENT_TIMESTAMP
           WHERE contact_id = $1 AND sent_at > NOW() - INTERVAL '1 minute'
           AND delivered_at IS NULL`,
          [contact.id]
        );
      } catch (error) {
        logger.error(
          { contactId: contact.id, error },
          'Failed to update delivery status'
        );
      }
    }, 1000);
  }

  /**
   * Get emergency alert history
   */
  public async getEmergencyAlertHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ alerts: EmergencyAlert[]; total: number }> {
    try {
      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) FROM emergency_alerts WHERE user_id = $1',
        [userId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get alerts with pagination
      const result = await db.query<EmergencyAlert>(
        `SELECT * FROM emergency_alerts
         WHERE user_id = $1
         ORDER BY sent_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return {
        alerts: result.rows,
        total,
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get emergency alert history');
      throw error;
    }
  }

  /**
   * Acknowledge emergency alert
   */
  public async acknowledgeAlert(
    userId: string,
    alertId: string
  ): Promise<EmergencyAlert | null> {
    try {
      const result = await db.query<EmergencyAlert>(
        `UPDATE emergency_alerts
         SET acknowledged_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [alertId, userId]
      );

      if (result.rows.length > 0) {
        logger.info({ userId, alertId }, 'Emergency alert acknowledged');
        return result.rows[0];
      }

      return null;
    } catch (error) {
      logger.error({ userId, alertId, error }, 'Failed to acknowledge alert');
      throw error;
    }
  }
}

export default new EmergencyService();
