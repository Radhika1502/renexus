import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, User, Clock, CheckCircle, Plus, Edit } from 'lucide-react';

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  entityType: string;
  entityName: string;
  entityId: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  limit = 10 
}) => {
  const displayActivities = activities.slice(0, limit);

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <Plus className="h-4 w-4 text-green-600" />;
    if (action.includes('completed')) return <CheckCircle className="h-4 w-4 text-blue-600" />;
    if (action.includes('updated')) return <Edit className="h-4 w-4 text-yellow-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-100 text-green-800';
    if (action.includes('completed')) return 'bg-blue-100 text-blue-800';
    if (action.includes('updated')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatAction = (action: string, entityName: string) => {
    return action.replace(entityName, '').trim();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {activity.userAvatar ? (
                    <img 
                      src={activity.userAvatar} 
                      alt={activity.userName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(activity.action)}
                    <Badge 
                      variant="secondary"
                      className={`text-xs ${getActionColor(activity.action)}`}
                    >
                      {activity.entityType}
                    </Badge>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>
                      <span className="text-muted-foreground"> {formatAction(activity.action, activity.entityName)} </span>
                      <span className="font-medium text-blue-600">{activity.entityName}</span>
                      {activity.projectName && (
                        <span className="text-muted-foreground"> in {activity.projectName}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {activities.length > limit && (
              <div className="text-center pt-4 border-t">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View all {activities.length} activities
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
