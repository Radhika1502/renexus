import { useEffect, useRef, useCallback, useState } from 'react';

type MessageHandler = (message: any) => void;

interface WebSocketMessage {
  type: string;
  payload: any;
  metadata?: {
    timestamp: number;
    userId?: string;
    clientId?: string;
  };
}

export const useWebSocket = (url: string, onMessage?: MessageHandler) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messageHandlers = useRef<Map<string, MessageHandler[]>>(new Map());

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current) return;

    const socket = new WebSocket(url);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Call the general message handler if provided
        if (onMessage) {
          onMessage(message);
        }
        
        // Call specific handlers for this message type
        const handlers = messageHandlers.current.get(message.type) || [];
        handlers.forEach(handler => handler(message.payload));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      ws.current = null;
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.current = socket;
  }, [url, onMessage]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);
    }
  }, []);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((type: string, payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        metadata: {
          timestamp: Date.now(),
        },
      };
      ws.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);
  
  // Subscribe to a specific message type
  const subscribe = useCallback((messageType: string, handler: MessageHandler) => {
    const handlers = messageHandlers.current.get(messageType) || [];
    if (!handlers.includes(handler)) {
      handlers.push(handler);
      messageHandlers.current.set(messageType, handlers);
    }
    
    // Return cleanup function
    return () => {
      const updatedHandlers = (messageHandlers.current.get(messageType) || []).filter(h => h !== handler);
      if (updatedHandlers.length > 0) {
        messageHandlers.current.set(messageType, updatedHandlers);
      } else {
        messageHandlers.current.delete(messageType);
      }
    };
  }, []);
  
  // Authenticate the WebSocket connection
  const authenticate = useCallback((userId: string, token: string) => {
    return sendMessage('AUTHENTICATE', { userId, token });
  }, [sendMessage]);
  
  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    return sendMessage('JOIN_ROOM', { roomId });
  }, [sendMessage]);
  
  // Leave a room
  const leaveRoom = useCallback((roomId: string) => {
    return sendMessage('LEAVE_ROOM', { roomId });
  }, [sendMessage]);

  // Set up connection on mount and clean up on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected,
    sendMessage,
    subscribe,
    authenticate,
    joinRoom,
    leaveRoom,
  };
};

export default useWebSocket;
