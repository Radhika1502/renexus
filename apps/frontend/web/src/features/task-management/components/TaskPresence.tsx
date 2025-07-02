import React from 'react';
import { UserPresence } from '../services/websocket';
import { Avatar, Tooltip } from '../../../components/ui';
import { Eye, Edit } from 'lucide-react';

interface TaskPresenceProps {
  activeUsers: UserPresence[];
  currentUserId: string;
}

export const TaskPresence: React.FC<TaskPresenceProps> = ({ activeUsers, currentUserId }) => {
  // Filter out current user and sort by action (editing first, then viewing)
  const sortedUsers = activeUsers
    .filter(user => user.userId !== currentUserId)
    .sort((a, b) => {
      if (a.action === 'editing' && b.action !== 'editing') return -1;
      if (a.action !== 'editing' && b.action === 'editing') return 1;
      return 0;
    });

  if (sortedUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 py-2" aria-label="Users currently viewing this task">
      <div className="flex -space-x-2 overflow-hidden">
        {sortedUsers.slice(0, 5).map((user) => (
          <Tooltip 
            key={user.userId}
            content={
              <div className="flex items-center space-x-2">
                <span>{user.username}</span>
                <span className="text-xs text-gray-400">
                  {user.action === 'editing' ? 'editing' : 'viewing'}
                </span>
              </div>
            }
          >
            <div className="relative">
              <Avatar 
                src={user.avatar} 
                alt={user.username} 
                size="sm" 
                className={`border-2 ${
                  user.action === 'editing' 
                    ? 'border-amber-500 dark:border-amber-400' 
                    : 'border-blue-500 dark:border-blue-400'
                }`}
              />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-gray-800 p-0.5">
                {user.action === 'editing' ? (
                  <Edit className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                ) : (
                  <Eye className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                )}
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
      
      {sortedUsers.length > 5 && (
        <Tooltip 
          content={`${sortedUsers.length - 5} more users`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium">
            +{sortedUsers.length - 5}
          </div>
        </Tooltip>
      )}
    </div>
  );
};
