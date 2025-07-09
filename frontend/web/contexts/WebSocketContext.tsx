import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  sendMessage: (type: string, payload: any) => boolean;
  subscribe: (messageType: string, handler: (message: any) => void) => () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const messageHandlers = useRef<Map<string, ((message: any) => void)[]>>(new Map());
  
  const { 
    isConnected, 
    sendMessage, 
    subscribe: wsSubscribe,
    authenticate,
  } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    (message: WebSocketMessage) => {
      // Handle incoming messages
      const handlers = messageHandlers.current.get(message.type) || [];
      handlers.forEach(handler => handler(message.payload));
    }
  );

  // Authenticate when user logs in
  useEffect(() => {
    if (user && isConnected) {
      authenticate(user.id, user.token);
    }
  }, [user, isConnected, authenticate]);

  // Subscribe to a message type
  const subscribe = (messageType: string, handler: (message: any) => void) => {
    // Add to our local handlers
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
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
