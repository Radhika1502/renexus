import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { User, Task } from '../types';
import { Avatar, Badge, Tooltip } from '@renexus/ui-components';
import { Edit, Clock } from 'lucide-react';

interface SharedTaskEditorProps {
  task: Task;
  currentUserId: string;
  children: React.ReactNode;
}

type EditorPresence = {
  userId: string;
  userName: string;
  avatar?: string;
  status: 'viewing' | 'editing' | 'idle';
  lastActivity: number;
};

export const SharedTaskEditor: React.FC<SharedTaskEditorProps> = ({
  task,
  currentUserId,
  children,
}) => {
  const { socket, sendMessage } = useWebSocket();
  const [activeEditors, setActiveEditors] = useState<EditorPresence[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Send presence update when component mounts or task changes
  useEffect(() => {
    if (!socket || !task) return;

    // Join the task editing room
    const joinMessage = {
      type: 'JOIN_TASK_EDIT',
      taskId: task.id,
      userId: currentUserId,
      timestamp: Date.now(),
    };
    sendMessage(joinMessage);

    // Send presence update every 30 seconds
    const interval = setInterval(() => {
      const presenceMessage = {
        type: 'TASK_PRESENCE',
        taskId: task.id,
        userId: currentUserId,
        status: isTyping ? 'editing' : 'viewing',
        timestamp: Date.now(),
      };
      sendMessage(presenceMessage);
    }, 30000);

    // Leave the task editing room when component unmounts
    return () => {
      clearInterval(interval);
      const leaveMessage = {
        type: 'LEAVE_TASK_EDIT',
        taskId: task.id,
        userId: currentUserId,
        timestamp: Date.now(),
      };
      sendMessage(leaveMessage);
    };
  }, [socket, task, currentUserId, sendMessage, isTyping]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      
      // Send typing indicator
      const typingMessage = {
        type: 'TASK_TYPING',
        taskId: task.id,
        userId: currentUserId,
        timestamp: Date.now(),
      };
      sendMessage(typingMessage);
    }

    // Reset typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set typing to false after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      
      // Send stopped typing indicator
      const stoppedTypingMessage = {
        type: 'TASK_STOPPED_TYPING',
        taskId: task.id,
        userId: currentUserId,
        timestamp: Date.now(),
      };
      sendMessage(stoppedTypingMessage);
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  // Listen for presence updates from other users
  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (message: any) => {
      if (message.taskId !== task.id) return;
      
      if (message.type === 'TASK_PRESENCE' || message.type === 'JOIN_TASK_EDIT') {
        // Update active editors list
        setActiveEditors(prev => {
          const existing = prev.findIndex(editor => editor.userId === message.userId);
          
          if (existing >= 0) {
            // Update existing editor
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing],
              status: message.status || updated[existing].status,
              lastActivity: message.timestamp,
            };
            return updated;
          } else {
            // Add new editor
            return [...prev, {
              userId: message.userId,
              userName: message.userName || `User ${message.userId.substring(0, 4)}`,
              avatar: message.avatar,
              status: message.status || 'viewing',
              lastActivity: message.timestamp,
            }];
          }
        });
      } else if (message.type === 'LEAVE_TASK_EDIT') {
        // Remove user from active editors
        setActiveEditors(prev => prev.filter(editor => editor.userId !== message.userId));
      } else if (message.type === 'TASK_TYPING') {
        // Update user status to editing
        setActiveEditors(prev => {
          const existing = prev.findIndex(editor => editor.userId === message.userId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing],
              status: 'editing',
              lastActivity: message.timestamp,
            };
            return updated;
          }
          return prev;
        });
      } else if (message.type === 'TASK_STOPPED_TYPING') {
        // Update user status to viewing
        setActiveEditors(prev => {
          const existing = prev.findIndex(editor => editor.userId === message.userId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing],
              status: 'viewing',
              lastActivity: message.timestamp,
            };
            return updated;
          }
          return prev;
        });
      }
    };

    // Add event listener for presence updates
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        handlePresenceUpdate(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Initial presence update
    const presenceMessage = {
      type: 'TASK_PRESENCE',
      taskId: task.id,
      userId: currentUserId,
      status: 'viewing',
      timestamp: Date.now(),
    };
    sendMessage(presenceMessage);

    // Clean up inactive users every minute
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveEditors(prev => 
        prev.filter(editor => now - editor.lastActivity < 60000) // Remove users inactive for more than 1 minute
      );
    }, 60000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [socket, task.id, currentUserId, sendMessage]);

  // Filter out current user from active editors list for display
  const otherEditors = activeEditors.filter(editor => editor.userId !== currentUserId);

  return (
    <div className="relative">
      {/* Active editors indicator */}
      {otherEditors.length > 0 && (
        <div className="absolute top-0 right-0 flex items-center space-x-1 p-2 bg-white dark:bg-gray-800 rounded-bl-lg shadow-sm z-10">
          <div className="flex -space-x-2">
            {otherEditors.slice(0, 3).map((editor) => (
              <Tooltip key={editor.userId} content={`${editor.userName} ${editor.status === 'editing' ? '(editing)' : '(viewing)'}`}>
                <div className="relative">
                  {editor.avatar ? (
                    <Avatar 
                      src={editor.avatar} 
                      alt={editor.userName} 
                      size="sm" 
                      className={`border-2 ${editor.status === 'editing' ? 'border-green-500' : 'border-blue-500'}`}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm border-2 ${editor.status === 'editing' ? 'border-green-500 bg-green-700' : 'border-blue-500 bg-blue-700'}`}>
                      {editor.userName.charAt(0)}
                    </div>
                  )}
                  {editor.status === 'editing' && (
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
                  )}
                </div>
              </Tooltip>
            ))}
            {otherEditors.length > 3 && (
              <Badge variant="outline" className="ml-1">+{otherEditors.length - 3}</Badge>
            )}
          </div>
          {otherEditors.some(editor => editor.status === 'editing') && (
            <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Edit className="h-3 w-3 mr-1" />
              <span>Someone is editing...</span>
            </span>
          )}
        </div>
      )}

      {/* Wrap children with typing event handlers */}
      <div onKeyDown={handleTyping} onClick={handleTyping}>
        {children}
      </div>
    </div>
  );
};

export default SharedTaskEditor;
