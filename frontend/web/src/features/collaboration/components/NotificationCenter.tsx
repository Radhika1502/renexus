import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea,
  Badge,
  Card,
  CardContent,
} from '@renexus/ui-components';
import { Bell, Check, CheckCheck, Filter, Settings } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../types';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  maxHeight?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxHeight = 400,
}) => {
  const navigate = useNavigate();
  const { 
    data: notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    markAsUnread
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // Filter notifications based on selected filter
  const filteredNotifications = notifications?.filter(n => 
    filter === 'all' || (filter === 'unread' && !n.read)
  ) || [];

  // Group notifications by type
  const mentionNotifications = filteredNotifications.filter(n => n.type === 'mention');
  const commentNotifications = filteredNotifications.filter(n => 
    n.type === 'comment' || n.type === 'reply'
  );
  const taskNotifications = filteredNotifications.filter(n => 
    n.type === 'assignment' || n.type === 'status_change' || n.type === 'deadline'
  );

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the resource if there's an action URL
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  // Format notification time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Render a single notification item
  const renderNotificationItem = (notification: Notification) => (
    <div 
      key={notification.id}
      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{notification.title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <span>{formatTime(notification.createdAt)}</span>
            {!notification.read && (
              <Badge variant="secondary" className="ml-2 px-1 py-0">New</Badge>
            )}
          </div>
        </div>
        <div className="ml-2 flex">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (notification.read) {
                markAsUnread(notification.id);
              } else {
                markAsRead(notification.id);
              }
            }}
          >
            {notification.read ? (
              <CheckCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigate('/settings/notifications')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] max-h-[70vh]">
            <TabsContent value="all" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">No notifications</p>
                </div>
              ) : (
                filteredNotifications.map(renderNotificationItem)
              )}
            </TabsContent>
            
            <TabsContent value="mentions" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : mentionNotifications.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">No mention notifications</p>
                </div>
              ) : (
                mentionNotifications.map(renderNotificationItem)
              )}
            </TabsContent>
            
            <TabsContent value="comments" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : commentNotifications.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">No comment notifications</p>
                </div>
              ) : (
                commentNotifications.map(renderNotificationItem)
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">Loading notifications...</p>
                </div>
              ) : taskNotifications.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">No task notifications</p>
                </div>
              ) : (
                taskNotifications.map(renderNotificationItem)
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <div className="p-2 border-t text-center">
          <Button 
            variant="link" 
            size="sm"
            className="text-xs"
            onClick={() => navigate('/notifications')}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
