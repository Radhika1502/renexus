import { describe, expect, jest, it } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCollaborativeEditing } from '@packages/ui/hooks/useCollaborativeEditing';

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock document object
const mockDocument = {
  id: 'doc123',
  content: 'Initial content'
};

// Mock user
const mockUser = {
  id: 'user123',
  name: 'Test User'
};

// Mock WebSocket constructor
(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe('useCollaborativeEditing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    expect(result.current.content).toBe(mockDocument.content);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.collaborators).toEqual([]);
  });

  it('should handle update operations', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    act(() => {
      result.current.updateContent('New content');
    });

    expect(result.current.content).toBe('New content');
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('New content')
    );
  });

  it('should handle cursor updates', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    act(() => {
      result.current.updateCursor({ line: 1, ch: 5 });
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"line":1,"ch":5')
    );
  });

  it('should transform concurrent operations correctly', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    // Simulate receiving a remote operation
    act(() => {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'operation',
          userId: 'other-user',
          operation: {
            type: 'insert',
            position: 0,
            content: 'Remote '
          }
        })
      });
      mockWebSocket.onmessage(messageEvent);
    });

    // Local operation
    act(() => {
      result.current.updateContent('Local content');
    });

    expect(result.current.content).toContain('Remote');
    expect(result.current.content).toContain('Local');
  });

  it('should handle sync requests and responses', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    // Simulate receiving a sync request
    act(() => {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'sync_request',
          userId: 'other-user'
        })
      });
      mockWebSocket.onmessage(messageEvent);
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('sync_response')
    );
  });

  it('should handle errors gracefully', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    // Simulate a WebSocket error
    act(() => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Connection failed'
      });
      mockWebSocket.onerror(errorEvent);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should cleanup cursors on unmount', () => {
    const { unmount } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalled();
  });
}); 