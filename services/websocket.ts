/**
 * NaviKid WebSocket Client
 *
 * Provides real-time bidirectional communication with the backend.
 * Handles location updates, alerts, and system messages.
 */

import Constants from 'expo-constants';
import { log } from '@/utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type WebSocketEventType =
  | 'location_update'
  | 'geofence_alert'
  | 'emergency_alert'
  | 'system_message'
  | 'connection_status';

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export interface LocationUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface GeofenceAlert {
  safeZoneId: string;
  safeZoneName: string;
  type: 'enter' | 'exit';
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface EmergencyAlertMessage {
  alertId: string;
  userId: string;
  triggerReason: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
}

type EventCallback<T = any> = (data: T) => void;

// ============================================================================
// WebSocket Client Class
// ============================================================================

class NaviKidWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private accessToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval = 30000; // 30 seconds
  private isConnecting = false;
  private isIntentionallyClosed = false;
  private listeners: Map<WebSocketEventType, Set<EventCallback>> = new Map();

  constructor() {
    const extra = Constants.expoConfig?.extra;
    const baseUrl = extra?.api?.baseUrl || 'http://localhost:3000';

    // Convert http(s):// to ws(s)://
    this.url = baseUrl.replace(/^http/, 'ws') + '/ws/locations';

    log.info('WebSocket Client initialized', { url: this.url });
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  connect(accessToken?: string): void {
    if (accessToken) {
      this.accessToken = accessToken;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      log.debug('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      log.debug('WebSocket connection already in progress');
      return;
    }

    this.isIntentionallyClosed = false;
    this.isConnecting = true;

    try {
      log.info('Connecting to WebSocket', { url: this.url });

      // Add auth token to URL if available
      const wsUrl = this.accessToken
        ? `${this.url}?token=${encodeURIComponent(this.accessToken)}`
        : this.url;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        log.info('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connection_status', { connected: true, reconnecting: false });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          log.debug('WebSocket message received', { type: message.type });
          this.handleMessage(message);
        } catch (error) {
          log.error('Failed to parse WebSocket message', error as Error);
        }
      };

      this.ws.onerror = (error) => {
        log.error('WebSocket error', error as any);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        log.info('WebSocket closed', { code: event.code, reason: event.reason });
        this.isConnecting = false;
        this.stopHeartbeat();

        if (!this.isIntentionallyClosed) {
          this.emit('connection_status', { connected: false, reconnecting: true });
          this.scheduleReconnect();
        } else {
          this.emit('connection_status', { connected: false, reconnecting: false });
        }
      };
    } catch (error) {
      log.error('Failed to create WebSocket connection', error as Error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    log.info('Disconnecting WebSocket');
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.emit('connection_status', { connected: false, reconnecting: false });
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.warn('Max reconnect attempts reached');
      this.emit('connection_status', { connected: false, reconnecting: false });
      return;
    }

    this.clearReconnectTimer();

    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    log.info(
      `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ==========================================================================
  // Heartbeat (Keep-Alive)
  // ==========================================================================

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.send({ type: 'ping', timestamp: new Date().toISOString() });
        } catch (error) {
          log.error('Failed to send heartbeat', error as Error);
        }
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  private handleMessage(message: WebSocketMessage): void {
    // Emit to all listeners for this message type
    this.emit(message.type, message.data);
  }

  send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      log.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      log.error('Failed to send WebSocket message', error as Error);
    }
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  on<T = any>(event: WebSocketEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  off(event: WebSocketEventType, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: WebSocketEventType, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          log.error('Error in WebSocket event listener', error as Error);
        }
      });
    }
  }

  // ==========================================================================
  // Convenience Methods
  // ==========================================================================

  onLocationUpdate(callback: EventCallback<LocationUpdate>): () => void {
    return this.on<LocationUpdate>('location_update', callback);
  }

  onGeofenceAlert(callback: EventCallback<GeofenceAlert>): () => void {
    return this.on<GeofenceAlert>('geofence_alert', callback);
  }

  onEmergencyAlert(callback: EventCallback<EmergencyAlertMessage>): () => void {
    return this.on<EmergencyAlertMessage>('emergency_alert', callback);
  }

  onConnectionStatus(callback: EventCallback<ConnectionStatus>): () => void {
    return this.on<ConnectionStatus>('connection_status', callback);
  }

  // ==========================================================================
  // Status
  // ==========================================================================

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;

    // Reconnect with new token if currently connected
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const wsClient = new NaviKidWebSocketClient();
export { NaviKidWebSocketClient };
export default wsClient;
