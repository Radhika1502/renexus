import { v4 as uuidv4 } from 'uuid';
import { WebSocket as WS, WebSocketServer as WSS } from 'ws';
import { presenceManager, PresenceData } from './presence';
import { IncomingMessage } from 'http';
import { verifyToken } from '../services/auth';
import { logger } from '../utils/logger';

// Constants
const AUTH_TIMEOUT_MS = 30000; // 30 seconds
const PING_INTERVAL_MS = 30000; // 30 seconds
const PONG_TIMEOUT_MS = 10000; // 10 seconds

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
  isAlive: boolean;
  authTimer?: NodeJS.Timeout;
  pingTimer?: NodeJS.Timeout;
  pongTimer?: NodeJS.Timeout;
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
  private clients: Map<ClientId, ClientConnection> = new Map();
  private clientUserMap: Map<ClientId, string>;
  private roomClients: Map<RoomId, Set<string>>;
  private userRooms: Map<string, Set<string>>;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: any) {
    this.wss = new WSS({ server });
    this.clientUserMap = new Map();
    this.roomClients = new Map();
    this.userRooms = new Map();
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WS, request: IncomingMessage) => {
      const clientId = uuidv4();
      const clientConnection: ClientConnection = {
        ws,
        userId: null,
        isAlive: true
      };

      // Set authentication timeout
      clientConnection.authTimer = setTimeout(() => {
        logger.warn(`Client ${clientId} failed to authenticate within ${AUTH_TIMEOUT_MS}ms`);
        this.terminateConnection(clientId, 4001, 'Authentication timeout');
      }, AUTH_TIMEOUT_MS);

      // Setup ping-pong for this client
      clientConnection.pingTimer = setInterval(() => {
        if (!clientConnection.isAlive) {
          logger.warn(`Client ${clientId} failed to respond to ping`);
          return this.terminateConnection(clientId, 4002, 'Connection timeout');
        }

        clientConnection.isAlive = false;
        ws.ping();

        clientConnection.pongTimer = setTimeout(() => {
          if (!clientConnection.isAlive) {
            logger.warn(`Client ${clientId} failed to respond to ping within ${PONG_TIMEOUT_MS}ms`);
            this.terminateConnection(clientId, 4002, 'Pong timeout');
          }
        }, PONG_TIMEOUT_MS);
      }, PING_INTERVAL_MS);

      // Handle pong responses
      ws.on('pong', () => {
        clientConnection.isAlive = true;
        if (clientConnection.pongTimer) {
          clearTimeout(clientConnection.pongTimer);
        }
      });

      this.clients.set(clientId, clientConnection);
      logger.info(`Client connected: ${clientId}`);

      ws.on('message', async (data: WS.Data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          
          // Handle authentication message separately
          if (message.type === 'AUTHENTICATE') {
            await this.handleAuthentication(clientId, message as AuthenticateMessage);
            return;
          }

          // All other messages require authentication
          if (!this.clientUserMap.has(clientId)) {
            this.sendError(clientId, 'Not authenticated');
            return;
          }

          await this.handleMessage(clientId, message);
        } catch (error) {
          logger.error(`Failed to handle message from client ${clientId}:`, error);
          this.sendError(clientId, 'Invalid message format');
        }
      });

      ws.on('close', (code: number, reason: string) => {
        logger.info(`Client ${clientId} disconnected:`, { code, reason });
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error: Error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });
    });
  }

  private async handleAuthentication(clientId: string, message: AuthenticateMessage) {
    const clientConnection = this.clients.get(clientId);
    if (!clientConnection) return;

    try {
      // Verify the token from the message payload
      const userId = await verifyToken(message.payload.userId);
      if (!userId) {
        this.sendError(clientId, 'Invalid authentication token');
        this.terminateConnection(clientId, 4003, 'Authentication failed');
        return;
      }

      // Clear the auth timeout since we're now authenticated
      if (clientConnection.authTimer) {
        clearTimeout(clientConnection.authTimer);
      }

      this.clientUserMap.set(clientId, userId);
      presenceManager.addClient(clientId, userId, clientConnection.ws);
      logger.info(`Client ${clientId} authenticated as user ${userId}`);

      // Send success response
      this.sendMessage(clientId, {
        type: 'AUTHENTICATE_SUCCESS',
        payload: { userId }
      });
    } catch (error) {
      logger.error(`Authentication failed for client ${clientId}:`, error);
      this.sendError(clientId, 'Authentication failed');
      this.terminateConnection(clientId, 4003, 'Authentication failed');
    }
  }

  private async handleMessage(clientId: string, message: WebSocketMessage) {
    const clientConnection = this.clients.get(clientId);
    if (!clientConnection) return;

    const userId = this.clientUserMap.get(clientId)!;
    presenceManager.updatePresence(userId, clientId, {
      lastActive: Date.now(),
    } as any);

    try {
      switch (message.type) {
        case 'TASK_UPDATE': {
          const { taskId } = message.payload;
          if (!taskId) {
            this.sendError(clientId, 'Invalid task ID');
            return;
          }

          this.broadcastToRoom(taskId, {
            ...message,
            metadata: {
              ...message.metadata,
              timestamp: Date.now(),
              userId,
              clientId,
            },
          }, clientId);
          break;
        }

        case 'TYPING_INDICATOR': {
          const { taskId, isTyping } = message.payload;
          if (!taskId) {
            this.sendError(clientId, 'Invalid task ID');
            return;
          }

          presenceManager.updatePresence(userId, clientId, {
            isTyping,
            activeTaskId: taskId
          } as any);

          this.broadcastToRoom(taskId, {
            ...message,
            metadata: {
              timestamp: Date.now(),
              userId,
              clientId,
            },
          }, clientId);
          break;
        }

        case 'JOIN_ROOM': {
          const { roomId } = message.payload;
          if (!roomId) {
            this.sendError(clientId, 'Invalid room ID');
            return;
          }
          this.handleRoomJoin(clientId, roomId);
          break;
        }

        case 'LEAVE_ROOM': {
          const { roomId } = message.payload;
          if (!roomId) {
            this.sendError(clientId, 'Invalid room ID');
            return;
          }
          this.handleRoomLeave(clientId, roomId);
          break;
        }

        default:
          this.sendError(clientId, 'Unknown message type');
      }
    } catch (error) {
      logger.error(`Error handling message type ${message.type}:`, error);
      this.sendError(clientId, 'Internal server error');
    }
  }

  private handleDisconnect(clientId: string) {
    const clientConnection = this.clients.get(clientId);
    if (!clientConnection) return;

    // Clear all timers
    if (clientConnection.authTimer) clearTimeout(clientConnection.authTimer);
    if (clientConnection.pingTimer) clearInterval(clientConnection.pingTimer);
    if (clientConnection.pongTimer) clearTimeout(clientConnection.pongTimer);

    // Remove from presence manager if authenticated
    const userId = this.clientUserMap.get(clientId);
    if (userId) {
      presenceManager.removeClient(clientId, userId);
      this.clientUserMap.delete(clientId);

      // Leave all rooms
      const rooms = this.userRooms.get(userId);
      if (rooms) {
        rooms.forEach(roomId => this.handleRoomLeave(clientId, roomId));
      }
    }

    // Clean up client connection
    this.clients.delete(clientId);
    logger.info(`Client ${clientId} cleanup completed`);
  }

  private terminateConnection(clientId: string, code: number, reason: string) {
    const clientConnection = this.clients.get(clientId);
    if (!clientConnection) return;

    try {
      clientConnection.ws.close(code, reason);
    } catch (error) {
      logger.error(`Error closing connection for client ${clientId}:`, error);
      try {
        clientConnection.ws.terminate();
      } catch (terminateError) {
        logger.error(`Error terminating connection for client ${clientId}:`, terminateError);
      }
    }

    this.handleDisconnect(clientId);
  }

  private sendError(clientId: string, message: string) {
    this.sendMessage(clientId, {
      type: 'ERROR',
      payload: { message }
    });
  }

  private sendMessage(clientId: string, message: WebSocketMessage) {
    const clientConnection = this.clients.get(clientId);
    if (!clientConnection) return;

    try {
      clientConnection.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    }
  }

  private startHeartbeat() {
    // Clear any existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Start new heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          return this.terminateConnection(clientId, 4002, 'Heartbeat timeout');
        }
        client.isAlive = false;
        try {
          client.ws.ping();
        } catch (error) {
          logger.error(`Error sending ping to client ${clientId}:`, error);
          this.handleDisconnect(clientId);
        }
      });
    }, PING_INTERVAL_MS);
  }

  public shutdown() {
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      this.terminateConnection(clientId, 1001, 'Server shutting down');
    });

    // Close the WebSocket server
    this.wss.close(() => {
      logger.info('WebSocket server shut down');
    });
  }

  public broadcastToRoom(roomId: RoomId, message: WebSocketMessage, excludeClientId?: string) {
    const roomClients = this.roomClients.get(roomId);
    if (roomClients) {
      roomClients.forEach(clientId => {
        if (clientId !== excludeClientId) {
          const client = this.clients.get(clientId);
          if (client && client.ws.readyState === WS.OPEN) {
            client.ws.send(JSON.stringify(message));
          }
        }
      });
    }
  }

  private notifyUser(userId: string, message: WebSocketMessage) {
    this.clientUserMap.forEach((uid, clientId) => {
      if (uid === userId) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WS.OPEN) {
          client.ws.send(JSON.stringify(message));
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
