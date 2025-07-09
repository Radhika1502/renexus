import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { v4 as uuidv4 } from 'uuid';

interface Operation {
  id: string;
  userId: string;
  type: 'insert' | 'delete' | 'update';
  position: number;
  content: string;
  timestamp: number;
}

interface Cursor {
  userId: string;
  userName: string;
  position: number;
  color: string;
}

interface UseCollaborativeEditingOptions {
  documentId: string;
  userId: string;
  userName: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export const useCollaborativeEditing = ({
  documentId,
  userId,
  userName,
  initialContent = '',
  onContentChange
}: UseCollaborativeEditingOptions) => {
  const [content, setContent] = useState(initialContent);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const operationsRef = useRef<Operation[]>([]);
  const contentRef = useRef(content);
  const cursorRef = useRef<number>(0);

  const { isConnected, sendMessage } = useWebSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL}/document/${documentId}`,
    onMessage: (data) => {
      switch (data.type) {
        case 'OPERATION':
          handleRemoteOperation(data.payload);
          break;
        case 'CURSOR_UPDATE':
          handleCursorUpdate(data.payload);
          break;
        case 'SYNC_REQUEST':
          handleSyncRequest(data.payload);
          break;
        case 'SYNC_RESPONSE':
          handleSyncResponse(data.payload);
          break;
      }
    },
    onConnect: () => {
      // Request initial sync
      sendMessage({
        type: 'SYNC_REQUEST',
        payload: {
          userId,
          documentId
        }
      });
    }
  });

  // Handle remote operation
  const handleRemoteOperation = useCallback((operation: Operation) => {
    if (operation.userId === userId) return;

    try {
      // Transform operation against all operations that happened after it
      const transformedOp = transformOperation(
        operation,
        operationsRef.current.filter(op => op.timestamp > operation.timestamp)
      );

      // Apply the transformed operation
      applyOperation(transformedOp);

      // Add to operation history
      operationsRef.current.push(operation);

      // Sort operations by timestamp
      operationsRef.current.sort((a, b) => a.timestamp - b.timestamp);

      // Update content
      setContent(contentRef.current);
      onContentChange?.(contentRef.current);

    } catch (err) {
      console.error('Failed to apply remote operation:', err);
      setError(err as Error);
    }
  }, [userId, onContentChange]);

  // Handle cursor update
  const handleCursorUpdate = useCallback((cursor: Cursor) => {
    if (cursor.userId === userId) return;

    setCursors(prev => {
      const filtered = prev.filter(c => c.userId !== cursor.userId);
      return [...filtered, cursor];
    });
  }, [userId]);

  // Handle sync request
  const handleSyncRequest = useCallback((request: { userId: string }) => {
    sendMessage({
      type: 'SYNC_RESPONSE',
      payload: {
        userId: request.userId,
        content: contentRef.current,
        operations: operationsRef.current
      }
    });
  }, [sendMessage]);

  // Handle sync response
  const handleSyncResponse = useCallback((response: {
    content: string;
    operations: Operation[];
  }) => {
    contentRef.current = response.content;
    operationsRef.current = response.operations;
    setContent(response.content);
    setIsLoading(false);
  }, []);

  // Apply operation to content
  const applyOperation = useCallback((operation: Operation) => {
    switch (operation.type) {
      case 'insert':
        contentRef.current = 
          contentRef.current.slice(0, operation.position) +
          operation.content +
          contentRef.current.slice(operation.position);
        break;

      case 'delete':
        contentRef.current = 
          contentRef.current.slice(0, operation.position) +
          contentRef.current.slice(operation.position + operation.content.length);
        break;

      case 'update':
        contentRef.current = 
          contentRef.current.slice(0, operation.position) +
          operation.content +
          contentRef.current.slice(operation.position + operation.content.length);
        break;
    }
  }, []);

  // Transform operation against another operation
  const transformOperation = (op: Operation, operations: Operation[]): Operation => {
    let transformed = { ...op };

    for (const other of operations) {
      if (other.type === 'insert' && other.position <= transformed.position) {
        transformed.position += other.content.length;
      } else if (other.type === 'delete' && other.position < transformed.position) {
        transformed.position -= Math.min(
          other.content.length,
          transformed.position - other.position
        );
      }
    }

    return transformed;
  };

  // Send local operation
  const sendOperation = useCallback((type: Operation['type'], position: number, content: string) => {
    if (!isConnected) return;

    const operation: Operation = {
      id: uuidv4(),
      userId,
      type,
      position,
      content,
      timestamp: Date.now()
    };

    // Apply locally first
    applyOperation(operation);
    operationsRef.current.push(operation);

    // Send to server
    sendMessage({
      type: 'OPERATION',
      payload: operation
    });

    // Update content
    setContent(contentRef.current);
    onContentChange?.(contentRef.current);
  }, [isConnected, userId, applyOperation, sendMessage, onContentChange]);

  // Update cursor position
  const updateCursor = useCallback((position: number) => {
    if (!isConnected) return;

    cursorRef.current = position;

    sendMessage({
      type: 'CURSOR_UPDATE',
      payload: {
        userId,
        userName,
        position,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }
    });
  }, [isConnected, userId, userName, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setCursors([]);
    };
  }, []);

  return {
    content,
    cursors,
    isLoading,
    error,
    sendOperation,
    updateCursor
  };
}; 