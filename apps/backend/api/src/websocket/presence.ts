import { WebSocket } from 'ws';

export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  activeTaskId?: string;
  typingIn?: string[];
}

export class PresenceManager {
  private presences: Map<string, PresenceData> = new Map();
  private clientPresenceMap: Map<string, Set<string>> = new Map(); // userId -> Set<clientId>
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();

  updatePresence(userId: string, clientId: string, data: Partial<PresenceData>): PresenceData {
    const existing = this.presences.get(userId) || {
      userId,
      status: 'online',
      lastSeen: new Date(),
      typingIn: [],
    };

    const updated = {
      ...existing,
      ...data,
      lastSeen: new Date(),
    };

    this.presences.set(userId, updated);

    // Track which clients are associated with this user
    if (!this.clientPresenceMap.has(userId)) {
      this.clientPresenceMap.set(userId, new Set());
    }
    this.clientPresenceMap.get(userId)?.add(clientId);

    return updated;
  }

  setTyping(userId: string, taskId: string, isTyping: boolean): boolean {
    const presence = this.presences.get(userId);
    if (!presence) return false;

    const typingIn = new Set(presence.typingIn || []);
    
    if (isTyping) {
      // Clear any existing timer
      const timerKey = `${userId}:${taskId}`;
      const existingTimer = this.typingTimers.get(timerKey);
      if (existingTimer) clearTimeout(existingTimer);
      
      // Set a new timer to automatically stop typing after 5 seconds
      const timer = setTimeout(() => {
        this.setTyping(userId, taskId, false);
        this.typingTimers.delete(timerKey);
      }, 5000);
      
      this.typingTimers.set(timerKey, timer);
      typingIn.add(taskId);
    } else {
      typingIn.delete(taskId);
    }
    
    presence.typingIn = Array.from(typingIn);
    return true;
  }

  getPresence(userId: string): PresenceData | undefined {
    return this.presences.get(userId);
  }

  getUsersInRoom(roomId: string): PresenceData[] {
    // In a real implementation, track which users are in which rooms
    // For now, return all online users
    return Array.from(this.presences.values())
      .filter(p => p.status === 'online');
  }

  removeClient(clientId: string, userId: string) {
    const clients = this.clientPresenceMap.get(userId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        // No more clients for this user, mark as offline
        const presence = this.presences.get(userId);
        if (presence) {
          presence.status = 'offline';
          presence.lastSeen = new Date();
        }
        this.clientPresenceMap.delete(userId);
      }
    }
  }
}

export const presenceManager = new PresenceManager();
