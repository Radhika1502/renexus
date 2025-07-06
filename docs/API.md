# Renexus API Documentation

## Authentication

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string"
}
```

### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "refreshToken": "string"
}
```

## Tasks

### GET /api/tasks
Get a list of tasks.

**Query Parameters:**
- page (number, default: 1)
- pageSize (number, default: 20)
- status (string, optional)
- priority (string, optional)
- assigneeId (string, optional)
- projectId (string, optional)

**Response:**
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "priority": "string",
      "assigneeId": "string",
      "projectId": "string",
      "dueDate": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "tags": ["string"],
      "dependencies": ["string"],
      "parentId": "string",
      "progress": "number",
      "timeEstimate": "number",
      "timeSpent": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "totalPages": "number"
}
```

### GET /api/tasks/:taskId
Get a single task by ID.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "assigneeId": "string",
  "projectId": "string",
  "dueDate": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "tags": ["string"],
  "dependencies": ["string"],
  "parentId": "string",
  "progress": "number",
  "timeEstimate": "number",
  "timeSpent": "number"
}
```

### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "assigneeId": "string",
  "projectId": "string",
  "dueDate": "string",
  "tags": ["string"],
  "dependencies": ["string"],
  "parentId": "string",
  "timeEstimate": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "assigneeId": "string",
  "projectId": "string",
  "dueDate": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "tags": ["string"],
  "dependencies": ["string"],
  "parentId": "string",
  "progress": "number",
  "timeEstimate": "number",
  "timeSpent": "number"
}
```

### PATCH /api/tasks/:taskId
Update a task.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "assigneeId": "string",
  "dueDate": "string",
  "tags": ["string"],
  "dependencies": ["string"],
  "progress": "number",
  "timeSpent": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "assigneeId": "string",
  "projectId": "string",
  "dueDate": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "tags": ["string"],
  "dependencies": ["string"],
  "parentId": "string",
  "progress": "number",
  "timeEstimate": "number",
  "timeSpent": "number"
}
```

### DELETE /api/tasks/:taskId
Delete a task.

**Response:**
```
204 No Content
```

## Projects

### GET /api/projects
Get a list of projects.

**Query Parameters:**
- page (number, default: 1)
- pageSize (number, default: 20)
- status (string, optional)
- ownerId (string, optional)

**Response:**
```json
{
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "string",
      "startDate": "string",
      "endDate": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "ownerId": "string",
      "members": [
        {
          "userId": "string",
          "role": "string",
          "joinedAt": "string"
        }
      ],
      "tags": ["string"],
      "progress": "number",
      "budget": "number",
      "spentBudget": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "totalPages": "number"
}
```

### GET /api/projects/:projectId
Get a single project by ID.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "string",
  "startDate": "string",
  "endDate": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "ownerId": "string",
  "members": [
    {
      "userId": "string",
      "role": "string",
      "joinedAt": "string"
    }
  ],
  "tags": ["string"],
  "progress": "number",
  "budget": "number",
  "spentBudget": "number"
}
```

### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "status": "string",
  "startDate": "string",
  "endDate": "string",
  "tags": ["string"],
  "budget": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "string",
  "startDate": "string",
  "endDate": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "ownerId": "string",
  "members": [
    {
      "userId": "string",
      "role": "string",
      "joinedAt": "string"
    }
  ],
  "tags": ["string"],
  "progress": "number",
  "budget": "number",
  "spentBudget": "number"
}
```

### PATCH /api/projects/:projectId
Update a project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "status": "string",
  "startDate": "string",
  "endDate": "string",
  "tags": ["string"],
  "budget": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "string",
  "startDate": "string",
  "endDate": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "ownerId": "string",
  "members": [
    {
      "userId": "string",
      "role": "string",
      "joinedAt": "string"
    }
  ],
  "tags": ["string"],
  "progress": "number",
  "budget": "number",
  "spentBudget": "number"
}
```

### DELETE /api/projects/:projectId
Delete a project.

**Response:**
```
204 No Content
```

### POST /api/projects/:projectId/members
Add a member to a project.

**Request Body:**
```json
{
  "userId": "string",
  "role": "string"
}
```

**Response:**
```json
{
  "userId": "string",
  "role": "string",
  "joinedAt": "string"
}
```

### DELETE /api/projects/:projectId/members/:userId
Remove a member from a project.

**Response:**
```
204 No Content
```

## Notifications

### GET /api/notifications
Get user notifications.

**Query Parameters:**
- page (number, default: 1)
- pageSize (number, default: 20)
- read (boolean, optional)
- type (string[], optional)

**Response:**
```json
{
  "notifications": [
    {
      "id": "string",
      "userId": "string",
      "type": "string",
      "title": "string",
      "message": "string",
      "read": "boolean",
      "data": "object",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number",
  "totalPages": "number"
}
```

### PATCH /api/notifications/:notificationId/read
Mark a notification as read.

**Response:**
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "read": true,
  "data": "object",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### PATCH /api/notifications/read-all
Mark all notifications as read.

**Response:**
```
204 No Content
```

### DELETE /api/notifications/:notificationId
Delete a notification.

**Response:**
```
204 No Content
```

## WebSocket Events

### Authentication
```json
{
  "type": "authenticate",
  "payload": {
    "token": "string"
  }
}
```

### Task Updates
```json
{
  "type": "task_update",
  "payload": {
    "taskId": "string",
    "update": "object"
  }
}
```

### Project Updates
```json
{
  "type": "project_update",
  "payload": {
    "projectId": "string",
    "update": "object"
  }
}
```

### User Presence
```json
{
  "type": "presence",
  "payload": {
    "projectId": "string",
    "userId": "string",
    "status": "string"
  }
}
```

### Collaborative Editing
```json
{
  "type": "collaborative_edit",
  "payload": {
    "taskId": "string",
    "userId": "string",
    "change": "object"
  }
}
``` 