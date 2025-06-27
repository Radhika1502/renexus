import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import * as jwt from 'jsonwebtoken';
import { URL } from 'url';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

// Extended WebSocket interface with our custom properties
interface ExtendedWebSocket {
  userId: string;
  isAlive: boolean;
  send(data: string): void;
  terminate(): void;
  ping(): void;
  on(event: string, listener: (...args: any[]) => void): void;
  readyState: number;
  close(code?: number, reason?: string): void;
}

// Message structure for notifications
interface NotificationMessage {
  type: string;
  data: any;
}

class NotificationWebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, Set<ExtendedWebSocket>> = new Map();
  private pingInterval: NodeJS.Timeout;

  /**
   * Periodically log the number of active connections and total client sockets.
   */
  private monitorConnections(): void {
    setInterval(() => {
      const userCount = this.clients.size;
      const socketCount = Array.from(this.clients.values()).reduce((acc, set) => acc + set.size, 0);
      logger.info(`[WebSocket] Active users: ${userCount}, Total client sockets: ${socketCount}`);
    }, 30000);
  }

  constructor(server: HttpServer) {
    this.wss = new WebSocket.Server({ server, path: '/notifications/ws' });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Setup ping interval to keep connections alive and detect dead clients
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((socket) => {
        // Cast the socket to our extended interface
        const wsClient = socket as unknown as ExtendedWebSocket;
        if (wsClient.isAlive === false) {
          this.removeClient(wsClient);
          return wsClient.terminate();
        }
        
        wsClient.isAlive = false;
        wsClient.ping();
      });
    }, 30000);
    
    // Setup Redis subscription for notification events
    this.setupRedisSubscription();

    // Start connection monitoring
    this.monitorConnections();
    
    logger.info('WebSocket server initialized for notifications');
  }

  private async handleConnection(socket: WebSocket, req: any) {
    try {
      const ws = socket as ExtendedWebSocket;
      
      // Parse URL to get query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');
      const token = url.searchParams.get('token');
      
      // Validate required parameters
      if (!userId || !token) {
        logger.warn('WebSocket connection attempt without userId or token');
        ws.close(4000, 'Missing userId or token');
        return;
      }
      
      // Verify JWT token
      try {
        jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
      } catch (err: unknown) {
        const error = err as Error;
        logger.warn(`Invalid token for WebSocket connection: ${error.message}`);
        ws.close(4001, 'Invalid token');
        return;
      }
      
      // Set client properties
      ws.userId = userId;
      ws.isAlive = true;
      
      // Add client to clients map
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)?.add(ws);
      
      logger.info(`WebSocket client connected for user: ${userId}`);
      
      // Send initial connection success message
      ws.send(JSON.stringify({
        type: 'connection',
        data: { status: 'connected', userId }
      }));
      
      // Setup event handlers
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(ws, data.toString());
      });
      
      ws.on('close', () => {
        this.removeClient(ws);
        logger.info(`WebSocket client disconnected for user: ${userId}`);
      });
      
      ws.on('error', (error: Error) => {
        logger.error(`WebSocket error for user ${userId}: ${error.message}`);
        this.removeClient(ws);
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error handling WebSocket connection: ${err.message}`);
      socket.close(4500, 'Internal server error');
    }
  }

  private handleMessage(ws: ExtendedWebSocket, message: string): void {
    try {
      const parsedMessage = JSON.parse(message);
      
      // Handle client messages if needed
      logger.debug(`Received WebSocket message from user ${ws.userId}:`, parsedMessage);
      
      // Currently, we don't expect clients to send messages
      // This is mainly for future extensibility
    } catch (error: unknown) {
      logger.warn(`Invalid WebSocket message format: ${(error as Error).message}`);
    }
  }

  private removeClient(ws: ExtendedWebSocket): void {
    const userId = ws.userId;
    if (userId && this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      userClients?.delete(ws);
      
      // Remove user entry if no more clients
      if (userClients?.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private async setupRedisSubscription(): Promise<void> {
    try {
      const subscriber = redisClient.duplicate();
      
      await subscriber.connect();
      await subscriber.subscribe('notification-events', (message: string) => {
        try {
          const notification = JSON.parse(message);
          this.broadcastToUser(notification.userId, {
            type: 'notification',
            data: notification
          });
        } catch (error: unknown) {
          const err = error as Error;
          logger.error(`Error processing Redis notification: ${err.message}`);
        }
      });
      
      logger.info('Redis subscription for notifications established');
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Failed to setup Redis subscription: ${err.message}`);
    }
  }

  public broadcastToUser(userId: string, message: NotificationMessage): void {
    if (!this.clients.has(userId)) return;
    
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;
    
    const messageString = JSON.stringify(message);
    
    userClients.forEach((client: ExtendedWebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
    
    logger.debug(`Broadcast message to user ${userId}: ${messageString}`);
  }

  public broadcastToAll(message: NotificationMessage): void {
    const messageString = JSON.stringify(message);
    
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
    
    logger.debug(`Broadcast message to all users: ${messageString}`);
  }

  public shutdown(): void {
    clearInterval(this.pingInterval);
    
    this.wss.clients.forEach((client: WebSocket) => {
      client.terminate();
    });
    
    this.wss.close();
    logger.info('WebSocket server shut down');
  }
}

export default NotificationWebSocketServer;
