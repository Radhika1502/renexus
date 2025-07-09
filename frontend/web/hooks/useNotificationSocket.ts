import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface NotificationSocketOptions {
  onNotification?: (notification: any) => void;
  onNotificationUpdate?: (update: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: any) => void;
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
          }, reconnectInterval);
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
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'notification':
              onNotification?.(data.data);
              break;
            case 'notification_update':
              onNotificationUpdate?.(data.data);
              break;
            case 'connection':
              console.log('WebSocket connection status:', data.data);
              break;
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
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
