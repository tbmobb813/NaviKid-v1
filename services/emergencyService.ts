/**
 * NaviKid Emergency Service
 *
 * Handles emergency contacts and alert triggering.
 */

import apiClient, { EmergencyContact, EmergencyAlert } from './api';
import wsClient from './websocket';
import locationService from './locationService';
import { log } from '@/utils/logger';

// ============================================================================
// Emergency Service Class
// ============================================================================

class EmergencyService {
  private static instance: EmergencyService;
  private contacts: EmergencyContact[] = [];
  private contactListeners: Set<(contacts: EmergencyContact[]) => void> = new Set();
  private alertListeners: Set<(alert: EmergencyAlert) => void> = new Set();

  private constructor() {
    log.info('Emergency Service initialized');
    this.setupWebSocketListeners();
  }

  static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  // ==========================================================================
  // Emergency Contacts CRUD
  // ==========================================================================

  async fetchContacts(): Promise<EmergencyContact[]> {
    try {
      log.debug('Fetching emergency contacts from backend');

      const response = await apiClient.emergency.listContacts();

      if (response.success && response.data) {
        this.contacts = response.data;
        log.info(`Fetched ${this.contacts.length} emergency contacts`);
        this.notifyContactListeners();
        return this.contacts;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      log.error('Failed to fetch emergency contacts', error as Error);
      return this.contacts;
    }
  }

  async addContact(
    name: string,
    phone: string,
    email: string,
    relationship: string,
  ): Promise<EmergencyContact | null> {
    try {
      log.info('Adding emergency contact', { name, relationship });

      const response = await apiClient.emergency.addContact(name, phone, email, relationship);

      if (response.success && response.data) {
        this.contacts.push(response.data);
        log.info('Emergency contact added', { id: response.data.id });
        this.notifyContactListeners();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to add contact');
      }
    } catch (error) {
      log.error('Failed to add emergency contact', error as Error);
      return null;
    }
  }

  async updateContact(
    id: string,
    updates: Partial<EmergencyContact>,
  ): Promise<EmergencyContact | null> {
    try {
      log.info('Updating emergency contact', { id });

      const response = await apiClient.emergency.updateContact(id, updates);

      if (response.success && response.data) {
        const index = this.contacts.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.contacts[index] = response.data;
        }
        log.info('Emergency contact updated', { id });
        this.notifyContactListeners();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update contact');
      }
    } catch (error) {
      log.error('Failed to update emergency contact', error as Error);
      return null;
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    try {
      log.info('Deleting emergency contact', { id });

      const response = await apiClient.emergency.deleteContact(id);

      if (response.success) {
        this.contacts = this.contacts.filter((c) => c.id !== id);
        log.info('Emergency contact deleted', { id });
        this.notifyContactListeners();
        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to delete contact');
      }
    } catch (error) {
      log.error('Failed to delete emergency contact', error as Error);
      return false;
    }
  }

  // ==========================================================================
  // Emergency Alert
  // ==========================================================================

  async triggerEmergencyAlert(): Promise<EmergencyAlert | null> {
    try {
      log.warn('EMERGENCY ALERT TRIGGERED');

      // Get current location
      const location =
        locationService.getLastLocation() || (await locationService.getCurrentLocation());

      if (!location) {
        log.error('Cannot trigger alert: no location available');
        throw new Error('Location unavailable');
      }

      // Call backend to send alert
      const response = await apiClient.emergency.triggerAlert();

      if (response.success && response.data) {
        log.info('Emergency alert sent successfully', { id: response.data.id });
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to trigger alert');
      }
    } catch (error) {
      log.error('Failed to trigger emergency alert', error as Error);
      return null;
    }
  }

  // ==========================================================================
  // WebSocket Alerts
  // ==========================================================================

  private setupWebSocketListeners(): void {
    wsClient.onEmergencyAlert((alert) => {
      log.warn('Emergency alert received via WebSocket', { id: alert.alertId });
      this.notifyAlertListeners(alert as any);
    });
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  getContacts(): EmergencyContact[] {
    return [...this.contacts];
  }

  getContactById(id: string): EmergencyContact | undefined {
    return this.contacts.find((c) => c.id === id);
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  addContactListener(callback: (contacts: EmergencyContact[]) => void): () => void {
    this.contactListeners.add(callback);
    return () => {
      this.contactListeners.delete(callback);
    };
  }

  addAlertListener(callback: (alert: EmergencyAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private notifyContactListeners(): void {
    this.contactListeners.forEach((callback) => {
      try {
        callback(this.contacts);
      } catch (error) {
        log.error('Error in contact listener', error as Error);
      }
    });
  }

  private notifyAlertListeners(alert: EmergencyAlert): void {
    this.alertListeners.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        log.error('Error in alert listener', error as Error);
      }
    });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const emergencyService = EmergencyService.getInstance();
export default emergencyService;
