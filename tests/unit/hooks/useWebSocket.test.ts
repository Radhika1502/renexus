import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../../frontend/web/src/hooks/useWebSocket';
import WS from 'jest-websocket-mock';

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
    const onConnect = jest.fn();
    const { result } = renderHook(() => useWebSocket({
      url: TEST_URL,
      onConnect
    }));

    await server.connected;
    expect(result.current.isConnected).toBe(true);
    expect(onConnect).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useWebSocket({
      url: 'ws://invalid-url',
      onError
    }));

    expect(result.current.error).toBeTruthy();
    expect(onError).toHaveBeenCalled();
  });

  it('should send and receive messages', async () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() => useWebSocket({
      url: TEST_URL,
      onMessage
    }));

    await server.connected;

    const testMessage = { type: 'TEST', payload: { data: 'test' } };
    
    act(() => {
      result.current.sendMessage(testMessage);
    });

    await expect(server).toReceiveMessage(JSON.stringify(testMessage));
    
    server.send(JSON.stringify({ type: 'RESPONSE', payload: { data: 'response' } }));
    expect(onMessage).toHaveBeenCalledWith({ type: 'RESPONSE', payload: { data: 'response' } });
  });

  it('should attempt reconnection on disconnect', async () => {
    const onDisconnect = jest.fn();
    const onConnect = jest.fn();
    
    renderHook(() => useWebSocket({
      url: TEST_URL,
      onDisconnect,
      onConnect,
      reconnectInterval: 100,
      maxReconnectAttempts: 1
    }));

    await server.connected;
    server.close();
    expect(onDisconnect).toHaveBeenCalled();

    // Wait for reconnect attempt
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(onConnect).toHaveBeenCalledTimes(2);
  });

  it('should handle message parsing errors', async () => {
    const onMessage = jest.fn();
    renderHook(() => useWebSocket({
      url: TEST_URL,
      onMessage
    }));

    await server.connected;
    server.send('invalid json');
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() => useWebSocket({
      url: TEST_URL
    }));

    await server.connected;
    unmount();
    expect(server.clients().length).toBe(0);
  });
}); 