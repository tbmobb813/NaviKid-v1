/**
 * Tests for WebSocket Client
 * Validates connection management, message handling, and reconnection logic
 */

// Mock modules FIRST before any imports
jest.mock(
  'expo-constants',
  () => ({
    expoConfig: {
      extra: {
        api: {
          baseUrl: 'http://test-api.example.com',
        },
      },
    },
    default: {
      expoConfig: {
        extra: {
          api: {
            baseUrl: 'http://test-api.example.com',
          },
        },
      },
    },
  }),
  { virtual: true },
);

jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import type {
  WebSocketMessage,
  LocationUpdate,
  GeofenceAlert,
  EmergencyAlertMessage,
  ConnectionStatus,
} from '@/services/websocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen({});
      }
    }, 10);
  }

  send = jest.fn();

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: code || 1000, reason: reason || 'Normal closure' });
    }
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper method to simulate error
  simulateError(error: any) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}

// Replace global WebSocket with mock and ensure constants are available
(global as any).WebSocket = MockWebSocket;
(global as any).WebSocket.CONNECTING = MockWebSocket.CONNECTING;
(global as any).WebSocket.OPEN = MockWebSocket.OPEN;  
(global as any).WebSocket.CLOSING = MockWebSocket.CLOSING;
(global as any).WebSocket.CLOSED = MockWebSocket.CLOSED;

