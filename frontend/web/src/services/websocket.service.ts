import { EventEmitter } from 'events';
import ReconnectingWebSocket from 'reconnecting-websocket';

export interface WebSocketMessage {
  type: string;
  payload: any;
  metadata?: {
    timestamp?: number;
    requestId?: string;
  };
}

export interface WebSocketConfig {
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  connectionTimeout?: number;
  debug?: boolean;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'max_retries_reached';

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: ReconnectingWebSocket | null = null;
  private eventEmitter = new EventEmitter();
  private reconnectAttempts = 0;
  private connectionState: ConnectionState = 'disconnected';
  private pendingMessages: Map<string, { 
    message: WebSocketMessage; 
    timestamp: number;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private messageTimeout = 10000; // 10 seconds
  private messageCleanupInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number = Date.now();

  // Configuration
  private readonly config: Required<WebSocketConfig> = {
    maxReconnectAttempts: 5,
    initialReconnectDelay: 1000,
    maxReconnectDelay: 30000,
    connectionTimeout: 4000,
    debug: process.env.NODE_ENV === 'development'
  };

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  configure(config: Partial<WebSocketConfig>): void {
    Object.assign(this.config, config);
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }

  private error(...args: any[]): void {
    console.error('[WebSocket]', ...args);
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.log('Already connected');
        resolve();
        return;
      }

      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
                    `${protocol}//${window.location.host}/ws`;

      this.connectionState = 'connecting';
      this.eventEmitter.emit('connectionStateChanged', this.connectionState);
      
      this.socket = new ReconnectingWebSocket(wsUrl, [], {
        WebSocket: WebSocket,
        connectionTimeout: this.config.connectionTimeout,
        maxRetries: this.config.maxReconnectAttempts,
        maxReconnectAttempts: this.config.maxReconnectAttempts,
        reconnectionDelayGrowFactor: 1.5,
        minReconnectionDelay: this.config.initialReconnectDelay,
        maxReconnectionDelay: this.config.maxReconnectDelay,
      });

      // Setup connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          this.error('Connection timeout');
          this.connectionState = 'error';
          this.eventEmitter.emit('connectionStateChanged', this.connectionState);
          reject(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeout);

      this.socket.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
        this.log('Connected');
        this.reconnectAttempts = 0;
        this.connectionState = 'connected';
        this.eventEmitter.emit('connectionStateChanged', this.connectionState);
        
        // Send authentication message
        this.sendWithResponse({
          type: 'AUTHENTICATE',
          payload: { token }
        }).then(() => {
          this.setupPing();
          resolve();
        }).catch((error) => {
          this.error('Authentication failed:', error);
          this.disconnect();
          reject(error);
        });
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle system messages
          if (message.type === 'ERROR') {
            this.error('Server error:', message.payload);
            this.eventEmitter.emit('error', message.payload);
            return;
          }

          if (message.type === 'PONG') {
            this.lastPongTime = Date.now();
            return;
          }

          // Handle response messages
          if (message.metadata?.requestId) {
            const pending = this.pendingMessages.get(message.metadata.requestId);
            if (pending) {
              this.pendingMessages.delete(message.metadata.requestId);
              if (message.type === 'ERROR') {
                pending.reject(new Error(message.payload.message));
              } else {
                pending.resolve(message.payload);
              }
              return;
            }
          }

          // Emit regular messages
          this.eventEmitter.emit(message.type, message.payload);
        } catch (error) {
          this.error('Failed to parse message:', error);
        }
      });

      this.socket.addEventListener('close', (event) => {
        clearTimeout(connectionTimeout);
        this.log('Disconnected:', event.code, event.reason);
        this.connectionState = 'disconnected';
        this.eventEmitter.emit('connectionStateChanged', this.connectionState);
        
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
          this.error('Max reconnection attempts reached');
          this.connectionState = 'max_retries_reached';
          this.eventEmitter.emit('connectionStateChanged', this.connectionState);
          this.cleanup();
        }
      });

      this.socket.addEventListener('error', (error) => {
        this.error('Socket error:', error);
        this.connectionState = 'error';
        this.eventEmitter.emit('connectionStateChanged', this.connectionState);
        this.eventEmitter.emit('error', error);
      });

      // Start message cleanup interval
      this.messageCleanupInterval = setInterval(() => {
        const now = Date.now();
        this.pendingMessages.forEach((pending, requestId) => {
          if (now - pending.timestamp > this.messageTimeout) {
            pending.reject(new Error('Message timeout'));
            this.pendingMessages.delete(requestId);
          }
        });
      }, 1000);
    });
  }

  private setupPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Check if we've received a pong recently
        if (Date.now() - this.lastPongTime > 40000) { // No pong for 40 seconds
          this.error('No pong received, reconnecting...');
          this.reconnect();
          return;
        }

        this.send({
          type: 'PING',
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private cleanup(): void {
    if (this.messageCleanupInterval) {
      clearInterval(this.messageCleanupInterval);
      this.messageCleanupInterval = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Reject all pending messages
    this.pendingMessages.forEach(pending => {
      pending.reject(new Error('Connection closed'));
    });
    this.pendingMessages.clear();
  }

  disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting');
      this.socket = null;
    }
    this.connectionState = 'disconnected';
    this.eventEmitter.emit('connectionStateChanged', this.connectionState);
  }

  reconnect(): void {
    this.disconnect();
    // ReconnectingWebSocket will handle the reconnection
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async sendWithResponse(message: WebSocketMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const requestId = this.generateRequestId();
      const messageWithMetadata = {
        ...message,
        metadata: {
          ...message.metadata,
          requestId,
          timestamp: Date.now()
        }
      };

      this.pendingMessages.set(requestId, {
        message: messageWithMetadata,
        timestamp: Date.now(),
        resolve,
        reject
      });

      try {
        this.socket.send(JSON.stringify(messageWithMetadata));
      } catch (error) {
        this.pendingMessages.delete(requestId);
        reject(error);
      }
    });
  }

  send(message: WebSocketMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.error('Cannot send message, socket not connected');
      return;
    }

    try {
      this.socket.send(JSON.stringify({
        ...message,
        metadata: {
          ...message.metadata,
          timestamp: Date.now()
        }
      }));
    } catch (error) {
      this.error('Failed to send message:', error);
      this.eventEmitter.emit('error', error);
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.eventEmitter.on('connectionStateChanged', callback);
    return () => this.eventEmitter.off('connectionStateChanged', callback);
  }

  onError(callback: (error: Error) => void): () => void {
    this.eventEmitter.on('error', callback);
    return () => this.eventEmitter.off('error', callback);
  }

  subscribe<T = any>(type: string, callback: (payload: T) => void): () => void {
    this.eventEmitter.on(type, callback);
    return () => this.eventEmitter.off(type, callback);
  }

  // Task-related methods
  async subscribeToTaskUpdates(taskId: string, callback: (update: any) => void): Promise<() => void> {
    await this.sendWithResponse({
      type: 'JOIN_ROOM',
      payload: { roomId: `task:${taskId}` }
    });

    return this.subscribe(`TASK_UPDATE:${taskId}`, callback);
  }

  // Project-related methods
  async subscribeToProjectUpdates(projectId: string, callback: (update: any) => void): Promise<() => void> {
    await this.sendWithResponse({
      type: 'JOIN_ROOM',
      payload: { roomId: `project:${projectId}` }
    });

    return this.subscribe(`PROJECT_UPDATE:${projectId}`, callback);
  }

  // Presence-related methods
  async subscribeToUserPresence(projectId: string, callback: (presence: any) => void): Promise<() => void> {
    await this.sendWithResponse({
      type: 'JOIN_ROOM',
      payload: { roomId: `presence:${projectId}` }
    });

    return this.subscribe(`PRESENCE_UPDATE:${projectId}`, callback);
  }

  updateUserPresence(projectId: string, status: 'online' | 'away' | 'offline'): void {
    this.send({
      type: 'PRESENCE_UPDATE',
      payload: { projectId, status }
    });
  }

  // Collaborative editing methods
  async startCollaborativeEditing(taskId: string): Promise<void> {
    await this.sendWithResponse({
      type: 'JOIN_ROOM',
      payload: { roomId: `task:${taskId}:editing` }
    });
  }

  async stopCollaborativeEditing(taskId: string): Promise<void> {
    await this.sendWithResponse({
      type: 'LEAVE_ROOM',
      payload: { roomId: `task:${taskId}:editing` }
    });
  }

  sendCollaborativeEdit(taskId: string, change: any): void {
    this.send({
      type: 'COLLABORATIVE_EDIT',
      payload: { taskId, change }
    });
  }
} 