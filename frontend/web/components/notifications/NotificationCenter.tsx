import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button, Badge, Toast, ToastProvider, ToastViewport } from '@renexus/ui-components';
import { BellRing, CheckCircle, Trash2 } from 'lucide-react';
import { useNotificationSocket } from "../../../shared/utils/notificationSocket";
import { useAuth } from '../../hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationCenterProps {
  maxNotifications?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  maxNotifications = 5 
}) => {
  const { user, token } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  // Ref for the notification panel to detect outside clicks
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Setup WebSocket for real-time notifications
  useNotificationSocket({
    userId: user?.id || '',
    accessToken: token || '',
    onMessage: (data) => {
      // Refresh notifications when we receive a new one
      if (data.type === 'notification') {
        fetchNotifications();
      }
    },
    onError: (error) => {
      console.error('Notification socket error:', error);
    }
  });

  // Get variant based on notification type
  const getVariant = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'destructive';
      case 'info':
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="relative"
      >
        <BellRing size={20} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div 
          id="notification-panel"
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
          role="dialog"
          aria-labelledby="notification-panel-title"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 id="notification-panel-title" className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center">Loading notifications...</div>
            )}
            {error && (
              <div className="p-4 text-red-500">Error loading notifications</div>
            )}
            {!loading && !error && notifications.length === 0 && (
              <div className="p-4 text-center">No notifications</div>
            )}
            {!loading && !error && notifications.length > 0 && (
              <ToastProvider>
                {notifications.slice(0, maxNotifications).map((notification) => (
                  <Toast
                    key={notification.id}
                    variant={getVariant(notification.type)}
                    className={`m-2 ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm mt-1">{notification.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6"
                          >
                            <CheckCircle size={14} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Toast>
                ))}
                <ToastViewport />
              </ToastProvider>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNotifications}
              className="w-full text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

