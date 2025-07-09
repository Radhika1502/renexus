import React, { useState } from 'react';
import { Task } from '../types';
import { useUpdateTask } from '../hooks/useUpdateTask';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renexus/ui-components';
import { Bell, BellOff, Clock, Send, Settings } from 'lucide-react';

interface TaskNotificationsProps {
  task: Task;
  currentUserId: string;
}

interface NotificationPreference {
  type: 'all' | 'mentions' | 'none';
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  reminders: {
    enabled: boolean;
    beforeDueDate: number; // hours
  };
}

export const TaskNotifications: React.FC<TaskNotificationsProps> = ({ task, currentUserId }) => {
  // Default notification preferences
  const defaultPreferences: NotificationPreference = {
    type: 'all',
    channels: {
      email: true,
      push: true,
      inApp: true,
    },
    reminders: {
      enabled: true,
      beforeDueDate: 24, // 24 hours before due date
    },
  };

  // Get user's current notification preferences or use defaults
  const userPreferences = task.notificationPreferences?.find(
    (pref) => pref.userId === currentUserId
  );
  
  const [preferences, setPreferences] = useState<NotificationPreference>(
    userPreferences?.preferences || defaultPreferences
  );
  
  const { updateTask, isLoading } = useUpdateTask();
  const [isSaved, setIsSaved] = useState(true);

  // Handle notification type change
  const handleTypeChange = (type: 'all' | 'mentions' | 'none') => {
    setPreferences((prev) => ({
      ...prev,
      type,
    }));
    setIsSaved(false);
  };

  // Handle channel toggle
  const handleChannelToggle = (channel: keyof NotificationPreference['channels']) => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
    setIsSaved(false);
  };

  // Handle reminders toggle
  const handleRemindersToggle = () => {
    setPreferences((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        enabled: !prev.reminders.enabled,
      },
    }));
    setIsSaved(false);
  };

  // Handle reminder time change
  const handleReminderTimeChange = (value: string) => {
    setPreferences((prev) => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        beforeDueDate: parseInt(value, 10),
      },
    }));
    setIsSaved(false);
  };

  // Save notification preferences
  const savePreferences = async () => {
    try {
      // Get current notification preferences
      const currentPreferences = task.notificationPreferences || [];
      
      // Update or add current user's preferences
      const userIndex = currentPreferences.findIndex(
        (pref) => pref.userId === currentUserId
      );
      
      let updatedPreferences;
      
      if (userIndex >= 0) {
        // Update existing preferences
        updatedPreferences = [...currentPreferences];
        updatedPreferences[userIndex] = {
          userId: currentUserId,
          preferences,
        };
      } else {
        // Add new preferences
        updatedPreferences = [
          ...currentPreferences,
          {
            userId: currentUserId,
            preferences,
          },
        ];
      }
      
      // Update task with new notification preferences
      await updateTask({
        id: task.id,
        notificationPreferences: updatedPreferences,
      });
      
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Notification Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notification Type</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="notify-all"
                    name="notification-type"
                    checked={preferences.type === 'all'}
                    onChange={() => handleTypeChange('all')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="notify-all" className="text-sm">
                    All updates
                  </label>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified about all changes
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="notify-mentions"
                    name="notification-type"
                    checked={preferences.type === 'mentions'}
                    onChange={() => handleTypeChange('mentions')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="notify-mentions" className="text-sm">
                    Only mentions
                  </label>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified only when mentioned
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="notify-none"
                    name="notification-type"
                    checked={preferences.type === 'none'}
                    onChange={() => handleTypeChange('none')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="notify-none" className="text-sm">
                    None
                  </label>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Don't send any notifications
                </span>
              </div>
            </div>
          </div>
          
          {/* Notification Channels */}
          {preferences.type !== 'none' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Channels</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email notifications</span>
                  <Switch
                    checked={preferences.channels.email}
                    onCheckedChange={() => handleChannelToggle('email')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Push notifications</span>
                  <Switch
                    checked={preferences.channels.push}
                    onCheckedChange={() => handleChannelToggle('push')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">In-app notifications</span>
                  <Switch
                    checked={preferences.channels.inApp}
                    onCheckedChange={() => handleChannelToggle('inApp')}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Due Date Reminders */}
          {task.dueDate && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Due Date Reminders</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Send reminder before due date</span>
                  </div>
                  <Switch
                    checked={preferences.reminders.enabled}
                    onCheckedChange={handleRemindersToggle}
                  />
                </div>
                
                {preferences.reminders.enabled && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Remind me</span>
                    <Select
                      value={preferences.reminders.beforeDueDate.toString()}
                      onValueChange={handleReminderTimeChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour before</SelectItem>
                        <SelectItem value="3">3 hours before</SelectItem>
                        <SelectItem value="12">12 hours before</SelectItem>
                        <SelectItem value="24">1 day before</SelectItem>
                        <SelectItem value="48">2 days before</SelectItem>
                        <SelectItem value="72">3 days before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={savePreferences}
              disabled={isLoading || isSaved}
              loading={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskNotifications;
