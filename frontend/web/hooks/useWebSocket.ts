import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { WebSocketService, WebSocketMessage, ConnectionState, WebSocketConfig } from '../services/websocket.service';
import { useAuth } from './useAuth';

interface UseWebSocketConfig extends Partial<WebSocketConfig> {
  onMessage?: (data: any) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

interface UseWebSocketResult {
  connectionState: ConnectionState;
  error: Error | null;
  sendMessage: (message: WebSocketMessage) => void;
  sendWithResponse: (message: WebSocketMessage) => Promise<any>;
  reconnect: () => void;
}

export const useWebSocket = (config?: UseWebSocketConfig): UseWebSocketResult => {
  const { token } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const wsService = useRef(WebSocketService.getInstance());

  useEffect(() => {
    if (!token) return;

    // Configure the service if options are provided
    if (config) {
      wsService.current.configure(config);
    }

    // Setup event handlers
    const unsubscribeState = wsService.current.onConnectionStateChange((state) => {
      setConnectionState(state);
      config?.onConnectionStateChange?.(state);

      // Handle connection state changes
      switch (state) {
        case 'connected':
          setError(null);
          break;
        case 'max_retries_reached':
          setError(new Error('Failed to connect after maximum retry attempts'));
          break;
      }
    });

    const unsubscribeError = wsService.current.onError((err) => {
      setError(err);
      config?.onError?.(err);
    });

    // Setup message handlers
    const unsubscribeMessage = wsService.current.subscribe('*', (data) => {
      config?.onMessage?.(data);

      // Handle different message types
      switch (data.type) {
        case 'ENTITY_UPDATED':
          // Invalidate related queries
          queryClient.invalidateQueries(data.payload.entityType);
          break;

        case 'NOTIFICATION':
          // Handle notifications
          break;

        case 'PRESENCE_UPDATE':
          // Handle presence updates
          break;
      }
    });

    // Connect to WebSocket server
    wsService.current.connect(token).catch((err) => {
      setError(err);
      config?.onError?.(err);
    });

    // Cleanup
    return () => {
      unsubscribeState();
      unsubscribeError();
      unsubscribeMessage();
      wsService.current.disconnect();
    };
  }, [token, config, queryClient]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsService.current.send(message);
  }, []);

  const sendWithResponse = useCallback(async (message: WebSocketMessage) => {
    return wsService.current.sendWithResponse(message);
  }, []);

  const reconnect = useCallback(() => {
    wsService.current.reconnect();
  }, []);

  return {
    connectionState,
    error,
    sendMessage,
    sendWithResponse,
    reconnect
  };
};

// Task-specific hook
export const useTaskWebSocket = (taskId: string) => {
  const { connectionState, error, sendMessage } = useWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const wsService = useRef(WebSocketService.getInstance());

  useEffect(() => {
    if (connectionState !== 'connected' || !taskId || isSubscribed) return;

    let unsubscribe: (() => void) | undefined;

    wsService.current.subscribeToTaskUpdates(taskId, (update) => {
      // Handle task updates
    }).then((unsub) => {
      unsubscribe = unsub;
      setIsSubscribed(true);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
        setIsSubscribed(false);
      }
    };
  }, [connectionState, taskId, isSubscribed]);

  const sendTaskUpdate = useCallback((update: any) => {
    sendMessage({
      type: 'TASK_UPDATE',
      payload: {
        taskId,
        ...update
      }
    });
  }, [taskId, sendMessage]);

  return {
    connectionState,
    error,
    isSubscribed,
    sendTaskUpdate
  };
};

// Project-specific hook
export const useProjectWebSocket = (projectId: string) => {
  const { connectionState, error, sendMessage } = useWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const wsService = useRef(WebSocketService.getInstance());

  useEffect(() => {
    if (connectionState !== 'connected' || !projectId || isSubscribed) return;

    let unsubscribe: (() => void) | undefined;

    wsService.current.subscribeToProjectUpdates(projectId, (update) => {
      // Handle project updates
    }).then((unsub) => {
      unsubscribe = unsub;
      setIsSubscribed(true);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
        setIsSubscribed(false);
      }
    };
  }, [connectionState, projectId, isSubscribed]);

  const sendProjectUpdate = useCallback((update: any) => {
    sendMessage({
      type: 'PROJECT_UPDATE',
      payload: {
        projectId,
        ...update
      }
    });
  }, [projectId, sendMessage]);

  return {
    connectionState,
    error,
    isSubscribed,
    sendProjectUpdate
  };
};

// Presence-specific hook
export const usePresenceWebSocket = (projectId: string) => {
  const { connectionState, error, sendMessage } = useWebSocket();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const wsService = useRef(WebSocketService.getInstance());

  useEffect(() => {
    if (connectionState !== 'connected' || !projectId || isSubscribed) return;

    let unsubscribe: (() => void) | undefined;

    wsService.current.subscribeToUserPresence(projectId, (presence) => {
      // Handle presence updates
    }).then((unsub) => {
      unsubscribe = unsub;
      setIsSubscribed(true);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
        setIsSubscribed(false);
      }
    };
  }, [connectionState, projectId, isSubscribed]);

  const updatePresence = useCallback((status: 'online' | 'away' | 'offline') => {
    sendMessage({
      type: 'PRESENCE_UPDATE',
      payload: {
        projectId,
        status
      }
    });
  }, [projectId, sendMessage]);

  return {
    connectionState,
    error,
    isSubscribed,
    updatePresence
  };
};
