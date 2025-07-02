import { User } from '../../team-management/types';

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  replies?: CommentReply[];
  resourceId: string;
  resourceType: 'task' | 'project' | 'document';
  mentions?: string[]; // User IDs that are mentioned
}

export interface CommentReply {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  commentId: string;
  mentions?: string[]; // User IDs that are mentioned
}

export interface CreateCommentDto {
  content: string;
  resourceId: string;
  resourceType: 'task' | 'project' | 'document';
  mentions?: string[];
}

export interface CreateReplyDto {
  content: string;
  commentId: string;
  mentions?: string[];
}

export interface UpdateCommentDto {
  content: string;
  mentions?: string[];
}

export interface Notification {
  id: string;
  type: 'mention' | 'comment' | 'reply' | 'assignment' | 'status_change' | 'deadline';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  resourceId?: string;
  resourceType?: 'task' | 'project' | 'document' | 'comment';
  actionUrl?: string;
  senderId?: string;
  sender?: User;
  recipientId: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  location: {
    type: 'project' | 'task' | 'document';
    id: string;
    path?: string;
  };
  lastActive: Date;
  status: 'online' | 'away' | 'offline';
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: User;
  resourceId: string;
  resourceType: 'task' | 'project' | 'document' | 'comment';
  version?: number;
  previousVersions?: FileAttachment[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  createdAt: string;
  createdBy: User;
  comment?: string;
}

export interface CollaborativeDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  projectId?: string;
  taskId?: string;
  currentVersion: number;
  versions?: DocumentVersion[];
  lastEditedBy?: User;
  lastEditedAt?: string;
  permissions: {
    canEdit: string[]; // User IDs
    canView: string[]; // User IDs
  };
}
