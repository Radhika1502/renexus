import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface PresenceUser {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastActivity: string;
}

interface UsePresenceOptions {
  userId: string;
  userName: string;
  projectId?: string;
  inactivityTimeout?: number;
}

export const usePresence = ({
  userId,
  userName,
  projectId,
  inactivityTimeout = 300000 // 5 minutes
}: UsePresenceOptions) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [userStatus, setUserStatus] = useState<PresenceUser['status']>('online');
  const [lastActivity, setLastActivity] = useState<string>(new Date().toISOString());
  
  const { isConnected, sendMessage } = useWebSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL}/presence`,
    onMessage: (data) => {
      if (data.type === 'PRESENCE_UPDATE') {
        setOnlineUsers(prev => {
          const filtered = prev.filter(user => user.id !== data.payload.userId);
          if (data.payload.status !== 'offline') {
            return [...filtered, data.payload];
          }
          return filtered;
        });
      }
    }
  });

  // Update user's own presence
  const updatePresence = useCallback((status: PresenceUser['status']) => {
    if (!isConnected) return;

    const presence: PresenceUser = {
      id: userId,
      name: userName,
      status,
      lastActivity: new Date().toISOString()
    };

    sendMessage({
      type: 'PRESENCE_UPDATE',
      payload: presence
    });

    setUserStatus(status);
    setLastActivity(presence.lastActivity);
  }, [isConnected, sendMessage, userId, userName]);

  // Handle user activity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      if (userStatus === 'away') {
        updatePresence('online');
      }
      
      inactivityTimer = setTimeout(() => {
        updatePresence('away');
      }, inactivityTimeout);
    };

    const handleActivity = () => {
      resetTimer();
    };

    // Track user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [inactivityTimeout, updatePresence, userStatus]);

  // Send initial presence and handle cleanup
  useEffect(() => {
    if (isConnected) {
      updatePresence('online');
    }

    return () => {
      if (isConnected) {
        updatePresence('offline');
      }
    };
  }, [isConnected, updatePresence]);

  return {
    onlineUsers,
    userStatus,
    lastActivity,
    updatePresence
  };
}; 