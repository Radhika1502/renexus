# Renexus Developer Onboarding Guide

## Introduction

Welcome to the Renexus development team! This guide will help you get up to speed with our codebase, development practices, and technologies. By the end of this onboarding process, you should be comfortable navigating the codebase and making contributions.

## Getting Started

### System Requirements

- Node.js v18 or higher
- npm v8 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- Git

### Development Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/renexus/renexus.git
   cd renexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp config/environments/development.env.example config/environments/development.env
   ```
   Edit the `.env` file to add your local database credentials and other required settings.

4. **Database setup**
   ```bash
   npm run db:create
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000

## Project Architecture

### Overview

Renexus follows a modern JavaScript/TypeScript stack with separation of concerns:

- **Frontend**: React with Next.js for server-side rendering
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Redux with Redux Toolkit
- **Testing**: Jest, React Testing Library, and Cypress

### Directory Structure

```
renexus/
├── .github/                 # GitHub configurations and workflows
├── config/                  # Application configurations
├── docs/                    # Documentation
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── src/                     # Source code
│   ├── api/                 # Backend API code
│   │   ├── controllers/     # API controllers
│   │   ├── middlewares/     # API middlewares
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Next.js pages
│   ├── store/               # Redux store configuration
│   ├── styles/              # CSS/SCSS styles
│   └── utils/               # Utility functions
└── tests/                   # Test files
```

## Core Technologies and Libraries

### Frontend

- **React**: UI library
- **Next.js**: React framework for SSR/SSG
- **Redux**: State management
- **Tailwind CSS**: Utility-first CSS framework
- **SWR**: Data fetching and caching
- **React Hook Form**: Form validation

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Prisma**: ORM for database access
- **JWT**: Authentication
- **Winston**: Logging
- **Joi**: Request validation

### DevOps and Infrastructure

- **GitHub Actions**: CI/CD pipeline
- **Docker**: Containerization
- **Prometheus/Grafana**: Monitoring
- **HAProxy**: Load balancing

## Development Workflow

### Git Workflow

We follow a GitHub Flow-based workflow:

1. Create a feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit regularly
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

3. Push your branch and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

4. After review and approval, your PR will be merged

### Code Style and Standards

We use ESLint and Prettier to enforce code style. Run linting with:
```bash
npm run lint
```

Format your code with:
```bash
npm run format
```

Key principles:
- Follow TypeScript best practices
- Write meaningful comments for complex logic
- Create comprehensive tests
- Follow the component structure guidelines

### Testing Practices

1. **Unit Tests**: For individual functions and components
   ```bash
   npm run test:unit
   ```

2. **Integration Tests**: For testing component interactions
   ```bash
   npm run test:integration
   ```

3. **End-to-End Tests**: For testing complete user flows
   ```bash
   npm run test:e2e
   ```

Aim for at least 80% test coverage for new code.

## Key Features and Implementation Details

### Authentication

Authentication is JWT-based with refresh tokens:

- `src/api/services/auth.service.js` - Core authentication logic
- `src/api/middlewares/auth.middleware.js` - Authentication middleware
- `src/contexts/AuthContext.tsx` - Frontend authentication state

### Project Management

Project CRUD operations and business logic:

- `src/api/controllers/project.controller.js` - API endpoints
- `src/api/services/project.service.js` - Business logic
- `src/components/projects/*` - UI components

### Task Management

Task CRUD and workflow:

- `src/api/controllers/task.controller.js` - API endpoints
- `src/api/services/task.service.js` - Business logic
- `src/components/tasks/*` - UI components

### Real-time Features

WebSocket implementation for real-time updates:

- `src/api/services/socket.service.js` - Server-side socket handling
- `src/hooks/useSocket.ts` - Client-side socket hook
- `src/contexts/SocketContext.tsx` - Socket context provider

## Deployment and Operations

### Development Deployment

Development builds are automatically deployed to the dev environment when changes are merged to the `develop` branch.

### Staging Deployment

Staging deployments happen when a release branch is created:
```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.x.x
git push origin release/v1.x.x
```

### Production Deployment

Production deployment occurs when a release is merged to `main`:
```bash
git checkout main
git pull origin main
git merge release/v1.x.x
git push origin main
```

## Common Issues and Solutions

### Database Connection Issues

If you encounter database connection issues:

1. Check that PostgreSQL is running
2. Verify connection details in your `.env` file
3. Ensure IP/hostname is accessible

### Frontend Build Errors

Common solutions for build errors:

1. Clear the `.next` directory
   ```bash
   rm -rf .next
   ```

2. Reinstall dependencies
   ```bash
   npm ci
   ```

### API Response Errors

Debug API issues with:

1. Check server logs
   ```bash
   tail -f logs/api.log
   ```

2. Use the debug endpoint
   ```
   GET /api/debug/status
   ```

## Additional Resources

### Internal Documentation

- Architecture Documentation: `docs/technical/architecture.md`
- API Documentation: `docs/technical/api-documentation.md`
- Database Schema: `docs/technical/database-schema.md`

### External Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)

## Getting Help

If you need assistance:

1. Check the existing documentation
2. Ask in the #dev-help Slack channel
3. Reach out to your onboarding buddy
4. Join our weekly developer office hours (Tuesdays at 11 AM EST)
