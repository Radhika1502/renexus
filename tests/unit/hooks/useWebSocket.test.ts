import { describe, expect, jest, it } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';
import WS from 'jest-websocket-mock';
import { useWebSocket } from '@packages/ui/hooks/useWebSocket';

describe('useWebSocket', () => {
  let server: WS;
  const TEST_URL = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(TEST_URL);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should connect to WebSocket server', async () => {
    const { result } = renderHook(() => useWebSocket(TEST_URL));

    await server.connected;
    expect(result.current.isConnected).toBe(true);
  });

  it('should send messages', async () => {
    const { result } = renderHook(() => useWebSocket(TEST_URL));

    await server.connected;

    act(() => {
      result.current.send('test message');
    });

    await expect(server).toReceiveMessage('test message');
  });

  it('should receive messages', async () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() => useWebSocket(TEST_URL, { onMessage }));

    await server.connected;
    server.send('server message');

    expect(onMessage).toHaveBeenCalledWith('server message');
  });

  it('should handle connection errors', async () => {
    const onError = jest.fn();
    renderHook(() => useWebSocket('ws://invalid-url', { onError }));

    // Wait for potential error
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(onError).toHaveBeenCalled();
  });

  it('should handle reconnection', async () => {
    const { result } = renderHook(() => useWebSocket(TEST_URL, { reconnect: true }));

    await server.connected;
    server.close();

    // Wait for reconnection attempt
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(result.current.isConnected).toBe(false);
    
    // Create new server to simulate successful reconnection
    server = new WS(TEST_URL);
    await server.connected;

    expect(result.current.isConnected).toBe(true);
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() => useWebSocket(TEST_URL));

    await server.connected;
    unmount();

    expect(server.clients().length).toBe(0);
  });
}); 