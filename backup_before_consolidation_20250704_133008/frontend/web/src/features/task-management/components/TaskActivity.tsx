import React from 'react';
import { useTaskActivity } from '../hooks/useTaskActivity';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  Tooltip,
  Badge,
} from '@renexus/ui-components';
import {
  Clock,
  Edit,
  MessageSquare,
  Paperclip,
  Tag,
  User,
  Calendar,
  Flag,
  CheckCircle,
  AlertTriangle,
  Link,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface TaskActivityProps {
  taskId: string;
}

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'comment' | 'attachment' | 'status' | 'assignee' | 'priority' | 'label' | 'dueDate' | 'link';
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  details: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    attachment?: {
      id: string;
      name: string;
      type: string;
    };
    linkedTask?: {
      id: string;
      title: string;
    };
  };
}

export const TaskActivity: React.FC<TaskActivityProps> = ({ taskId }) => {
  const { activities, isLoading, isError, error } = useTaskActivity(taskId);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Get icon for activity type
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'create':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'attachment':
        return <Paperclip className="h-4 w-4 text-cyan-500" />;
      case 'status':
        return <RefreshCw className="h-4 w-4 text-amber-500" />;
      case 'assignee':
        return <User className="h-4 w-4 text-indigo-500" />;
      case 'priority':
        return <Flag className="h-4 w-4 text-red-500" />;
      case 'label':
        return <Tag className="h-4 w-4 text-emerald-500" />;
      case 'dueDate':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'link':
        return <Link className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get description for activity
  const getActivityDescription = (activity: ActivityItem) => {
    const { type, details } = activity;
    
    switch (type) {
      case 'create':
        return 'created this task';
      case 'update':
        if (details.field) {
          return `updated ${details.field} from "${details.oldValue}" to "${details.newValue}"`;
        }
        return 'updated the task';
      case 'comment':
        return 'commented';
      case 'attachment':
        return `added attachment "${details.attachment?.name}"`;
      case 'status':
        return `changed status from "${details.oldValue}" to "${details.newValue}"`;
      case 'assignee':
        if (details.newValue && !details.oldValue) {
          return `assigned the task to ${details.newValue}`;
        } else if (!details.newValue && details.oldValue) {
          return `unassigned ${details.oldValue} from the task`;
        } else {
          return `reassigned the task from ${details.oldValue} to ${details.newValue}`;
        }
      case 'priority':
        return `changed priority from "${details.oldValue}" to "${details.newValue}"`;
      case 'label':
        if (details.newValue && !details.oldValue) {
          return `added label "${details.newValue}"`;
        } else if (!details.newValue && details.oldValue) {
          return `removed label "${details.oldValue}"`;
        } else {
          return `changed label from "${details.oldValue}" to "${details.newValue}"`;
        }
      case 'dueDate':
        if (details.newValue && !details.oldValue) {
          return `set due date to ${new Date(details.newValue).toLocaleDateString()}`;
        } else if (!details.newValue && details.oldValue) {
          return `removed due date (was ${new Date(details.oldValue).toLocaleDateString()})`;
        } else {
          return `changed due date from ${new Date(details.oldValue || '').toLocaleDateString()} to ${new Date(details.newValue || '').toLocaleDateString()}`;
        }
      case 'link':
        return `linked task "${details.linkedTask?.title}"`;
      default:
        return 'performed an action';
    }
  };

  // Group activities by date
  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: { [key: string]: ActivityItem[] } = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(activity);
    });
    
    return Object.entries(groups).map(([date, items]) => ({
      date,
      formattedDate: new Date(date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      activities: items,
    }));
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load activity history. Please try again later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group activities by date
  const groupedActivities = groupActivitiesByDate(activities || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedActivities.map((group) => (
              <div key={group.date}>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  {group.formattedDate}
                </h4>
                <div className="relative ml-3 space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  
                  {group.activities.map((activity) => (
                    <div key={activity.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-0 flex items-center justify-center w-8 h-8">
                        <div className="w-2 h-2 bg-blue-500 rounded-full ring-4 ring-white dark:ring-gray-800" />
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                        <div className="flex items-start">
                          <Tooltip content={activity.user.name}>
                            {activity.user.avatar ? (
                              <Avatar 
                                src={activity.user.avatar} 
                                alt={activity.user.name} 
                                size="sm" 
                                className="mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm mr-3">
                                {activity.user.name.charAt(0)}
                              </div>
                            )}
                          </Tooltip>
                          
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-sm">
                                {activity.user.name}
                              </span>
                              <span className="mx-1 text-gray-500 dark:text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(activity.timestamp)}
                              </span>
                            </div>
                            
                            <div className="mt-1 flex items-center">
                              <span className="mr-1.5">
                                {getActivityIcon(activity)}
                              </span>
                              <span className="text-sm">
                                {getActivityDescription(activity)}
                              </span>
                            </div>
                            
                            {activity.type === 'comment' && activity.details.comment && (
                              <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                {activity.details.comment}
                              </div>
                            )}
                            
                            {activity.type === 'status' && (
                              <div className="mt-2 flex items-center space-x-2">
                                <Badge variant="outline">{activity.details.oldValue}</Badge>
                                <span>→</span>
                                <Badge>{activity.details.newValue}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskActivity;
