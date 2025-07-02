import { v4 as uuidv4 } from 'uuid';
import { WebSocket as WS, WebSocketServer as WSS } from 'ws';
import { presenceManager, PresenceData } from './presence';
import { IncomingMessage } from 'http';

// Type aliases for clarity
type ClientId = string;
type RoomId = string;

// Extend PresenceData with additional fields
interface ExtendedPresenceData extends PresenceData {
  lastActive?: number;
  isTyping?: boolean;
  activeTaskId?: string;
}

// Type for WebSocket client connection
interface ClientConnection {
  ws: WS;
  userId: string | null;
}

// Base WebSocket message type
interface WebSocketMessage {
  type: string;
  payload: any;
  metadata?: {
    timestamp?: number;
    userId?: string;
    clientId?: string;
    taskId?: string;
  };
}

// Message types
interface TaskUpdateMessage extends WebSocketMessage {
  type: 'TASK_UPDATE';
  payload: {
    taskId: string;
    type: 'STATUS_CHANGE' | 'DESCRIPTION_CHANGE' | 'ASSIGNEE_CHANGE' | 'TITLE_CHANGE' | 'DUE_DATE_CHANGE' | 'PRIORITY_CHANGE';
    changes: Record<string, unknown>;
    updatedAt: string;
  };
  metadata: {
    timestamp: number;
    userId: string;
    clientId: string;
  };
}

interface TypingIndicatorMessage extends WebSocketMessage {
  type: 'TYPING_INDICATOR';
  payload: {
    taskId: string;
    userId: string;
    isTyping: boolean;
  };
  metadata: {
    timestamp: number;
    userId: string;
    clientId: string;
  };
}

interface PresenceUpdateMessage extends WebSocketMessage {
  type: 'PRESENCE_UPDATE';
  payload: Partial<ExtendedPresenceData>;
  metadata: {
    timestamp: number;
    userId: string;
    clientId: string;
  };
}

interface CommentAddMessage extends WebSocketMessage {
  type: 'COMMENT_ADD';
  payload: {
    taskId: string;
    commentId: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    createdAt: string;
  };
  metadata: {
    timestamp: number;
    userId: string;
    clientId: string;
  };
}

interface AuthenticateMessage extends WebSocketMessage {
  type: 'AUTHENTICATE';
  payload: {
    userId: string;
  };
}

interface JoinRoomMessage extends WebSocketMessage {
  type: 'JOIN_ROOM';
  payload: {
    roomId: string;
  };
}

interface LeaveRoomMessage extends WebSocketMessage {
  type: 'LEAVE_ROOM';
  payload: {
    roomId: string;
  };
}

class WebSocketServer {
  private wss: WSS;
  private clients: Map<string, WS> = new Map();
  private clientUserMap: Map<string, string>;
  private roomClients: Map<RoomId, Set<string>>;
  private userRooms: Map<string, Set<string>>;

  constructor(server: any) {
    this.wss = new WSS({ server });
    this.clientUserMap = new Map();
    this.roomClients = new Map();
    this.userRooms = new Map();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WS, request: IncomingMessage) => {
      const clientId = uuidv4();
      this.clients.set(clientId, ws);
      console.log(`Client connected: ${clientId}`);

      ws.on('message', (data: WS.Data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error(`Failed to parse message from client ${clientId}:`, error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const { type, payload } = message;
    const client = this.clients.get(clientId);
    if (!client) return;

    if (this.clientUserMap.has(clientId)) {
      const userId = this.clientUserMap.get(clientId)!;
      presenceManager.updatePresence(userId, clientId, {
        lastActive: Date.now(),
      } as any);
    }

    switch (type) {
      case 'AUTHENTICATE': {
        const { userId } = payload;
        if (typeof userId === 'string') {
          this.clientUserMap.set(clientId, userId);
          presenceManager.addClient(clientId, userId, client);
          console.log(`Client ${clientId} authenticated as user ${userId}`);
        }
        break;
      }
      case 'TASK_UPDATE': {
        const roomId = payload.taskId;
        if (roomId && this.clientUserMap.has(clientId)) {
          const userId = this.clientUserMap.get(clientId)!;
          this.broadcastToRoom(roomId, {
            ...message,
            metadata: {
              ...message.metadata,
              timestamp: Date.now(),
              userId,
              clientId,
            },
          }, clientId);
        }
        break;
      }
      case 'TYPING_INDICATOR': {
        const roomId = payload.taskId;
        if (roomId && this.clientUserMap.has(clientId)) {
          const userId = this.clientUserMap.get(clientId)!;
          presenceManager.updatePresence(userId, clientId, {
            isTyping: payload.isTyping,
            activeTaskId: roomId,
          } as any);
          this.broadcastToRoom(roomId, message, clientId);
        }
        break;
      }
      case 'PRESENCE_UPDATE': {
        if (this.clientUserMap.has(clientId)) {
          const userId = this.clientUserMap.get(clientId)!;
          presenceManager.updatePresence(userId, clientId, payload as any);
        }
        break;
      }
      case 'COMMENT_ADD': {
        const roomId = payload.taskId;
        if (roomId && this.clientUserMap.has(clientId)) {
          const userId = this.clientUserMap.get(clientId)!;
          this.broadcastToRoom(roomId, {
            ...message,
            metadata: {
              ...message.metadata,
              timestamp: Date.now(),
              userId,
              clientId,
            },
          }, clientId);
        }
        break;
      }
      case 'JOIN_ROOM': {
        const { roomId } = payload;
        if (roomId && typeof roomId === 'string') {
          this.handleRoomJoin(clientId, roomId);
        }
        break;
      }
      case 'LEAVE_ROOM': {
        const { roomId } = payload;
        if (roomId && typeof roomId === 'string') {
          this.handleRoomLeave(clientId, roomId);
        }
        break;
      }
      default:
        console.log(`Unknown message type from ${clientId}: ${type}`);
        break;
    }
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (this.clientUserMap.has(clientId)) {
      const userId = this.clientUserMap.get(clientId)!;
      presenceManager.removeClient(clientId, userId);
      this.clientUserMap.delete(clientId);
    }

    this.roomClients.forEach((clients, roomId) => {
      if (clients.has(clientId)) {
        this.handleRoomLeave(clientId, roomId);
      }
    });

    this.clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  }

  public broadcastToRoom(roomId: RoomId, message: WebSocketMessage, excludeClientId?: string) {
    const roomClients = this.roomClients.get(roomId);
    if (roomClients) {
      roomClients.forEach(clientId => {
        if (clientId !== excludeClientId) {
          const client = this.clients.get(clientId);
          if (client && client.readyState === WS.OPEN) {
            client.send(JSON.stringify(message));
          }
        }
      });
    }
  }

  private notifyUser(userId: string, message: WebSocketMessage) {
    this.clientUserMap.forEach((uid, clientId) => {
      if (uid === userId) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WS.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    });
  }

  private handleRoomJoin(clientId: string, roomId: string) {
    const roomClients = this.roomClients.get(roomId) || new Set();
    roomClients.add(clientId);
    this.roomClients.set(roomId, roomClients);
    console.log(`Client ${clientId} joined room ${roomId}`);
  }
  
  private handleRoomLeave(clientId: string, roomId: string) {
    const roomClients = this.roomClients.get(roomId);
    if (roomClients) {
      roomClients.delete(clientId);
      if (roomClients.size === 0) {
        this.roomClients.delete(roomId);
      }
    }
    console.log(`Client ${clientId} left room ${roomId}`);
  }
}

export default WebSocketServer;
