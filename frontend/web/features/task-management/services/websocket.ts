import { Task } from '../types';

// WebSocket event types
export type WebSocketEventType = 
  | 'task_created' 
  | 'task_updated' 
  | 'task_deleted' 
  | 'comment_added' 
  | 'comment_updated' 
  | 'comment_deleted'
  | 'attachment_added'
  | 'attachment_deleted'
  | 'user_presence';

// WebSocket message structure
export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
  senderId: string;
}

// User presence data
export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  taskId?: string;
  action: 'viewing' | 'editing' | 'inactive';
  lastActive: string;
}

// WebSocket service class
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private presenceInterval: NodeJS.Timeout | null = null;
  private currentTaskId: string | null = null;
  private currentUserId: string | null = null;
  private currentAction: 'viewing' | 'editing' | 'inactive' = 'inactive';

  // Initialize WebSocket connection
  connect(userId: string, authToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentUserId = userId;
        const wsUrl = `${process.env.REACT_APP_WS_URL || 'wss://api.renexus.com'}/tasks`;
        
        this.socket = new WebSocket(`${wsUrl}?token=${authToken}`);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.reconnectAttempts = 0;
          this.startPresenceUpdates();
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.notifyListeners(message.type, message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this.stopPresenceUpdates();
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect(userId, authToken);
            }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts));
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect WebSocket
  disconnect(): void {
    this.stopPresenceUpdates();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.currentTaskId = null;
    this.currentAction = 'inactive';
  }

  // Send message through WebSocket
  send<T>(type: WebSocketEventType, payload: T): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: WebSocketMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      senderId: this.currentUserId || '',
    };

    this.socket.send(JSON.stringify(message));
  }

  // Subscribe to specific event type
  subscribe<T>(type: WebSocketEventType, callback: (data: WebSocketMessage<T>) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  // Notify all listeners of a specific event type
  private notifyListeners(type: WebSocketEventType, data: any): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${type}:`, error);
        }
      });
    }
  }

  // Update user presence on a task
  updatePresence(taskId: string | null, action: 'viewing' | 'editing' | 'inactive'): void {
    this.currentTaskId = taskId;
    this.currentAction = action;
    
    if (taskId && this.currentUserId) {
      this.sendPresenceUpdate();
    }
  }

  // Start sending periodic presence updates
  private startPresenceUpdates(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    
    // Send initial presence update
    if (this.currentTaskId && this.currentAction !== 'inactive') {
      this.sendPresenceUpdate();
    }
    
    // Send presence updates every 30 seconds
    this.presenceInterval = setInterval(() => {
      if (this.currentTaskId && this.currentAction !== 'inactive') {
        this.sendPresenceUpdate();
      }
    }, 30000);
  }

  // Stop sending presence updates
  private stopPresenceUpdates(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    
    // Send inactive status if we were on a task
    if (this.currentTaskId && this.currentUserId) {
      this.send<UserPresence>('user_presence', {
        userId: this.currentUserId,
        username: '', // Will be filled by server
        taskId: this.currentTaskId,
        action: 'inactive',
        lastActive: new Date().toISOString()
      });
    }
  }

  // Send presence update
  private sendPresenceUpdate(): void {
    if (!this.currentUserId || !this.currentTaskId) return;
    
    this.send<UserPresence>('user_presence', {
      userId: this.currentUserId,
      username: '', // Will be filled by server
      taskId: this.currentTaskId,
      action: this.currentAction,
      lastActive: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
