import React, { useEffect } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';
import { Avatar, AvatarFallback, AvatarImage, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renexus/ui-components';
import { formatDistanceToNow } from 'date-fns';

interface UserPresenceProps {
  resourceType: 'project' | 'task' | 'document';
  resourceId: string;
  showOffline?: boolean;
  maxDisplayed?: number;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  resourceType,
  resourceId,
  showOffline = false,
  maxDisplayed = 5
}) => {
  const { activeUsers, updatePresence } = useCollaboration();

  // Update presence when component mounts or resource changes
  useEffect(() => {
    updatePresence({
      type: resourceType,
      id: resourceId
    });
    
    // Update presence every minute to keep it fresh
    const interval = setInterval(() => {
      updatePresence({
        type: resourceType,
        id: resourceId
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [resourceType, resourceId, updatePresence]);

  // Filter users for this resource
  const resourceUsers = activeUsers.filter(user => 
    user.location.type === resourceType && 
    user.location.id === resourceId &&
    (showOffline || user.status !== 'offline')
  );

  // Sort users: online first, then away, then offline
  const sortedUsers = [...resourceUsers].sort((a, b) => {
    const statusOrder = { online: 0, away: 1, offline: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Limit number of displayed users
  const displayedUsers = sortedUsers.slice(0, maxDisplayed);
  const remainingCount = sortedUsers.length - maxDisplayed;

  if (displayedUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
        {resourceType === 'project' ? 'In this project:' : 
         resourceType === 'task' ? 'Viewing this task:' : 'Editing this document:'}
      </span>
      
      <div className="flex -space-x-2">
        <TooltipProvider>
          {displayedUsers.map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <Avatar className={`border-2 ${
                  user.status === 'online' ? 'border-green-500' :
                  user.status === 'away' ? 'border-yellow-500' :
                  'border-gray-300'
                } h-8 w-8`}>
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.userName} />}
                  <AvatarFallback>
                    {user.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">{user.userName}</p>
                  <p className="text-xs text-gray-500">
                    {user.status === 'online' ? 'Online' : 
                     user.status === 'away' ? 'Away' : 'Offline'} • 
                    Last active {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="border-2 border-gray-300 h-8 w-8 bg-gray-100 dark:bg-gray-700">
                  <AvatarFallback>+{remainingCount}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{remainingCount} more {remainingCount === 1 ? 'user' : 'users'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};
