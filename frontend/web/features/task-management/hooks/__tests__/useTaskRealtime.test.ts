import { renderHook, act } from '@testing-library/react';
import { useTaskRealtime } from '../useTaskRealtime';
import { websocketService } from '../../services/websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(),
}));

jest.mock('../../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/websocket', () => ({
  websocketService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    updatePresence: jest.fn(),
    subscribe: jest.fn().mockReturnValue(jest.fn()),
  },
}));

describe('useTaskRealtime', () => {
  const mockQueryClient = {
    setQueryData: jest.fn(),
    removeQueries: jest.fn(),
    invalidateQueries: jest.fn(),
  };

  const mockUser = { id: 'user-123', name: 'Test User' };
  const mockToken = 'test-token';
  const mockTaskId = 'task-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, token: mockToken });
  });

  it('should connect to WebSocket on mount', async () => {
    const { result } = renderHook(() => useTaskRealtime(mockTaskId));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(websocketService.connect).toHaveBeenCalledWith(mockUser.id, mockToken);
    expect(result.current.isConnected).toBe(true);
  });

  it('should update presence when taskId changes', async () => {
    const { result, rerender } = renderHook(
      ({ taskId }: { taskId: string }) => useTaskRealtime(taskId),
      { initialProps: { taskId: mockTaskId } }
    );
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(websocketService.updatePresence).toHaveBeenCalledWith(mockTaskId, 'viewing');
    
    // Change taskId
    rerender({ taskId: 'task-456' });
    
    expect(websocketService.updatePresence).toHaveBeenCalledWith('task-456', 'viewing');
  });

  it('should disconnect WebSocket on unmount', async () => {
    const { unmount } = renderHook(() => useTaskRealtime(mockTaskId));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    unmount();
    
    expect(websocketService.disconnect).toHaveBeenCalled();
  });

  it('should subscribe to WebSocket events', async () => {
    renderHook(() => useTaskRealtime(mockTaskId));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(websocketService.subscribe).toHaveBeenCalledWith('task_updated', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('task_created', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('task_deleted', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('comment_added', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('comment_updated', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('comment_deleted', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('attachment_added', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('attachment_deleted', expect.any(Function));
    expect(websocketService.subscribe).toHaveBeenCalledWith('user_presence', expect.any(Function));
  });

  it('should update presence when updatePresence is called', async () => {
    const { result } = renderHook(() => useTaskRealtime(mockTaskId));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    act(() => {
      result.current.updatePresence('editing');
    });
    
    expect(websocketService.updatePresence).toHaveBeenCalledWith(mockTaskId, 'editing');
  });

  it('should handle connection error', async () => {
    const error = new Error('Connection failed');
    (websocketService.connect as jest.Mock).mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useTaskRealtime(mockTaskId));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe(error);
  });

  it('should not connect if user or token is missing', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, token: null });
    
    renderHook(() => useTaskRealtime(mockTaskId));
    
    expect(websocketService.connect).not.toHaveBeenCalled();
  });
});
