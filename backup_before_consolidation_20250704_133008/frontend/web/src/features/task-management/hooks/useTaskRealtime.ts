import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService, WebSocketEventType, WebSocketMessage, UserPresence } from '../services/websocket';
import { Task } from '../types';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Hook for real-time task updates and user presence
 */
export const useTaskRealtime = (taskId?: string) => {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user?.id || !token) return;

    const connectWebSocket = async () => {
      try {
        await websocketService.connect(user.id, token);
        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        setIsConnected(false);
        setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket'));
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [user?.id, token]);

  // Update presence when taskId changes
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    if (taskId) {
      websocketService.updatePresence(taskId, 'viewing');
    } else {
      websocketService.updatePresence(null, 'inactive');
    }

    return () => {
      if (taskId) {
        websocketService.updatePresence(taskId, 'inactive');
      }
    };
  }, [isConnected, taskId, user?.id]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    // Handle task updates
    const taskUpdatedUnsubscribe = websocketService.subscribe<Task>('task_updated', (message) => {
      const updatedTask = message.payload;
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      
      // Also update task lists that might contain this task
      queryClient.invalidateQueries(['tasks']);
    });

    // Handle task creation
    const taskCreatedUnsubscribe = websocketService.subscribe<Task>('task_created', (message) => {
      const newTask = message.payload;
      queryClient.setQueryData(['task', newTask.id], newTask);
      
      // Invalidate task lists to include the new task
      queryClient.invalidateQueries(['tasks']);
    });

    // Handle task deletion
    const taskDeletedUnsubscribe = websocketService.subscribe<{ id: string }>('task_deleted', (message) => {
      const deletedTaskId = message.payload.id;
      
      // Remove task from cache
      queryClient.removeQueries(['task', deletedTaskId]);
      
      // Invalidate task lists to remove the deleted task
      queryClient.invalidateQueries(['tasks']);
    });

    // Handle comment events
    const commentAddedUnsubscribe = websocketService.subscribe('comment_added', () => {
      if (taskId) {
        queryClient.invalidateQueries(['taskComments', taskId]);
      }
    });

    const commentUpdatedUnsubscribe = websocketService.subscribe('comment_updated', () => {
      if (taskId) {
        queryClient.invalidateQueries(['taskComments', taskId]);
      }
    });

    const commentDeletedUnsubscribe = websocketService.subscribe('comment_deleted', () => {
      if (taskId) {
        queryClient.invalidateQueries(['taskComments', taskId]);
      }
    });

    // Handle attachment events
    const attachmentAddedUnsubscribe = websocketService.subscribe('attachment_added', () => {
      if (taskId) {
        queryClient.invalidateQueries(['taskAttachments', taskId]);
      }
    });

    const attachmentDeletedUnsubscribe = websocketService.subscribe('attachment_deleted', () => {
      if (taskId) {
        queryClient.invalidateQueries(['taskAttachments', taskId]);
      }
    });

    // Handle user presence
    const userPresenceUnsubscribe = websocketService.subscribe<UserPresence>('user_presence', (message) => {
      const presenceData = message.payload;
      
      // Only track presence for the current task
      if (taskId && presenceData.taskId === taskId) {
        setActiveUsers(prev => {
          // Remove user if they're inactive
          if (presenceData.action === 'inactive') {
            return prev.filter(user => user.userId !== presenceData.userId);
          }
          
          // Update user if they're already in the list
          const userExists = prev.some(user => user.userId === presenceData.userId);
          if (userExists) {
            return prev.map(user => 
              user.userId === presenceData.userId ? presenceData : user
            );
          }
          
          // Add user if they're not in the list
          return [...prev, presenceData];
        });
      }
    });

    // Cleanup subscriptions
    return () => {
      taskUpdatedUnsubscribe();
      taskCreatedUnsubscribe();
      taskDeletedUnsubscribe();
      commentAddedUnsubscribe();
      commentUpdatedUnsubscribe();
      commentDeletedUnsubscribe();
      attachmentAddedUnsubscribe();
      attachmentDeletedUnsubscribe();
      userPresenceUnsubscribe();
    };
  }, [isConnected, queryClient, taskId]);

  // Function to update user presence
  const updatePresence = (action: 'viewing' | 'editing' | 'inactive') => {
    if (isConnected && taskId) {
      websocketService.updatePresence(taskId, action);
    }
  };

  return {
    isConnected,
    activeUsers,
    error,
    updatePresence
  };
};
