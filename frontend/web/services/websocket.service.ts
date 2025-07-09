import { EventEmitter } from 'events';
import ReconnectingWebSocket from 'reconnecting-websocket';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: ReconnectingWebSocket | null = null;
  private eventEmitter = new EventEmitter();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(token: string): void {
    if (this.socket) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws';
    
    this.socket = new ReconnectingWebSocket(wsUrl, [], {
      WebSocket: WebSocket,
      connectionTimeout: 4000,
      maxRetries: this.maxReconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectionDelayGrowFactor: 1.5,
      minReconnectionDelay: this.reconnectInterval,
      maxReconnectionDelay: this.maxReconnectInterval,
    });

    this.socket.addEventListener('open', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send authentication message
      this.send({
        type: 'authenticate',
        payload: { token },
      });

      this.eventEmitter.emit('connected');
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.eventEmitter.emit(message.type, message.payload);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.socket.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      this.eventEmitter.emit('disconnected');
      
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.eventEmitter.emit('max_reconnects');
      }
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.eventEmitter.emit('error', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  subscribe<T = any>(type: string, callback: (payload: T) => void): () => void {
    this.eventEmitter.on(type, callback);
    return () => this.eventEmitter.off(type, callback);
  }

  subscribeToTaskUpdates(taskId: string, callback: (update: any) => void): () => void {
    this.send({
      type: 'subscribe_task',
      payload: { taskId },
    });
    return this.subscribe(`task_update:${taskId}`, callback);
  }

  subscribeToProjectUpdates(projectId: string, callback: (update: any) => void): () => void {
    this.send({
      type: 'subscribe_project',
      payload: { projectId },
    });
    return this.subscribe(`project_update:${projectId}`, callback);
  }

  subscribeToUserPresence(projectId: string, callback: (presence: any) => void): () => void {
    this.send({
      type: 'subscribe_presence',
      payload: { projectId },
    });
    return this.subscribe(`presence:${projectId}`, callback);
  }

  updateUserPresence(projectId: string, status: 'online' | 'away' | 'offline'): void {
    this.send({
      type: 'update_presence',
      payload: { projectId, status },
    });
  }

  startCollaborativeEditing(taskId: string): void {
    this.send({
      type: 'start_collaborative_editing',
      payload: { taskId },
    });
  }

  stopCollaborativeEditing(taskId: string): void {
    this.send({
      type: 'stop_collaborative_editing',
      payload: { taskId },
    });
  }

  sendCollaborativeEdit(taskId: string, change: any): void {
    this.send({
      type: 'collaborative_edit',
      payload: { taskId, change },
    });
  }
} 