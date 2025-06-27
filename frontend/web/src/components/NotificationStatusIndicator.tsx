import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNotificationSocket } from '../hooks/useNotificationSocket';

interface NotificationStatusIndicatorProps {
  showConnectionStatus?: boolean;
  showReconnectButton?: boolean;
  className?: string;
}

/**
 * Component to display notification connection status and reconnect button
 */
export const NotificationStatusIndicator: React.FC<NotificationStatusIndicatorProps> = ({
  showConnectionStatus = true,
  showReconnectButton = true,
  className = '',
}) => {
  const { unreadCount } = useNotifications();
  const { isConnected, reconnect } = useNotificationSocket();

  return (
    <div className={`notification-status-indicator ${className}`}>
      {showConnectionStatus && (
        <div className="connection-status">
          <span 
            className={`status-dot ${isConnected ? 'status-connected' : 'status-disconnected'}`}
            title={isConnected ? 'Connected to notifications' : 'Disconnected from notifications'}
          />
          {!isConnected && showReconnectButton && (
            <button 
              onClick={() => reconnect()}
              className="reconnect-button"
              title="Reconnect to notification service"
            >
              Reconnect
            </button>
          )}
        </div>
      )}
      
      {unreadCount > 0 && (
        <div className="unread-badge" title={`${unreadCount} unread notifications`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      
      <style jsx>{`
        .notification-status-indicator {
          display: flex;
          align-items: center;
          position: relative;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          margin-right: 8px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
        }
        
        .status-connected {
          background-color: #10b981; /* green */
          box-shadow: 0 0 4px #10b981;
        }
        
        .status-disconnected {
          background-color: #ef4444; /* red */
          box-shadow: 0 0 4px #ef4444;
        }
        
        .reconnect-button {
          font-size: 12px;
          padding: 2px 6px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .reconnect-button:hover {
          background-color: #e5e7eb;
        }
        
        .unread-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          min-width: 18px;
          height: 18px;
          background-color: #ef4444; /* red */
          color: white;
          border-radius: 9px;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
      `}</style>
    </div>
  );
};

export default NotificationStatusIndicator;
