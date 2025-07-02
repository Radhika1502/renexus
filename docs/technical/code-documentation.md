# Renexus Code Documentation

## Project Structure Overview

The Renexus codebase follows a modular architecture with clear separation of concerns between frontend and backend components.

### Directory Structure

```
renexus/
├── src/                     # Source code
│   ├── api/                 # Backend API
│   │   ├── controllers/     # API controllers
│   │   ├── middlewares/     # API middlewares
│   │   ├── routes/          # Route definitions
│   │   ├── services/        # Business logic
│   │   └── validators/      # Input validation
│   ├── components/          # React components
│   │   ├── common/          # Reusable components
│   │   ├── layout/          # Layout components
│   │   └── features/        # Feature components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── utils/               # Utility functions
│   └── config/              # Configuration files
├── public/                  # Static assets
├── tests/                   # Test files
├── scripts/                 # Utility scripts
└── config/                  # Configuration files
```

## Core Components

### Backend Components

#### Authentication System

The authentication system uses JWT for secure token-based authentication:

```javascript
// auth.service.js
class AuthService {
  /**
   * Create JWT token for authenticated user
   * @param {Object} user - User object from database
   * @returns {String} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  /**
   * Verify user credentials and generate token
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Object} Authentication result with token and user info
   * @throws {Error} If credentials are invalid
   */
  async login(email, password) {
    // Implementation
  }
}
```

#### API Controllers

Controllers follow a consistent pattern for request handling:

```javascript
// project.controller.js
class ProjectController {
  /**
   * Create a new project
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware
   */
  async create(req, res, next) {
    try {
      const project = await projectService.create(req.body, req.user.id);
      return res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
}
```

#### Middleware Chain

Middleware functions are used for cross-cutting concerns:

```javascript
// auth.middleware.js
/**
 * Authenticate requests using JWT
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware
 */
const authenticate = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
```

### Frontend Components

#### React Component Structure

Components follow a consistent structure:

```jsx
// TaskCard.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Display a task card with actions
 * @param {Object} props - Component props
 * @param {Object} props.task - Task data
 * @param {Function} props.onStatusChange - Status change handler
 * @returns {JSX.Element} Rendered component
 */
const TaskCard = ({ task, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleStatusChange = (status) => {
    onStatusChange(task.id, status);
  };
  
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      {expanded && <p>{task.description}</p>}
      <div className="actions">
        <button onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
        <select 
          value={task.status} 
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
};

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default TaskCard;
```

#### Custom Hooks

Custom hooks encapsulate reusable logic:

```javascript
// useProjects.js
import { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * Hook for project data management
 * @param {Object} options - Hook options
 * @param {Boolean} options.includeArchived - Whether to include archived projects
 * @returns {Object} Projects data and management functions
 */
const useProjects = ({ includeArchived = false } = {}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects', {
        params: { includeArchived },
      });
      setProjects(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProjects();
  }, [includeArchived]);
  
  const createProject = async (projectData) => {
    // Implementation
  };
  
  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
  };
};

export default useProjects;
```

## Core Utilities

### API Client

A wrapper for API requests with authentication and error handling:

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || '/api',
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Error Handling

Consistent error handling across the application:

```javascript
// error-handler.js
/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware
 */
const errorHandler = (err, req, res, next) => {
  const logger = req.app.get('logger');
  
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Create response
  const response = {
    error: true,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  };
  
  // Add validation errors if available
  if (err.errors) {
    response.errors = err.errors;
  }
  
  // Add request ID for tracking
  response.requestId = req.id;
  
  return res.status(statusCode).json(response);
};

export default errorHandler;
```

## Database Models

### User Model

```javascript
// user.model.js
/**
 * User model with methods for authentication
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} email - User email
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} role - User role
 */
class User {
  /**
   * Validate user password
   * @param {string} password - Password to validate
   * @returns {boolean} Is password valid
   */
  async validatePassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }
  
  /**
   * Set user password (with hashing)
   * @param {string} password - Plain text password
   */
  async setPassword(password) {
    this.passwordHash = await bcrypt.hash(password, 10);
  }
  
  /**
   * Get user's full name
   * @returns {string} Full name
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

### Project Model

```javascript
// project.model.js
/**
 * Project model
 * @typedef {Object} Project
 * @property {string} id - Unique identifier
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {Date} startDate - Project start date
 * @property {Date} endDate - Project end date
 * @property {string} status - Project status
 */
class Project {
  /**
   * Check if project is active
   * @returns {boolean} Is project active
   */
  isActive() {
    return this.status === 'active';
  }
  
  /**
   * Check if project is overdue
   * @returns {boolean} Is project overdue
   */
  isOverdue() {
    return this.endDate < new Date() && this.status !== 'completed';
  }
  
  /**
   * Calculate project duration in days
   * @returns {number} Duration in days
   */
  getDuration() {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
```

## Best Practices

### Error Handling

- Always use try/catch blocks in async functions
- Use the global error handler for consistent responses
- Include appropriate status codes and error messages
- Log errors with context information

### Performance Optimization

- Use pagination for large data sets
- Implement caching for frequently accessed data
- Optimize database queries with proper indexing
- Use server-side filtering for large data sets

### Security Best Practices

- Sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Never expose sensitive data in responses or logs

### Testing Guidelines

- Write unit tests for all business logic
- Create integration tests for API endpoints
- Use snapshot tests for UI components
- Maintain at least 80% test coverage

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features appropriately
- Follow the AirBnB style guide
- Use meaningful variable and function names
- Add JSDoc comments for all functions

### React Components

- Keep components small and focused
- Use functional components with hooks
- Separate business logic from presentation
- Properly type all props with PropTypes or TypeScript
