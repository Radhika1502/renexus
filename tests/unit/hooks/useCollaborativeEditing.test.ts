import { renderHook, act } from '@testing-library/react';
import { useCollaborativeEditing } from '../../../frontend/web/src/hooks/useCollaborativeEditing';

jest.mock('../../../frontend/web/src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    sendMessage: jest.fn()
  })
}));

describe('useCollaborativeEditing', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User'
  };

  const mockDocument = {
    id: 'doc1',
    content: 'Initial content'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with initial content', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    expect(result.current.content).toBe(mockDocument.content);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle insert operations', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: 'Hello'
    }));

    act(() => {
      result.current.sendOperation('insert', 5, ' World');
    });

    expect(result.current.content).toBe('Hello World');
  });

  it('should handle delete operations', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: 'Hello World'
    }));

    act(() => {
      result.current.sendOperation('delete', 5, ' World');
    });

    expect(result.current.content).toBe('Hello');
  });

  it('should handle update operations', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: 'Hello World'
    }));

    act(() => {
      result.current.sendOperation('update', 0, 'Hi');
    });

    expect(result.current.content).toBe('Hi World');
  });

  it('should handle cursor updates', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    act(() => {
      result.current.updateCursor(5);
    });

    expect(result.current.cursors).toContainEqual(expect.objectContaining({
      userId: mockUser.id,
      position: 5
    }));
  });

  it('should transform concurrent operations correctly', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: 'Hello'
    }));

    // Simulate concurrent operations
    act(() => {
      // Local operation
      result.current.sendOperation('insert', 5, ' World');
      
      // Remote operation (earlier timestamp)
      const remoteOp = {
        id: 'op1',
        userId: 'user2',
        type: 'insert',
        position: 0,
        content: 'Hey ',
        timestamp: Date.now() - 1000
      };
      
      result.current.handleRemoteOperation(remoteOp);
    });

    // The final content should have both operations applied in the correct order
    expect(result.current.content).toBe('Hey Hello World');
  });

  it('should handle sync requests and responses', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: ''
    }));

    act(() => {
      // Simulate sync response
      result.current.handleSyncResponse({
        content: mockDocument.content,
        operations: []
      });
    });

    expect(result.current.content).toBe(mockDocument.content);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors gracefully', () => {
    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    act(() => {
      // Simulate invalid operation
      result.current.handleRemoteOperation({
        id: 'op1',
        userId: 'user2',
        type: 'invalid' as any,
        position: 0,
        content: 'test',
        timestamp: Date.now()
      });
    });

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

    const { result } = renderHook(() => useCollaborativeEditing({
      documentId: mockDocument.id,
      userId: mockUser.id,
      userName: mockUser.name,
      initialContent: mockDocument.content
    }));

    expect(result.current.cursors).toEqual([]);
  });
}); 