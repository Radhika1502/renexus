import { renderHook, act } from '@testing-library/react';
import { usePresence } from '../../../frontend/web/src/hooks/usePresence';
import WS from 'jest-websocket-mock';

jest.mock('../../../frontend/web/src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    sendMessage: jest.fn()
  })
}));

describe('usePresence', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User'
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name
    }));

    expect(result.current.userStatus).toBe('online');
    expect(result.current.onlineUsers).toEqual([]);
  });

  it('should update user status to away after inactivity', () => {
    const { result } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name,
      inactivityTimeout: 1000
    }));

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    expect(result.current.userStatus).toBe('away');
  });

  it('should handle user activity events', () => {
    const { result } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name
    }));

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'));
    });

    expect(result.current.userStatus).toBe('online');
  });

  it('should update presence when visibility changes', () => {
    const { result } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name
    }));

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.userStatus).toBe('away');

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.userStatus).toBe('online');
  });

  it('should update online users list when receiving presence updates', () => {
    const { result } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name
    }));

    const otherUser = {
      id: 'user2',
      name: 'Other User',
      status: 'online',
      lastActivity: new Date().toISOString()
    };

    act(() => {
      result.current.updatePresence('online');
    });

    expect(result.current.onlineUsers).toContainEqual(expect.objectContaining({
      id: mockUser.id,
      name: mockUser.name,
      status: 'online'
    }));
  });

  it('should remove users when they go offline', () => {
    const { result } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name
    }));

    const otherUser = {
      id: 'user2',
      name: 'Other User',
      status: 'offline',
      lastActivity: new Date().toISOString()
    };

    act(() => {
      // First add the user
      result.current.updatePresence('online');
    });

    act(() => {
      // Then mark them as offline
      result.current.updatePresence('offline');
    });

    expect(result.current.onlineUsers).not.toContainEqual(expect.objectContaining({
      id: mockUser.id
    }));
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => usePresence({
      userId: mockUser.id,
      userName: mockUser.name
    }));

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
  });
}); 