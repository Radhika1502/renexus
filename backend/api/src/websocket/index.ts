import { Server } from 'http';
import WebSocketServer from './WebSocketServer';

let webSocketServer: WebSocketServer | null = null;

export const initializeWebSocket = (server: Server) => {
  if (!webSocketServer) {
    webSocketServer = new WebSocketServer(server);
    console.log('WebSocket server initialized');
  }
  return webSocketServer;
};

export const getWebSocketServer = (): WebSocketServer => {
  if (!webSocketServer) {
    throw new Error('WebSocket server not initialized');
  }
  return webSocketServer;
};

export { WebSocketMessage } from './WebSocketServer';
