import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser } from '../../middleware/auth';

interface ClientConnection {
  id: string;
  userId: string;
  socket: WebSocket;
  channels: Set<string>;
  lastActivity: Date;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface NotificationMessage {
  id: string;
  channel: string;
  updateType: 'create' | 'update' | 'delete' | 'system';
  entityType: string;
  entityId: string;
  timestamp: string;
  data?: any;
}

/**
 * Real-time updates service for analytics integration
 * Manages WebSocket connections, channels, and message distribution
 */
class RealTimeUpdatesService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private channelSubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  
  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  initialize(server: HTTPServer): void {
    if (this.isInitialized) {
      console.warn('RealTimeUpdatesService is already initialized');
      return;
    }
    
    this.wss = new WebSocketServer({ 
      noServer: true,
      path: '/api/realtime'
    });
    
    // Handle upgrade requests
    server.on('upgrade', (request, socket, head) => {
      if (!request.url) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }
      
      const url = new URL(request.url, `http://${request.headers.host}`);
      
      if (url.pathname === '/api/realtime') {
        // Extract userId and initial channels from query parameters
        const userId = url.searchParams.get('userId');
        const initialChannels = url.searchParams.getAll('channel');
        
        if (!userId) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // Verify user authentication (this would be async in a real implementation)
        authenticateUser(request as any, {} as any, (err) => {
          if (err) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          
          // Upgrade the connection to WebSocket
          this.wss!.handleUpgrade(request, socket, head, (ws) => {
            this.handleConnection(ws, userId, initialChannels);
          });
        });
      } else {
        socket.destroy();
      }
    });
    
