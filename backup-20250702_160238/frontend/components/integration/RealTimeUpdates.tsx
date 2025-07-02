import React, { useState, useEffect, useCallback, useRef } from 'react';

interface UpdateConfig {
  enabled: boolean;
  channels: string[];
  throttleMs?: number;
  connectionRetries?: number;
}

interface UpdateNotification {
  id: string;
  channel: string;
  type: 'create' | 'update' | 'delete' | 'system';
  entityType: string;
  entityId: string;
  timestamp: string;
  data?: any;
}

interface RealTimeUpdatesProps {
  config: UpdateConfig;
  userId: string;
  onNotification?: (notification: UpdateNotification) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

/**
 * Component that provides real-time updates via WebSocket integration
 * Implements connection management, reconnection logic, and notification handling
 */
const RealTimeUpdates: React.FC<RealTimeUpdatesProps> = ({
  config,
  userId,
  onNotification,
  onConnectionChange
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState(0);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  
  // Queue for storing updates received while processing batch updates
  const updateQueueRef = useRef<UpdateNotification[]>([]);
  const isProcessingRef = useRef(false);
  
  // Process update notifications in batches for performance
  const processUpdateQueue = useCallback(() => {
    if (updateQueueRef.current.length === 0 || isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    
    // Take the current queue items and reset the queue
    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];
    
    // Process the updates
    setNotifications(prev => {
      // Limit to latest 50 notifications
      const combined = [...updates, ...prev].slice(0, 50);
      return combined;
    });
    
    // Call the notification callback for each update
    updates.forEach(update => {
      if (onNotification) {
        onNotification(update);
      }
    });
    
    setPendingUpdates(0);
    isProcessingRef.current = false;
  }, [onNotification]);
  
  // Handle throttling for update processing
  useEffect(() => {
    const throttleTime = config.throttleMs || 500;
    
    const intervalId = setInterval(() => {
      processUpdateQueue();
    }, throttleTime);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [config.throttleMs, processUpdateQueue]);
  
  // Initialize or reinitialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!config.enabled || !config.channels.length) {
      return;
    }
    
    try {
      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Clear any pending reconnect attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Build the WebSocket URL with auth and channel parameters
      const wsUrl = new URL(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/realtime`);
      wsUrl.searchParams.append('userId', userId);
      config.channels.forEach(channel => {
        wsUrl.searchParams.append('channel', channel);
      });
      
      // Create new WebSocket connection
      socketRef.current = new WebSocket(wsUrl.toString());
      
      // Connection opened
      socketRef.current.addEventListener('open', () => {
        setIsConnected(true);
        setConnectionError(null);
        retryCountRef.current = 0;
        
        if (onConnectionChange) {
          onConnectionChange(true);
        }
        
        // Send initial handshake with authentication
        socketRef.current?.send(JSON.stringify({
          type: 'auth',
          userId,
          channels: config.channels
        }));
        
        console.log('WebSocket connection established');
      });
      
      // Connection error
      socketRef.current.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      });
      
      // Connection closed
      socketRef.current.addEventListener('close', (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
        
        // Attempt reconnect with exponential backoff
        const maxRetries = config.connectionRetries || 10;
        if (retryCountRef.current < maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          console.log(`Attempting to reconnect in ${backoffTime}ms (Attempt ${retryCountRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++;
            initializeWebSocket();
          }, backoffTime);
        } else {
          setConnectionError('Maximum reconnection attempts reached');
        }
      });
      
      // Listen for messages
      socketRef.current.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            const notification: UpdateNotification = {
              id: message.id,
              channel: message.channel,
              type: message.updateType,
              entityType: message.entityType,
              entityId: message.entityId,
              timestamp: message.timestamp,
              data: message.data
            };
            
            // Add to processing queue
            updateQueueRef.current.push(notification);
            setPendingUpdates(queue => queue + 1);
          } else if (message.type === 'system') {
            console.log('System message:', message);
            
            // Handle system messages (e.g., keepalive)
            if (message.action === 'keepalive') {
              // Send response to keep connection alive
              socketRef.current?.send(JSON.stringify({
                type: 'system',
                action: 'keepalive-response',
                timestamp: new Date().toISOString()
              }));
            }
          }
        } catch (e) {
          console.error('Error processing WebSocket message:', e);
        }
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionError('Failed to initialize connection');
      setIsConnected(false);
      
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    }
  }, [config.channels, config.connectionRetries, config.enabled, userId, onConnectionChange]);
  
  // Initialize WebSocket connection on component mount or config change
  useEffect(() => {
    initializeWebSocket();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [config.enabled, config.channels, initializeWebSocket]);
  
  // Manual reconnection function
  const reconnect = () => {
    retryCountRef.current = 0;
    initializeWebSocket();
  };
  
  // Subscribe to additional channels
  const subscribeToChannels = (channels: string[]) => {
    if (!isConnected || !socketRef.current) {
      return false;
    }
    
    const newChannels = channels.filter(ch => !config.channels.includes(ch));
    if (newChannels.length === 0) {
      return true; // Already subscribed to all channels
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'subscribe',
      channels: newChannels
    }));
    
    return true;
  };
  
  // Unsubscribe from channels
  const unsubscribeFromChannels = (channels: string[]) => {
    if (!isConnected || !socketRef.current) {
      return false;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'unsubscribe',
      channels
    }));
    
    return true;
  };
  
  // Debug status display
  const renderConnectionStatus = () => {
    return (
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator"></div>
        <span className="status-text">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {pendingUpdates > 0 && (
          <span className="pending-badge">{pendingUpdates}</span>
        )}
        {!isConnected && (
          <button 
            className="reconnect-button"
            onClick={reconnect}
          >
            Reconnect
          </button>
        )}
      </div>
    );
  };
  
  // Props to expose the API
  const api = {
    isConnected,
    reconnect,
    subscribeToChannels,
    unsubscribeFromChannels,
    notifications,
    pendingUpdates
  };
  
  // Avoid rendering if not enabled
  if (!config.enabled) {
    return null;
  }
  
  return (
    <>
      {renderConnectionStatus()}
      
      <style jsx>{`
        .connection-status {
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          background-color: #f0f0f0;
          width: fit-content;
        }
        
        .connected {
          background-color: #e3f9e5;
        }
        
        .disconnected {
          background-color: #ffeeee;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        
        .connected .status-indicator {
          background-color: #2ecc71;
        }
        
        .disconnected .status-indicator {
          background-color: #e74c3c;
        }
        
        .pending-badge {
          background-color: #3498db;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          margin-left: 8px;
        }
        
        .reconnect-button {
          background-color: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          cursor: pointer;
          margin-left: 8px;
        }
        
        .reconnect-button:hover {
          background-color: #c0392b;
        }
      `}</style>
    </>
  );
};

export default RealTimeUpdates;
