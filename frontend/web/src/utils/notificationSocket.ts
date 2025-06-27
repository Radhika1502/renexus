import { useEffect, useRef } from 'react';

interface NotificationSocketOptions {
  userId: string;
  accessToken: string;
  onMessage: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useNotificationSocket = ({
  userId,
  accessToken,
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: NotificationSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId || !accessToken) return;

    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Determine WebSocket URL (using secure WebSocket if on HTTPS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_API_WS_PORT || '4002'; // Default to notification service port
    
    const wsUrl = `${protocol}//${host}:${port}/notifications/ws?userId=${userId}&token=${accessToken}`;
    
    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('Notification WebSocket connection established');
      if (onConnect) onConnect();
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    // Connection closed
    socket.addEventListener('close', () => {
      console.log('Notification WebSocket connection closed');
      if (onDisconnect) onDisconnect();
    });

    // Connection error
    socket.addEventListener('error', (error) => {
      console.error('Notification WebSocket error:', error);
      if (onError) onError(error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [userId, accessToken, onMessage, onConnect, onDisconnect, onError]);

  // Return methods to interact with the socket
  return {
    send: (data: any) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
      } else {
        console.error('Cannot send message, WebSocket is not connected');
      }
    },
    close: () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  };
};

export default useNotificationSocket;
