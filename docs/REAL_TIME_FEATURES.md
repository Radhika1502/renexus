# Real-time Features in Renexus

This document outlines the implementation of real-time features in the Renexus application, including WebSocket integration, presence indicators, and live updates.

## Architecture

### Backend (WebSocket Server)
- **WebSocketServer**: Manages WebSocket connections, handles message routing, and maintains room subscriptions.
- **Message Types**: Defines the structure of messages exchanged between client and server.
- **Rooms**: Virtual spaces for broadcasting messages to specific groups of clients (e.g., task rooms, project rooms).

### Frontend (WebSocket Client)
- **useWebSocket Hook**: Manages WebSocket connection, message handling, and reconnection logic.
- **WebSocketContext**: Provides WebSocket functionality throughout the React component tree.
- **Real-time Components**: Components that use WebSocket for live updates (e.g., TaskDetails, TaskComments).

## Message Types

### Client to Server
- `AUTHENTICATE`: Authenticate the WebSocket connection with a user token.
- `JOIN_ROOM`: Subscribe to updates for a specific room (e.g., task or project).
- `LEAVE_ROOM`: Unsubscribe from a room.
- `TASK_UPDATE`: Update task properties (status, assignee, etc.).
- `COMMENT_ADD`: Add a new comment to a task.
- `PRESENCE_UPDATE`: Update user presence (online/offline, typing status).

### Server to Client
- `TASK_UPDATED`: Notify clients about task updates.
- `COMMENT_ADDED`: Notify clients about new comments.
- `USER_PRESENCE`: Update user presence information.
- `ERROR`: Notify clients about errors.

## Implementation Details

### Backend Implementation
```typescript
// WebSocket server setup
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws, req) => {
  // Handle new connection
});

// Message handling
ws.on('message', (data) => {
  const message = JSON.parse(data);
  // Route message based on type
});
```

### Frontend Implementation
```typescript
// Using the WebSocket hook
const { sendMessage, subscribe } = useWebSocketContext();

// Subscribe to task updates
useEffect(() => {
  const unsubscribe = subscribe('TASK_UPDATED', (update) => {
    // Handle task update
  });
  
  return () => unsubscribe();
}, [subscribe]);

// Send a task update
const updateTaskStatus = (taskId, newStatus) => {
  sendMessage('TASK_UPDATE', {
    taskId,
    type: 'STATUS_CHANGE',
    changes: { status: newStatus },
  });
};
```

## Security Considerations

1. **Authentication**: All WebSocket connections must be authenticated.
2. **Authorization**: Verify users have permission to access resources.
3. **Rate Limiting**: Implement rate limiting to prevent abuse.
4. **Input Validation**: Validate all incoming messages.
5. **Secure Connections**: Use WSS (WebSocket Secure) in production.

## Performance Considerations

1. **Connection Management**: Implement connection pooling and reconnection strategies.
2. **Message Batching**: Batch multiple updates to reduce WebSocket traffic.
3. **Throttling**: Throttle frequent updates (e.g., typing indicators).
4. **Payload Size**: Keep message payloads small and efficient.

## Testing

1. **Unit Tests**: Test individual WebSocket handlers and utilities.
2. **Integration Tests**: Test WebSocket server with a mock client.
3. **End-to-End Tests**: Test real-time features in the application.

## Deployment

1. **WebSocket Server**: Deploy with the API server or as a separate service.
2. **Load Balancing**: Configure WebSocket support in your load balancer.
3. **Scaling**: Consider horizontal scaling with a message broker (e.g., Redis).

## Monitoring and Debugging

1. **Logging**: Log WebSocket connections, disconnections, and errors.
2. **Metrics**: Track connection counts, message rates, and errors.
3. **Debugging**: Use browser developer tools and WebSocket inspectors.

## Future Enhancements

1. **Offline Support**: Queue messages when offline and sync when reconnected.
2. **Conflict Resolution**: Implement conflict resolution for concurrent edits.
3. **Presence**: Show detailed presence information (e.g., "User is typing").
4. **Push Notifications**: Integrate with push notifications for important updates.
