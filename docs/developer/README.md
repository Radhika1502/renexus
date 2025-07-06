# Renexus Developer Documentation

## Overview

Renexus is a modern task management system built with TypeScript, React, and Node.js. This documentation will help you set up your development environment and understand the codebase.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [Architecture](#architecture)
5. [Testing](#testing)
6. [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 10.0.0
- PostgreSQL >= 14
- Redis >= 6.2

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-org/renexus.git
cd renexus
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development servers:
```bash
npm run dev
```

## Project Structure

```
renexus/
├── apps/                    # Application packages
│   ├── web/                # Frontend React application
│   └── api/                # Backend API server
├── packages/               # Shared packages
│   ├── database/          # Database utilities
│   ├── shared/            # Shared utilities
│   └── types/             # TypeScript types
├── docs/                  # Documentation
└── scripts/               # Development scripts
```

## Development Setup

### Database Setup

1. Create development database:
```bash
npm run migrate
npm run seed
```

2. Run database tests:
```bash
npm run test:db
```

### Frontend Development

1. Start frontend development server:
```bash
cd apps/web
npm run dev
```

2. Run frontend tests:
```bash
npm run test
npm run test:e2e
```

### Backend Development

1. Start backend development server:
```bash
cd apps/api
npm run dev
```

2. Run backend tests:
```bash
npm run test
npm run test:integration
```

## Architecture

### Frontend Architecture

- React with TypeScript
- Zustand for state management
- React Query for data fetching
- Tailwind CSS for styling
- WebSocket for real-time updates

### Backend Architecture

- Node.js with Express
- Prisma for database access
- Redis for caching
- JWT for authentication
- WebSocket for real-time communication

## Testing

### Test Types

1. Unit Tests
   - Jest for testing
   - React Testing Library for components
   - Coverage threshold: 80%

2. Integration Tests
   - API endpoint testing
   - Database operations testing
   - WebSocket communication testing

3. Performance Tests
   - Load testing with autocannon
   - Response time benchmarks
   - Resource utilization testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:perf

# Generate coverage report
npm run coverage
```

## Contributing

### Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following our coding standards

3. Write tests for your changes

4. Run the test suite:
```bash
npm run test
```

5. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Include tests with new features
- Update documentation as needed

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation with details of changes
3. The PR must pass all CI checks
4. Get review from at least one team member
5. Squash commits before merging

### Debugging

1. Frontend Debugging
   - Use React Developer Tools
   - Check browser console for errors
   - Use performance profiler

2. Backend Debugging
   - Use logging with Winston
   - Check API response codes
   - Monitor database queries

## Need Help?

- Check our [FAQ](./FAQ.md)
- Join our Discord channel
- Contact the development team 