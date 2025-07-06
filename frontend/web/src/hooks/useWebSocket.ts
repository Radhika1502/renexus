import { useEffect, useRef, useCallback } from 'react';
import { WebSocketClient, createWebSocketClient } from '../services/websocket';
import { useGlobalState } from './useGlobalState';
import { useQueryClient } from 'react-query';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocketClient | null>(null);
  const { isAuthenticated } = useGlobalState();

  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = createWebSocketClient();
    }

    if (isAuthenticated) {
      wsRef.current.connect(localStorage.getItem('auth_token') || '');
    }

    return () => {
      wsRef.current?.disconnect();
    };
  }, [isAuthenticated]);

  const subscribe = useCallback((type: string, handler: (data: any) => void) => {
    return wsRef.current?.subscribe(type, handler);
  }, []);

  const send = useCallback((type: string, data: any) => {
    wsRef.current?.send(type, data);
  }, []);

  return {
    subscribe,
    send,
  };
};

export const useRealTimeUpdates = () => {
  const { subscribe } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribeTask = subscribe('task:update', (data) => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['task', data.id]);
    });

    const unsubscribeProject = subscribe('project:update', (data) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['project', data.id]);
    });

    const unsubscribeNotification = subscribe('notification:new', (data) => {
      queryClient.invalidateQueries(['notifications']);
    });

    return () => {
      unsubscribeTask?.();
      unsubscribeProject?.();
      unsubscribeNotification?.();
    };
  }, [subscribe, queryClient]);
};