    // Start heartbeat interval to keep connections alive and detect stale connections
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, 30000); // 30 seconds
    
    this.isInitialized = true;
    console.log('RealTimeUpdatesService initialized');
  }
  
  /**
   * Handle new WebSocket connection
   * @param socket WebSocket instance
   * @param userId User ID
   * @param initialChannels List of initial channels to subscribe to
   */
  private handleConnection(socket: WebSocket, userId: string, initialChannels: string[]): void {
    const clientId = uuidv4();
    const client: ClientConnection = {
      id: clientId,
      userId,
      socket,
      channels: new Set(initialChannels),
      lastActivity: new Date()
    };
    
    // Store client connection
    this.clients.set(clientId, client);
    
    // Subscribe to initial channels
    initialChannels.forEach(channel => {
      this.subscribeToChannel(clientId, channel);
    });
    
    console.log(`Client connected: ${clientId} (User: ${userId}), Channels: [${Array.from(client.channels).join(', ')}]`);
    
    // Handle incoming messages
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(clientId, message);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    // Handle connection close
    socket.on('close', () => {
      this.handleDisconnection(clientId);
    });
    
    // Handle errors
    socket.on('error', (err) => {
      console.error(`WebSocket error for client ${clientId}:`, err);
    });
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'system',
      message: 'Connected to Renexus real-time updates service',
      clientId,
      channels: Array.from(client.channels),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Handle WebSocket message from client
   * @param clientId Client ID
   * @param message Message object
   */
  private handleMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Update last activity timestamp
    client.lastActivity = new Date();
    
    switch (message.type) {
      case 'auth':
        // Authentication message (already handled during connection)
        break;
      
      case 'subscribe':
        // Subscribe to channels
        if (Array.isArray(message.channels)) {
          message.channels.forEach((channel: string) => {
            this.subscribeToChannel(clientId, channel);
          });
        }
        break;
      
      case 'unsubscribe':
        // Unsubscribe from channels
        if (Array.isArray(message.channels)) {
          message.channels.forEach((channel: string) => {
            this.unsubscribeFromChannel(clientId, channel);
          });
        }
        break;
      
      case 'system':
        // Handle system messages
        if (message.action === 'keepalive-response') {
          // Client responded to keepalive, nothing to do
        }
        break;
      
      default:
        console.warn(`Unknown message type from client ${clientId}:`, message);
    }
  }
  
  /**
   * Handle client disconnection
   * @param clientId Client ID
   */
  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    console.log(`Client disconnected: ${clientId} (User: ${client.userId})`);
    
    // Remove from channel subscriptions
    client.channels.forEach(channel => {
      this.unsubscribeFromChannel(clientId, channel);
    });
    
    // Remove client
    this.clients.delete(clientId);
  }
  
  /**
   * Subscribe a client to a channel
   * @param clientId Client ID
   * @param channel Channel name
   */
  private subscribeToChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Add channel to client subscriptions
    client.channels.add(channel);
    
    // Add client to channel subscribers
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    
    this.channelSubscriptions.get(channel)!.add(clientId);
    console.log(`Client ${clientId} subscribed to channel: ${channel}`);
  }
  
  /**
   * Unsubscribe a client from a channel
   * @param clientId Client ID
   * @param channel Channel name
   */
  private unsubscribeFromChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove channel from client subscriptions
    client.channels.delete(channel);
    
    // Remove client from channel subscribers
    const channelSubscribers = this.channelSubscriptions.get(channel);
    if (channelSubscribers) {
      channelSubscribers.delete(clientId);
      
      // Clean up empty channel
      if (channelSubscribers.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }
    
    console.log(`Client ${clientId} unsubscribed from channel: ${channel}`);
  }
  
  /**
   * Send a message to a specific client
   * @param clientId Client ID
   * @param data Message data
   */
  private sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      client.socket.send(JSON.stringify(data));
    } catch (err) {
      console.error(`Error sending message to client ${clientId}:`, err);
    }
  }
  
  /**
   * Send a notification to all clients subscribed to a channel
   * @param channel Channel name
   * @param notification Notification message
   */
  public sendNotification(channel: string, notification: Omit<NotificationMessage, 'id' | 'timestamp'>): void {
    if (!this.isInitialized) {
      console.warn('RealTimeUpdatesService is not initialized');
      return;
    }
    
    const channelSubscribers = this.channelSubscriptions.get(channel);
    if (!channelSubscribers || channelSubscribers.size === 0) {
      // No subscribers to this channel
      return;
    }
    
    const fullNotification: NotificationMessage = {
      ...notification,
      id: uuidv4(),
      channel,
      timestamp: new Date().toISOString()
    };
    
    // Send to all subscribers
    let sentCount = 0;
    channelSubscribers.forEach(clientId => {
      this.sendToClient(clientId, {
        type: 'notification',
        ...fullNotification
      });
      sentCount++;
    });
    
    console.log(`Sent notification to ${sentCount} clients on channel: ${channel}`);
  }
  
  /**
   * Send heartbeat messages to detect stale connections
   * and keep connections alive through proxies/firewalls
   */
  private sendHeartbeats(): void {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 60000); // 60 seconds
    
    this.clients.forEach((client, clientId) => {
      // Check for stale connections
      if (client.lastActivity < staleThreshold) {
        console.log(`Closing stale connection for client ${clientId}`);
        client.socket.terminate();
        this.handleDisconnection(clientId);
        return;
      }
      
      // Send heartbeat
      this.sendToClient(clientId, {
        type: 'system',
        action: 'keepalive',
        timestamp: now.toISOString()
      });
    });
  }
  
  /**
   * Shutdown the WebSocket server
   */
  public shutdown(): void {
    if (!this.isInitialized) return;
    
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Close all connections
    this.clients.forEach((client, clientId) => {
      try {
        client.socket.close();
      } catch (err) {
        console.error(`Error closing connection for client ${clientId}:`, err);
      }
    });
    
    // Clear data structures
    this.clients.clear();
    this.channelSubscriptions.clear();
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.isInitialized = false;
    console.log('RealTimeUpdatesService shutdown');
  }
  
  /**
   * Get the number of active connections
   */
  public getConnectionCount(): number {
    return this.clients.size;
  }
  
  /**
   * Get the number of active channels
   */
  public getChannelCount(): number {
    return this.channelSubscriptions.size;
  }
  
  /**
   * Get information about active channels and subscribers
   */
  public getChannelInfo(): Record<string, number> {
    const channelInfo: Record<string, number> = {};
    
    this.channelSubscriptions.forEach((subscribers, channel) => {
      channelInfo[channel] = subscribers.size;
    });
    
    return channelInfo;
  }
}

// Create singleton instance
const realTimeUpdatesService = new RealTimeUpdatesService();

export default realTimeUpdatesService;
