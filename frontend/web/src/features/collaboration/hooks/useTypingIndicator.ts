import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../../../contexts/WebSocketContext';

export interface TypingUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
}

export function useTypingIndicator(taskId: string, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { sendMessage, subscribe, isConnected } = useWebSocketContext();

  // Handle incoming typing indicators
  useEffect(() => {
    if (!isConnected || !taskId) return;

    const handleTypingEvent = (data: any) => {
      if (data.payload.taskId !== taskId || data.payload.userId === currentUserId) {
        return;
      }

      // Clear existing timeout for this user
      setTypingUsers(prev => {
        const existingUserIndex = prev.findIndex(u => u.userId === data.payload.userId);
        
        if (data.payload.isTyping) {
          // Add or update typing user
          const userInfo = {
            userId: data.payload.userId,
            userName: data.payload.userName || `User ${data.payload.userId.slice(0, 4)}`,
            avatarUrl: data.payload.avatarUrl,
          };
          
          if (existingUserIndex >= 0) {
            const updated = [...prev];
            updated[existingUserIndex] = userInfo;
            return updated;
          } else {
            return [...prev, userInfo];
          }
        } else {
          // Remove user from typing list
          return prev.filter(u => u.userId !== data.payload.userId);
        }
      });

      // Set a timeout to remove the typing indicator if no updates are received
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      if (data.payload.isTyping) {
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.payload.userId));
        }, 5000); // 5 seconds of inactivity
        setTypingTimeout(timeout);
      }
    };

    const unsubscribe = subscribe('USER_TYPING', handleTypingEvent);
    return () => {
      unsubscribe();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [taskId, currentUserId, isConnected, typingTimeout]);

  // Function to notify other users that the current user is typing
  const setTyping = useCallback((isTyping: boolean, userInfo?: { userName: string; avatarUrl?: string }) => {
    if (!isConnected || !taskId || !currentUserId) return;
    
    sendMessage('TYPING_INDICATOR', {
      taskId,
      isTyping,
      userId: currentUserId,
      ...(userInfo && { 
        userName: userInfo.userName,
        avatarUrl: userInfo.avatarUrl 
      })
    });
  }, [isConnected, taskId, currentUserId, sendMessage]);

  // Get the typing indicator text (e.g., "John is typing...")
  const getTypingText = useCallback(() => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing...`;
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    }
    
    return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`;
  }, [typingUsers]);

  return {
    typingUsers,
    typingText: getTypingText(),
    setTyping,
  };
}
