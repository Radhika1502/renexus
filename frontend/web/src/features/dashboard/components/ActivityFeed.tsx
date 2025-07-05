import React from 'react';
import { Card } from './ui/Card';
import { ActivityFeed as ActivityFeedType } from '../types';
import { useFetchApi } from '../../../hooks/useApi';

interface ActivityFeedProps {
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ limit = 10 }) => {
  const { data: activities, isLoading, error } = useFetchApi(`/dashboard/activity?limit=${limit}`, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return <span className="h-5 w-5 text-blue-500">📋</span>;
      case 'PROJECT':
        return <span className="h-5 w-5 text-green-500">📁</span>;
      case 'SPRINT':
        return <span className="h-5 w-5 text-purple-500">📅</span>;
      case 'TEAM':
        return <span className="h-5 w-5 text-yellow-500">👥</span>;
      case 'COMMENT':
        return <span className="h-5 w-5 text-indigo-500">💬</span>;
      default:
        return <span className="h-5 w-5 text-gray-500">📋</span>;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return activityTime.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-red-500">Error loading activity feed: {error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      {activities && Array.isArray(activities) && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity: any) => (
            <div key={activity.id} className="flex">
              {activity.userAvatar ? (
                <img 
                  src={activity.userAvatar} 
                  alt={activity.userName} 
                  className="h-8 w-8 rounded-full mr-3"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3 flex items-center justify-center">
                  {activity.userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{activity.userName}</span> {activity.action} 
                  <span className="font-medium"> {activity.entityName}</span>
                </p>
                <div className="flex items-center mt-1">
                  {getActivityIcon(activity.entityType)}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No recent activity.</p>
      )}
    </Card>
  );
};
