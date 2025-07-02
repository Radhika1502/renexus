# Renexus API Documentation

## API Overview

The Renexus API is a RESTful service that provides access to all features and functionalities of the Renexus platform. This document outlines the available endpoints, request formats, response structures, and authentication mechanisms.

## Base URL

- Development: `http://localhost:3000/api`
- Staging: `https://api-staging.renexus.io/api`
- Production: `https://api.renexus.io/api`

## Authentication

### Authentication Methods

The API uses JWT (JSON Web Token) based authentication. All authenticated endpoints require a valid JWT token in the Authorization header.

#### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### Using a Token

Include the token in the Authorization header:

```http
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Refreshing a Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## API Endpoints

### User Management

#### Get Current User

```http
GET /users/me
Authorization: Bearer {token}
```

Response:

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Get User by ID

```http
GET /users/{id}
Authorization: Bearer {token}
```

Response: Same as Get Current User

#### List Users

```http
GET /users?limit=10&offset=0&search=john
Authorization: Bearer {token}
```

Response:

```json
{
  "total": 100,
  "limit": 10,
  "offset": 0,
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More users...
  ]
}
```

#### Create User

```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "securePassword123",
  "role": "user"
}
```

Response:

```json
{
  "id": "new-user-uuid",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "user",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### Update User

```http
PUT /users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "admin"
}
```

Response: Updated user object

#### Delete User

```http
DELETE /users/{id}
Authorization: Bearer {token}
```

Response:

```json
{
  "message": "User deleted successfully"
}
```

### Project Management

#### Get Project

```http
GET /projects/{id}
Authorization: Bearer {token}
```

Response:

```json
{
  "id": "project-uuid",
  "name": "Project Name",
  "description": "Project description",
  "status": "active",
  "startDate": "2023-01-01T00:00:00.000Z",
  "endDate": "2023-12-31T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "owner": {
    "id": "user-uuid",
    "email": "owner@example.com",
    "firstName": "Project",
    "lastName": "Owner"
  },
  "members": [
    {
      "id": "user-uuid",
      "email": "member@example.com",
      "firstName": "Team",
      "lastName": "Member",
      "role": "editor"
    }
  ]
}
```

#### List Projects

```http
GET /projects?limit=10&offset=0&status=active
Authorization: Bearer {token}
```

Response:

```json
{
  "total": 50,
  "limit": 10,
  "offset": 0,
  "data": [
    // Project objects...
  ]
}
```

#### Create Project

```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "status": "active",
  "startDate": "2023-01-01T00:00:00.000Z",
  "endDate": "2023-12-31T00:00:00.000Z"
}
```

Response: Created project object

#### Update Project

```http
PUT /projects/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "status": "completed"
}
```

Response: Updated project object

#### Delete Project

```http
DELETE /projects/{id}
Authorization: Bearer {token}
```

Response:

```json
{
  "message": "Project deleted successfully"
}
```

### Task Management

#### Get Task

```http
GET /tasks/{id}
Authorization: Bearer {token}
```

Response:

```json
{
  "id": "task-uuid",
  "title": "Task Title",
  "description": "Task description",
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2023-06-30T00:00:00.000Z",
  "projectId": "project-uuid",
  "assigneeId": "user-uuid",
  "createdBy": "user-uuid",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### List Tasks

```http
GET /tasks?projectId=project-uuid&status=in_progress&limit=10&offset=0
Authorization: Bearer {token}
```

Response:

```json
{
  "total": 30,
  "limit": 10,
  "offset": 0,
  "data": [
    // Task objects...
  ]
}
```

#### Create Task

```http
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2023-06-30T00:00:00.000Z",
  "projectId": "project-uuid",
  "assigneeId": "user-uuid"
}
```

Response: Created task object

#### Update Task

```http
PUT /tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "completedAt": "2023-06-25T00:00:00.000Z"
}
```

Response: Updated task object

#### Delete Task

```http
DELETE /tasks/{id}
Authorization: Bearer {token}
```

Response:

```json
{
  "message": "Task deleted successfully"
}
```

### Analytics

#### Get Project Analytics

```http
GET /analytics/projects/{id}?startDate=2023-01-01&endDate=2023-06-30
Authorization: Bearer {token}
```

Response:

```json
{
  "projectId": "project-uuid",
  "tasksByStatus": {
    "todo": 5,
    "in_progress": 10,
    "review": 3,
    "completed": 20
  },
  "tasksByPriority": {
    "low": 8,
    "medium": 15,
    "high": 10,
    "critical": 5
  },
  "completionRate": 0.75,
  "averageCompletionTime": 86400000,
  "teamPerformance": [
    {
      "userId": "user-uuid",
      "name": "John Doe",
      "tasksCompleted": 12,
      "averageCompletionTime": 76400000
    }
  ]
}
```

#### Get User Analytics

```http
GET /analytics/users/{id}?startDate=2023-01-01&endDate=2023-06-30
Authorization: Bearer {token}
```

Response:

```json
{
  "userId": "user-uuid",
  "tasksByStatus": {
    "todo": 2,
    "in_progress": 3,
    "review": 1,
    "completed": 15
  },
  "tasksByPriority": {
    "low": 5,
    "medium": 10,
    "high": 5,
    "critical": 1
  },
  "completionRate": 0.85,
  "averageCompletionTime": 76400000,
  "projectContributions": [
    {
      "projectId": "project-uuid",
      "name": "Project Name",
      "tasksCompleted": 8,
      "averageCompletionTime": 66400000
    }
  ]
}
```

## Error Handling

All API errors follow a standard format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional information
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Authentication token is missing or invalid
- `FORBIDDEN`: User does not have permission to access the resource
- `VALIDATION_ERROR`: Request data validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists or another conflict
- `INTERNAL_SERVER_ERROR`: Server encountered an unexpected error

### HTTP Status Codes

- 200 OK: Request succeeded
- 201 Created: Resource created
- 400 Bad Request: Invalid request parameters
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 409 Conflict: Resource conflict
- 500 Internal Server Error: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per user

When a rate limit is exceeded, the API returns:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 35 seconds.",
    "details": {
      "retryAfter": 35
    }
  }
}
```

## Pagination

List endpoints support pagination using `limit` and `offset` query parameters:

- `limit`: Number of items to return (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

The response includes pagination metadata:

```json
{
  "total": 100,  // Total number of items
  "limit": 20,   // Current limit
  "offset": 20,  // Current offset
  "data": []     // Result data
}
```

## Sorting and Filtering

List endpoints support sorting and filtering using query parameters:

- Sorting: `sort=fieldName:asc` or `sort=fieldName:desc`
- Filtering: Field names as query parameters, e.g., `status=active&priority=high`

Multiple sorting fields are supported:
```
GET /tasks?sort=priority:desc,createdAt:asc
```

## Versioning

The API uses versioning to ensure backward compatibility. The current version is v1, specified in the URL:

```
https://api.renexus.io/api/v1/users
```

## API Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2023-06-29T15:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```
