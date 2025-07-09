import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationUpdate {
  id: string;
  changes: Partial<NotificationData>;
}

interface WebSocketMessage {
  type: 'notification' | 'notification_update' | 'connection';
  data: NotificationData | NotificationUpdate | { status: string };
  error?: string;
}

interface NotificationSocketOptions {
  onNotification?: (notification: NotificationData) => void;
  onNotificationUpdate?: (update: NotificationUpdate) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Custom hook for WebSocket connection to notification service
 */
export const useNotificationSocket = ({
  onNotification,
  onNotificationUpdate,
  onConnectionChange,
  onError,
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: NotificationSocketOptions = {}) => {
  const { user, accessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function for WebSocket connection
  const cleanUp = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Validate notification data
  const validateNotification = (data: any): data is NotificationData => {
    return (
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.title === 'string' &&
      typeof data.message === 'string' &&
      ['info', 'success', 'warning', 'error'].includes(data.type) &&
      typeof data.createdAt === 'string' &&
      typeof data.read === 'boolean'
    );
  };

  // Validate notification update
  const validateNotificationUpdate = (data: any): data is NotificationUpdate => {
    return (
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.changes === 'object'
    );
  };

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!user || !accessToken) return;

    // Clean up existing connection if any
    cleanUp();

    try {
      // Create WebSocket connection with authentication
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/notifications/ws?userId=${user.id}&token=${accessToken}`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
        console.log('WebSocket connection established');
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        onConnectionChange?.(false);
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);

        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1)); // Exponential backoff
        }
      };

      socket.onerror = (event) => {
        const wsError = new Error('WebSocket connection error');
        setError(wsError);
        onError?.(wsError);
        console.error('WebSocket error:', event);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle different message types
          switch (message.type) {
            case 'notification': {
              const notification = message.data as NotificationData;
              if (validateNotification(notification)) {
                onNotification?.(notification);
              } else {
                console.error('Invalid notification data:', notification);
              }
              break;
            }
            case 'notification_update': {
              const update = message.data as NotificationUpdate;
              if (validateNotificationUpdate(update)) {
                onNotificationUpdate?.(update);
              } else {
                console.error('Invalid notification update:', update);
              }
              break;
            }
            case 'connection':
              console.log('WebSocket connection status:', message.data);
              break;
            default:
              console.warn('Unknown WebSocket message type:', message.type);
          }

          // Handle error field if present
          if (message.error) {
            const wsError = new Error(message.error);
            setError(wsError);
            onError?.(wsError);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
          const error = err instanceof Error ? err : new Error('Failed to process WebSocket message');
          setError(error);
          onError?.(error);
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to WebSocket server');
      setError(error);
      onError?.(error);
      console.error('WebSocket connection error:', error);
    }
  }, [user, accessToken, cleanUp, autoReconnect, maxReconnectAttempts, reconnectInterval, onConnectionChange, onError, onNotification, onNotificationUpdate]);

  // Reconnect manually
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Disconnect manually
  const disconnect = useCallback(() => {
    cleanUp();
    setIsConnected(false);
    onConnectionChange?.(false);
  }, [cleanUp, onConnectionChange]);

  // Connect on mount and when user/token changes
  useEffect(() => {
    if (user && accessToken) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      cleanUp();
    };
  }, [user, accessToken, connect, disconnect, cleanUp]);

  return {
    isConnected,
    error,
    reconnect,
    disconnect
  };
};