describe('NaviKidWebSocketClient', () => {
  let wsClient: any;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset modules to get fresh instance
    jest.resetModules();
    const wsModule = require('@/services/websocket');
    wsClient = new wsModule.NaviKidWebSocketClient();

    // Capture the WebSocket instance after connection
    wsClient.connect();
    jest.advanceTimersByTime(20); // Allow connection to complete
    mockWs = wsClient['ws'] as MockWebSocket;
  });

  afterEach(() => {
    wsClient.disconnect();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct WebSocket URL', () => {
      const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();
      expect(newClient['url']).toBe('ws://test-api.example.com/ws/locations');
    });

    it('should convert https to wss', () => {
      jest.resetModules();
      jest.doMock('expo-constants', () => ({
        expoConfig: {
          extra: {
            api: {
              baseUrl: 'https://secure-api.example.com',
            },
          },
        },
      }));

      const wsModule = require('@/services/websocket');
      const client = new wsModule.NaviKidWebSocketClient();
      expect(client['url']).toBe('wss://secure-api.example.com/ws/locations');
    });
  });

  describe('Connection Management', () => {
    describe('connect', () => {
      it('should create WebSocket connection', () => {
        const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();
        newClient.connect('test-token');

        expect(newClient['ws']).toBeDefined();
        expect(newClient['accessToken']).toBe('test-token');
      });

      it('should include auth token in URL', () => {
        const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();
        newClient.connect('test-token-123');

        // Should include the token in URL
        expect(newClient['ws'].url).toContain('token=test-token-123');
        expect(newClient['ws'].url).toMatch(/wss?:\/\/.*\/ws\/locations\?token=test-token-123/);
      });

      it('should not reconnect if already connected', () => {
        // Set up spy after beforeEach connection
        const createSpy = jest.spyOn(global as any, 'WebSocket');
        createSpy.mockClear();

        // Ensure the connection is in OPEN state
        mockWs.readyState = MockWebSocket.OPEN;

        // Verify we're connected
        expect(wsClient.isConnected()).toBe(true);

        // Try to connect again - should be a no-op
        wsClient.connect();

        // Should not have created a new WebSocket
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should not connect if connection is in progress', () => {
        const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();
        newClient['isConnecting'] = true;

        const createSpy = jest.spyOn(global as any, 'WebSocket');
        newClient.connect();

        // Should not create new WebSocket
        expect(createSpy).not.toHaveBeenCalled();
      });

      it('should emit connection status on successful connection', (done) => {
        const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();

        newClient.on('connection_status', (status: ConnectionStatus) => {
          expect(status.connected).toBe(true);
          expect(status.reconnecting).toBe(false);
          done();
        });

        newClient.connect();
        jest.advanceTimersByTime(20);
      });

      it('should reset reconnect attempts on successful connection', () => {
        const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();
        newClient['reconnectAttempts'] = 3;

        newClient.connect();
        jest.advanceTimersByTime(20);

        expect(newClient['reconnectAttempts']).toBe(0);
      });

      it('should start heartbeat on connection', () => {
        const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();

        newClient.connect();
        jest.advanceTimersByTime(20);

        expect(newClient['heartbeatTimer']).toBeDefined();
      });
    });

    describe('disconnect', () => {
      it('should close WebSocket connection', () => {
        const closeSpy = jest.spyOn(mockWs, 'close');

        wsClient.disconnect();

        expect(closeSpy).toHaveBeenCalledWith(1000, 'Client disconnect');
        expect(wsClient['ws']).toBeNull();
      });

      it('should stop heartbeat', () => {
        wsClient.disconnect();

        expect(wsClient['heartbeatTimer']).toBeNull();
      });

      it('should clear reconnect timer', () => {
        wsClient['reconnectTimer'] = setTimeout(() => {}, 1000);

        wsClient.disconnect();

        expect(wsClient['reconnectTimer']).toBeNull();
      });

      it('should emit connection status', (done) => {
        let disconnectEventReceived = false;
        
        wsClient.on('connection_status', (status: ConnectionStatus) => {
          if (!status.connected && !status.reconnecting && !disconnectEventReceived) {
            disconnectEventReceived = true;
            done();
          }
        });

        wsClient.disconnect();
      });

      it('should set intentionally closed flag', () => {
        wsClient.disconnect();

        expect(wsClient['isIntentionallyClosed']).toBe(true);
      });
    });

    describe('reconnection', () => {
      it('should schedule reconnect on unexpected close', () => {
        wsClient['isIntentionallyClosed'] = false;

        // Simulate unexpected close
        mockWs.close(1006, 'Connection lost');

        expect(wsClient['reconnectTimer']).toBeDefined();
      });

      it('should not reconnect if intentionally closed', () => {
        wsClient.disconnect();

        // Clear any existing timers
        jest.clearAllTimers();

        // Simulate close (already intentionally closed)
        expect(wsClient['reconnectTimer']).toBeNull();
      });

      it('should use exponential backoff for reconnection', () => {
        wsClient['isIntentionallyClosed'] = false;
        wsClient['reconnectAttempts'] = 0;

        // First reconnect attempt
        mockWs.close(1006, 'Connection lost');
        const delay1 = 1000 * Math.pow(2, 0); // 1000ms

        jest.advanceTimersByTime(delay1 - 1);
        expect(wsClient['reconnectAttempts']).toBe(0);

        jest.advanceTimersByTime(1);
        expect(wsClient['reconnectAttempts']).toBe(1);
      });

      it('should stop reconnecting after max attempts', () => {
        wsClient['isIntentionallyClosed'] = false;
        wsClient['reconnectAttempts'] = 5; // At max attempts

        // Clear any existing timer
        wsClient['clearReconnectTimer']();
        
        // This should not set a timer since we're at max attempts
        wsClient['scheduleReconnect']();

        expect(wsClient['reconnectTimer']).toBeNull();
      });

      it('should emit reconnecting status', (done) => {
        wsClient['isIntentionallyClosed'] = false;

        wsClient.on('connection_status', (status: ConnectionStatus) => {
          if (status.reconnecting) {
            expect(status.connected).toBe(false);
            done();
          }
        });

        mockWs.close(1006, 'Connection lost');
      });
    });
  });

  describe('Heartbeat', () => {
    it('should send ping messages periodically', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');

      // Advance time by heartbeat interval (30000ms)
      jest.advanceTimersByTime(30000);

      expect(sendSpy).toHaveBeenCalled();
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.type).toBe('ping');
    });

    it('should not send heartbeat if connection is closed', () => {
      const sendSpy = jest.spyOn(mockWs, 'send');
      mockWs.readyState = MockWebSocket.CLOSED;

      jest.advanceTimersByTime(30000);

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should stop heartbeat when disconnected', () => {
      wsClient.disconnect();

      expect(wsClient['heartbeatTimer']).toBeNull();
    });
  });

  describe('Message Handling', () => {
    describe('receiving messages', () => {
      it('should handle location update messages', (done) => {
        const mockLocationUpdate: LocationUpdate = {
          userId: 'user-123',
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 20,
          timestamp: '2025-01-01T00:00:00Z',
        };

        wsClient.onLocationUpdate((data: LocationUpdate) => {
          expect(data).toEqual(mockLocationUpdate);
          done();
        });

        const message: WebSocketMessage = {
          type: 'location_update',
          data: mockLocationUpdate,
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should handle geofence alert messages', (done) => {
        const mockAlert: GeofenceAlert = {
          safeZoneId: 'zone-123',
          safeZoneName: 'Home',
          type: 'exit',
          location: { latitude: 40.7128, longitude: -74.006 },
          timestamp: '2025-01-01T00:00:00Z',
        };

        wsClient.onGeofenceAlert((data: GeofenceAlert) => {
          expect(data).toEqual(mockAlert);
          done();
        });

        const message: WebSocketMessage = {
          type: 'geofence_alert',
          data: mockAlert,
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should handle emergency alert messages', (done) => {
        const mockAlert: EmergencyAlertMessage = {
          alertId: 'alert-123',
          userId: 'user-123',
          triggerReason: 'Manual trigger',
          location: { latitude: 40.7128, longitude: -74.006 },
          timestamp: '2025-01-01T00:00:00Z',
        };

        wsClient.onEmergencyAlert((data: EmergencyAlertMessage) => {
          expect(data).toEqual(mockAlert);
          done();
        });

        const message: WebSocketMessage = {
          type: 'emergency_alert',
          data: mockAlert,
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should handle malformed messages gracefully', () => {
        // This should not throw
        if (mockWs.onmessage) {
          mockWs.onmessage({ data: 'invalid json{' });
        }

        // Should log error but not crash
        expect(true).toBe(true);
      });
    });

    describe('sending messages', () => {
      it('should send messages when connected', () => {
        const data = { type: 'test', payload: 'data' };
        const sendSpy = jest.spyOn(mockWs, 'send');

        wsClient.send(data);

        expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(data));
      });

      it('should not send messages when disconnected', () => {
        mockWs.readyState = MockWebSocket.CLOSED;
        const sendSpy = jest.spyOn(mockWs, 'send');

        wsClient.send({ type: 'test' });

        expect(sendSpy).not.toHaveBeenCalled();
      });

      it('should handle send errors gracefully', () => {
        jest.spyOn(mockWs, 'send').mockImplementation(() => {
          throw new Error('Send failed');
        });

        // Should not throw
        expect(() => {
          wsClient.send({ type: 'test' });
        }).not.toThrow();
      });
    });
  });

  describe('Event Listeners', () => {
    describe('on / off', () => {
      it('should register event listener', (done) => {
        wsClient.on('location_update', (data: any) => {
          expect(data.userId).toBe('test-user');
          done();
        });

        const message: WebSocketMessage = {
          type: 'location_update',
          data: { userId: 'test-user' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should return unsubscribe function', () => {
        const callback = jest.fn();
        const unsubscribe = wsClient.on('location_update', callback);

        expect(typeof unsubscribe).toBe('function');
      });

      it('should unsubscribe listener', () => {
        const callback = jest.fn();
        const unsubscribe = wsClient.on('location_update', callback);

        const message: WebSocketMessage = {
          type: 'location_update',
          data: { userId: 'test' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
        expect(callback).toHaveBeenCalledTimes(1);

        unsubscribe();
        mockWs.simulateMessage(message);
        expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
      });

      it('should remove listener with off method', () => {
        const callback = jest.fn();
        wsClient.on('location_update', callback);

        const message: WebSocketMessage = {
          type: 'location_update',
          data: { userId: 'test' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
        expect(callback).toHaveBeenCalledTimes(1);

        wsClient.off('location_update', callback);
        mockWs.simulateMessage(message);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should support multiple listeners for same event', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        wsClient.on('location_update', callback1);
        wsClient.on('location_update', callback2);

        const message: WebSocketMessage = {
          type: 'location_update',
          data: { userId: 'test' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('should handle listener errors gracefully', () => {
        wsClient.on('location_update', () => {
          throw new Error('Listener error');
        });

        const goodCallback = jest.fn();
        wsClient.on('location_update', goodCallback);

        const message: WebSocketMessage = {
          type: 'location_update',
          data: { userId: 'test' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        // Should not throw despite error in first listener
        mockWs.simulateMessage(message);

        // Good callback should still be called
        expect(goodCallback).toHaveBeenCalled();
      });
    });

    describe('convenience methods', () => {
      it('should support onLocationUpdate', (done) => {
        wsClient.onLocationUpdate((data: LocationUpdate) => {
          expect(data.userId).toBe('test-user');
          done();
        });

        const message: WebSocketMessage = {
          type: 'location_update',
          data: { userId: 'test-user' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should support onGeofenceAlert', (done) => {
        wsClient.onGeofenceAlert((data: GeofenceAlert) => {
          expect(data.safeZoneId).toBe('zone-123');
          done();
        });

        const message: WebSocketMessage = {
          type: 'geofence_alert',
          data: { safeZoneId: 'zone-123' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should support onEmergencyAlert', (done) => {
        wsClient.onEmergencyAlert((data: EmergencyAlertMessage) => {
          expect(data.alertId).toBe('alert-123');
          done();
        });

        const message: WebSocketMessage = {
          type: 'emergency_alert',
          data: { alertId: 'alert-123' },
          timestamp: '2025-01-01T00:00:00Z',
        };

        mockWs.simulateMessage(message);
      });

      it('should support onConnectionStatus', (done) => {
        let statusReceived = false;
        
        wsClient.onConnectionStatus((status: ConnectionStatus) => {
          if (!statusReceived) {
            statusReceived = true;
            expect(status.connected).toBeDefined();
            done();
          }
        });

        wsClient.disconnect();
      });
    });
  });

  describe('Status', () => {
    describe('isConnected', () => {
      it('should return true when connected', () => {
        mockWs.readyState = MockWebSocket.OPEN;
        expect(wsClient.isConnected()).toBe(true);
      });

      it('should return false when not connected', () => {
        mockWs.readyState = MockWebSocket.CLOSED;
        expect(wsClient.isConnected()).toBe(false);
      });
    });

    describe('getConnectionState', () => {
      it('should return connecting state', () => {
        mockWs.readyState = MockWebSocket.CONNECTING;
        expect(wsClient.getConnectionState()).toBe('connecting');
      });

      it('should return open state', () => {
        mockWs.readyState = MockWebSocket.OPEN;
        expect(wsClient.getConnectionState()).toBe('open');
      });

      it('should return closing state', () => {
        mockWs.readyState = MockWebSocket.CLOSING;
        expect(wsClient.getConnectionState()).toBe('closing');
      });

      it('should return closed state', () => {
        mockWs.readyState = MockWebSocket.CLOSED;
        expect(wsClient.getConnectionState()).toBe('closed');
      });

      it('should return closed if no WebSocket instance', () => {
        wsClient['ws'] = null;
        expect(wsClient.getConnectionState()).toBe('closed');
      });
    });

    describe('setAccessToken', () => {
      it('should update access token', () => {
        wsClient.setAccessToken('new-token');
        expect(wsClient['accessToken']).toBe('new-token');
      });

      it('should reconnect if currently connected', () => {
        const disconnectSpy = jest.spyOn(wsClient, 'disconnect');
        const connectSpy = jest.spyOn(wsClient, 'connect');

        mockWs.readyState = MockWebSocket.OPEN;
        wsClient.setAccessToken('new-token');

        expect(disconnectSpy).toHaveBeenCalled();
        expect(connectSpy).toHaveBeenCalled();
      });

      it('should not reconnect if not connected', () => {
        const disconnectSpy = jest.spyOn(wsClient, 'disconnect');
        const connectSpy = jest.spyOn(wsClient, 'connect');

        mockWs.readyState = MockWebSocket.CLOSED;
        wsClient.setAccessToken('new-token');

        expect(disconnectSpy).not.toHaveBeenCalled();
        expect(connectSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors', () => {
      const errorCallback = jest.fn();
      wsClient.on('connection_status', errorCallback);

      mockWs.simulateError(new Error('Connection error'));

      // Should not crash
      expect(wsClient['isConnecting']).toBe(false);
    });

    it('should handle connection creation errors', () => {
      jest.spyOn(global as any, 'WebSocket').mockImplementation(() => {
        throw new Error('Cannot create WebSocket');
      });

      const newClient = new (require('@/services/websocket').NaviKidWebSocketClient)();

      // Should not throw
      expect(() => {
        newClient.connect();
      }).not.toThrow();

      // Should schedule reconnect
      expect(newClient['reconnectTimer']).toBeDefined();
    });
  });
});
