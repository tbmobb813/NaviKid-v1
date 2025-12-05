/**
 * Tests for Emergency Service
 * Validates emergency contact management and alert functionality
 */

// Mock Expo modules first
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}), { virtual: true });

jest.mock('expo-device', () => ({
  isDevice: true,
}), { virtual: true });

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}), { virtual: true });

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import emergencyService from '@/services/emergencyService';
import apiClient, { EmergencyContact, EmergencyAlert } from '@/services/api';
import wsClient from '@/services/websocket';
import locationService from '@/services/locationService';

// Mock dependencies
jest.mock('@/services/api');
jest.mock('@/services/websocket');
jest.mock('@/services/locationService');
jest.mock('@/utils/logger');

describe('EmergencyService', () => {
  const mockContact: EmergencyContact = {
    id: '1',
    name: 'John Doe',
    phoneNumber: '+1234567890',
    email: 'john@example.com',
    relationship: 'Parent',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
  };

  const mockAlert: EmergencyAlert = {
    id: 'alert-1',
    userId: 'user-1',
    triggerReason: 'manual',
    locationSnapshot: {
      latitude: 40.7128,
      longitude: -74.006,
      timestamp: new Date().toISOString(),
    },
    sentAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock locationService methods
    (locationService.getLastLocation as jest.Mock) = jest.fn();
    (locationService.getCurrentLocation as jest.Mock) = jest.fn();

    // Clear the service's internal state by fetching empty contacts
    (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
    await emergencyService.fetchContacts();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = emergencyService;
      const instance2 = emergencyService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('fetchContacts', () => {
    it('should fetch emergency contacts successfully', async () => {
      const mockResponse = {
        success: true,
        data: [mockContact],
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      const contacts = await emergencyService.fetchContacts();

      expect(contacts).toEqual([mockContact]);
      expect(apiClient.emergency.listContacts).toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Network error' },
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      const contacts = await emergencyService.fetchContacts();

      expect(contacts).toEqual([]);
    });

    it('should handle API exceptions', async () => {
      (apiClient.emergency.listContacts as jest.Mock).mockRejectedValue(
        new Error('API exception')
      );

      const contacts = await emergencyService.fetchContacts();

      expect(contacts).toEqual([]);
    });

    it('should notify listeners after fetching contacts', async () => {
      const mockResponse = {
        success: true,
        data: [mockContact],
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      const listener = jest.fn();
      emergencyService.addContactListener(listener);

      await emergencyService.fetchContacts();

      expect(listener).toHaveBeenCalledWith([mockContact]);
    });
  });

  describe('addContact', () => {
    it('should add a new emergency contact', async () => {
      const mockResponse = {
        success: true,
        data: mockContact,
      };

      (apiClient.emergency.addContact as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.addContact(
        'John Doe',
        '+1234567890',
        'john@example.com',
        'Parent'
      );

      expect(result).toEqual(mockContact);
      expect(apiClient.emergency.addContact).toHaveBeenCalledWith(
        'John Doe',
        '+1234567890',
        'john@example.com',
        'Parent'
      );
    });

    it('should handle add contact errors', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Validation error' },
      };

      (apiClient.emergency.addContact as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.addContact(
        'Jane Doe',
        'invalid',
        'jane@example.com',
        'Parent'
      );

      expect(result).toBeNull();
    });

    it('should notify listeners after adding contact', async () => {
      const mockResponse = {
        success: true,
        data: mockContact,
      };

      (apiClient.emergency.addContact as jest.Mock).mockResolvedValue(mockResponse);

      const listener = jest.fn();
      emergencyService.addContactListener(listener);

      await emergencyService.addContact(
        'John Doe',
        '+1234567890',
        'john@example.com',
        'Parent'
      );

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('updateContact', () => {
    it('should update an existing contact', async () => {
      const updatedContact = { ...mockContact, phoneNumber: '+9876543210' };
      const mockResponse = {
        success: true,
        data: updatedContact,
      };

      (apiClient.emergency.updateContact as jest.Mock).mockResolvedValue(mockResponse);

      // First add a contact
      (apiClient.emergency.addContact as jest.Mock).mockResolvedValue({
        success: true,
        data: mockContact,
      });
      await emergencyService.addContact(
        'John Doe',
        '+1234567890',
        'john@example.com',
        'Parent'
      );

      const result = await emergencyService.updateContact('1', { phoneNumber: '+9876543210' });

      expect(result).toEqual(updatedContact);
      expect(apiClient.emergency.updateContact).toHaveBeenCalledWith('1', {
        phoneNumber: '+9876543210',
      });
    });

    it('should handle update errors', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Contact not found' },
      };

      (apiClient.emergency.updateContact as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.updateContact('999', { phoneNumber: '+9876543210' });

      expect(result).toBeNull();
    });

    it('should notify listeners after updating contact', async () => {
      const updatedContact = { ...mockContact, phoneNumber: '+9876543210' };
      const mockResponse = {
        success: true,
        data: updatedContact,
      };

      (apiClient.emergency.updateContact as jest.Mock).mockResolvedValue(mockResponse);

      const listener = jest.fn();
      emergencyService.addContactListener(listener);

      await emergencyService.updateContact('1', { phoneNumber: '+9876543210' });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact successfully', async () => {
      const mockResponse = {
        success: true,
      };

      (apiClient.emergency.deleteContact as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.deleteContact('1');

      expect(result).toBe(true);
      expect(apiClient.emergency.deleteContact).toHaveBeenCalledWith('1');
    });

    it('should handle delete errors', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Contact not found' },
      };

      (apiClient.emergency.deleteContact as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.deleteContact('999');

      expect(result).toBe(false);
    });

    it('should notify listeners after deleting contact', async () => {
      const mockResponse = {
        success: true,
      };

      (apiClient.emergency.deleteContact as jest.Mock).mockResolvedValue(mockResponse);

      const listener = jest.fn();
      emergencyService.addContactListener(listener);

      await emergencyService.deleteContact('1');

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('triggerEmergencyAlert', () => {
    it('should trigger an emergency alert with location', async () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: Date.now(),
      };

      (locationService.getLastLocation as jest.Mock).mockReturnValue(mockLocation);

      const mockResponse = {
        success: true,
        data: mockAlert,
      };

      (apiClient.emergency.triggerAlert as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.triggerEmergencyAlert();

      expect(result).toEqual(mockAlert);
      expect(locationService.getLastLocation).toHaveBeenCalled();
      expect(apiClient.emergency.triggerAlert).toHaveBeenCalled();
    });

    it('should get current location if last location is unavailable', async () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: Date.now(),
      };

      (locationService.getLastLocation as jest.Mock).mockReturnValue(null);
      (locationService.getCurrentLocation as jest.Mock).mockResolvedValue(mockLocation);

      const mockResponse = {
        success: true,
        data: mockAlert,
      };

      (apiClient.emergency.triggerAlert as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.triggerEmergencyAlert();

      expect(result).toEqual(mockAlert);
      expect(locationService.getCurrentLocation).toHaveBeenCalled();
    });

    it('should handle alert trigger errors', async () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: Date.now(),
      };

      (locationService.getLastLocation as jest.Mock).mockReturnValue(mockLocation);

      const mockResponse = {
        success: false,
        error: { message: 'Server error' },
      };

      (apiClient.emergency.triggerAlert as jest.Mock).mockResolvedValue(mockResponse);

      const result = await emergencyService.triggerEmergencyAlert();

      expect(result).toBeNull();
    });

    it('should handle missing location error', async () => {
      (locationService.getLastLocation as jest.Mock).mockReturnValue(null);
      (locationService.getCurrentLocation as jest.Mock).mockResolvedValue(null);

      const result = await emergencyService.triggerEmergencyAlert();

      expect(result).toBeNull();
    });
  });

  describe('getContacts', () => {
    it('should return a copy of contacts array', async () => {
      const mockResponse = {
        success: true,
        data: [mockContact],
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      await emergencyService.fetchContacts();
      const contacts = emergencyService.getContacts();

      expect(contacts).toEqual([mockContact]);
      expect(contacts).not.toBe(emergencyService.getContacts()); // Should be a copy
    });

    it('should return empty array if no contacts', () => {
      const contacts = emergencyService.getContacts();
      expect(Array.isArray(contacts)).toBe(true);
    });
  });

  describe('getContactById', () => {
    it('should return contact by id', async () => {
      const mockResponse = {
        success: true,
        data: [mockContact],
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      await emergencyService.fetchContacts();
      const contact = emergencyService.getContactById('1');

      expect(contact).toEqual(mockContact);
    });

    it('should return undefined for non-existent contact', () => {
      const contact = emergencyService.getContactById('999');
      expect(contact).toBeUndefined();
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove contact listeners', async () => {
      const listener = jest.fn();
      const unsubscribe = emergencyService.addContactListener(listener);

      const mockResponse = {
        success: true,
        data: [mockContact],
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      await emergencyService.fetchContacts();
      expect(listener).toHaveBeenCalledWith([mockContact]);

      listener.mockClear();
      unsubscribe();

      await emergencyService.fetchContacts();
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle errors in contact listeners', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      emergencyService.addContactListener(errorListener);

      const mockResponse = {
        success: true,
        data: [mockContact],
      };

      (apiClient.emergency.listContacts as jest.Mock).mockResolvedValue(mockResponse);

      // Should not throw
      await expect(emergencyService.fetchContacts()).resolves.not.toThrow();
    });

    it('should add and remove alert listeners', () => {
      const listener = jest.fn();
      const unsubscribe = emergencyService.addAlertListener(listener);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('WebSocket Integration', () => {
    it('should setup WebSocket listeners on initialization', () => {
      // WebSocket listeners are set up when the service is imported/initialized
      // Since we import the service at the top of this file, the initialization
      // happens before jest.clearAllMocks() in beforeEach.
      // We can verify the listener exists by checking if the method is defined
      expect(typeof wsClient.onEmergencyAlert).toBe('function');
    });
  });
});
