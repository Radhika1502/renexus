import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  location: {
    type: 'project' | 'task' | 'document';
    id: string;
    path?: string;
  };
  lastActive: Date;
  status: 'online' | 'away' | 'offline';
}

interface CollaborationContextType {
  isConnected: boolean;
  activeUsers: UserPresence[];
  sendMessage: (channel: string, message: any) => void;
  subscribeToChannel: (channel: string, callback: (message: any) => void) => () => void;
  updatePresence: (location: UserPresence['location']) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [subscriptions, setSubscriptions] = useState<Map<string, Set<(message: any) => void>>>(
    new Map()
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send initial presence
      ws.send(JSON.stringify({
        type: 'presence',
        action: 'join',
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      }));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case 'presence':
            handlePresenceUpdate(data);
            break;
          case 'message':
            handleChannelMessage(data);
            break;
          default:
            console.log('Unknown message type:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(ws);

    // Set up heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);

    // Clean up on unmount
    return () => {
      clearInterval(heartbeatInterval);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'presence',
          action: 'leave',
          userId: user.id
        }));
        ws.close();
      }
    };
  }, [user]);

  // Handle presence updates
  const handlePresenceUpdate = useCallback((data: any) => {
    if (data.action === 'update') {
      setActiveUsers(data.users);
    }
  }, []);

  // Handle channel messages
  const handleChannelMessage = useCallback((data: any) => {
    const { channel, message } = data;
    const callbacks = subscriptions.get(channel);
    
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }, [subscriptions]);

  // Send message to a specific channel
  const sendMessage = useCallback((channel: string, message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message',
        channel,
        message
      }));
    }
  }, [socket]);

  // Subscribe to a channel
  const subscribeToChannel = useCallback((channel: string, callback: (message: any) => void) => {
    setSubscriptions(prev => {
      const newSubscriptions = new Map(prev);
      const channelCallbacks = newSubscriptions.get(channel) || new Set();
      channelCallbacks.add(callback);
      newSubscriptions.set(channel, channelCallbacks);
      return newSubscriptions;
    });

    // Subscribe to channel on server
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }

    // Return unsubscribe function
    return () => {
      setSubscriptions(prev => {
        const newSubscriptions = new Map(prev);
        const channelCallbacks = newSubscriptions.get(channel);
        
        if (channelCallbacks) {
          channelCallbacks.delete(callback);
          
          if (channelCallbacks.size === 0) {
            newSubscriptions.delete(channel);
            
            // Unsubscribe from channel on server
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'unsubscribe',
                channel
              }));
            }
          } else {
            newSubscriptions.set(channel, channelCallbacks);
          }
        }
        
        return newSubscriptions;
      });
    };
  }, [socket]);

  // Update user presence
  const updatePresence = useCallback((location: UserPresence['location']) => {
    if (socket?.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify({
        type: 'presence',
        action: 'update',
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        },
        location
      }));
    }
  }, [socket, user]);

  const value = {
    isConnected,
    activeUsers,
    sendMessage,
    subscribeToChannel,
    updatePresence
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};
