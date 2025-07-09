import React, { useEffect, useState, useMemo } from 'react';
import { useWebSocketContext } from '../../../contexts/WebSocketContext';
import { Avatar, AvatarFallback, AvatarImage } from '@renexus/ui-components/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renexus/ui-components/tooltip';
import { Skeleton } from '@renexus/ui-components/skeleton';

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  activeTaskId?: string;
  userName?: string;
  avatarUrl?: string;
  isTyping?: boolean;
}

interface PresenceIndicatorProps {
  taskId: string;
  currentUserId?: string;
  className?: string;
  maxVisible?: number;
  showNames?: boolean;
}

export function PresenceIndicator({
  taskId,
  currentUserId,
  className = '',
  maxVisible = 3,
  showNames = true,
}: PresenceIndicatorProps) {
  const [presenceData, setPresenceData] = useState<Record<string, UserPresence>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { subscribe, isConnected } = useWebSocketContext();

  // Filter out current user and sort by status
  const visiblePresence = useMemo(() => {
    return Object.values(presenceData)
      .filter(user => user.userId !== currentUserId)
      .sort((a, b) => {
        // Sort by status (online > away > offline) then by last seen
        const statusOrder = { online: 0, away: 1, offline: 2 };
        return (
          statusOrder[a.status] - statusOrder[b.status] ||
          new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
        );
      });
  }, [presenceData, currentUserId]);

  // Handle presence updates
  useEffect(() => {
    if (!isConnected || !taskId) return;

    const handlePresenceUpdate = (data: any) => {
      setPresenceData(prev => {
        const updated = { ...prev };
        
        if (data.type === 'PRESENCE_UPDATE') {
          updated[data.payload.userId] = {
            ...updated[data.payload.userId],
            ...data.payload,
            lastSeen: new Date(),
          };
        } else if (data.type === 'USER_TYPING') {
          if (updated[data.payload.userId]) {
            updated[data.payload.userId].isTyping = data.payload.isTyping;
          }
        } else if (data.type === 'USER_OFFLINE') {
          if (updated[data.payload.userId]) {
            updated[data.payload.userId].status = 'offline';
          }
        }
        
        return updated;
      });
      
      setIsLoading(false);
    };

    // Initial presence data can be fetched here if needed
    // For now, we'll rely on WebSocket updates
    
    const unsubscribePresence = subscribe('PRESENCE_UPDATE', handlePresenceUpdate);
    const unsubscribeTyping = subscribe('USER_TYPING', handlePresenceUpdate);
    const unsubscribeOffline = subscribe('USER_OFFLINE', handlePresenceUpdate);

    return () => {
      unsubscribePresence();
      unsubscribeTyping();
      unsubscribeOffline();
    };
  }, [taskId, isConnected, subscribe]);

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (visiblePresence.length === 0) {
    return null;
  }

  const visibleUsers = visiblePresence.slice(0, maxVisible);
  const additionalCount = visiblePresence.length - maxVisible;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {visibleUsers.map((user) => (
        <Tooltip key={user.userId}>
          <TooltipTrigger asChild>
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarImage src={user.avatarUrl} alt={user.userName} />
                <AvatarFallback>
                  {user.userName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
                <span
                  className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                    user.status === 'online' ? 'bg-green-500' : 
                    user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}
                />
              </Avatar>
              {user.isTyping && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  ...
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{user.userName || 'Anonymous User'}</div>
              <div className="text-muted-foreground text-xs">
                {user.status === 'online' ? 'Online' : 
                 user.status === 'away' ? 'Away' : 'Offline'}
                {user.isTyping && ' • Typing...'}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      
      {additionalCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              +{additionalCount}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <p className="font-medium">And {additionalCount} more</p>
              <div className="text-xs text-muted-foreground">
                {visiblePresence
                  .slice(maxVisible)
                  .map(user => user.userName || `User ${user.userId.slice(0, 4)}`)
                  .join(', ')}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
