import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocketContext } from '../../../contexts/WebSocketContext';
import { PresenceIndicator } from './PresenceIndicator';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

interface CollaborativeTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  taskId: string;
  currentUser: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  debounceTime?: number;
}

export function CollaborativeTextArea({
  value,
  onChange,
  placeholder = 'Write something...',
  className = '',
  taskId,
  currentUser,
  debounceTime = 1000,
}: CollaborativeTextAreaProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { sendMessage } = useWebSocketContext();
  const { setTyping } = useTypingIndicator(taskId, currentUser.id);
  const lastTypingEvent = useRef(0);
  const TYPING_DEBOUNCE = 2000; // 2 seconds between typing events

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Notify other users when starting/stopping to type
  const handleTyping = useCallback((isTyping: boolean) => {
    const now = Date.now();
    if (isTyping && now - lastTypingEvent.current < TYPING_DEBOUNCE) {
      return;
    }
    
    lastTypingEvent.current = now;
    setTyping(isTyping, {
      userName: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    });
  }, [currentUser, setTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Notify typing
    handleTyping(true);
    
    // Debounce the actual change notification
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
      handleTyping(false);
    }, debounceTime);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      handleTyping(false);
    };
  }, [handleTyping]);

  // Handle focus/blur
  const handleFocus = () => {
    setIsFocused(true);
    // Notify that we're actively editing
    sendMessage('PRESENCE_UPDATE', {
      taskId,
      isEditing: true,
      userId: currentUser.id,
      userName: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Notify that we've stopped editing
    sendMessage('PRESENCE_UPDATE', {
      taskId,
      isEditing: false,
      userId: currentUser.id,
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full min-h-[100px] p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
            isFocused ? 'border-primary' : 'border-border'
          }`}
        />
        
        {/* Presence indicator */}
        <div className="absolute -bottom-2 right-2 bg-background px-2 flex items-center space-x-1">
          <PresenceIndicator 
            taskId={taskId} 
            currentUserId={currentUser.id}
            maxVisible={3}
            showNames={false}
          />
        </div>
      </div>
      
      {/* Typing indicator */}
      <TypingStatus taskId={taskId} currentUserId={currentUser.id} />
    </div>
  );
}

// Helper component to show who's currently typing
function TypingStatus({ taskId, currentUserId }: { taskId: string; currentUserId?: string }) {
  const { typingText } = useTypingIndicator(taskId, currentUserId);
  
  if (!typingText) return null;
  
  return (
    <div className="text-xs text-muted-foreground animate-pulse">
      {typingText}
    </div>
  );
}
