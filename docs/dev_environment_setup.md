# Development Environment Setup

## Overview

This document provides instructions for setting up the development environment for the Renexus project.

## Prerequisites

- Node.js (v18 or higher)
- npm (v10 or higher)
- Git
- Visual Studio Code (recommended)
- Docker (optional, for containerized development)

## Initial Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd renexus
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your local configuration.

## Project Structure

The project follows a monorepo structure using npm workspaces:

```
renexus/
├── apps/
│   ├── web-client/       # Main web application
│   ├── mobile-app/       # Mobile application
│   └── admin-portal/     # Admin dashboard
├── packages/
│   ├── core/             # Core business logic
│   ├── ui-components/    # Shared UI component library
│   ├── api-types/        # Shared API types and interfaces
│   └── utils/            # Shared utilities
├── services/
│   ├── api-gateway/      # API Gateway service
│   ├── auth-service/     # Authentication service
│   ├── project-service/  # Project management service
│   ├── task-service/     # Task management service
│   ├── ai-service/       # AI capabilities service
│   ├── notification-service/ # Notification service
│   └── analytics-service/    # Analytics service
```

## Development Workflow

### Starting the Development Server

To start all services in development mode:

```bash
npm run dev
```

To start a specific app or service:

```bash
cd apps/web-client
npm run dev
```

### Building the Project

To build all packages and apps:

```bash
npm run build
```

To build a specific app or package:

```bash
cd apps/web-client
npm run build
```

### Running Tests

To run all tests:

```bash
npm run test
```

To run tests for a specific package:

```bash
cd packages/ui-components
npm run test
```

### Linting and Formatting

To lint all code:

```bash
npm run lint
```

To format all code:

```bash
npm run format
```

## Database Setup

### Local Development

1. Install PostgreSQL locally or use Docker:

```bash
docker run --name renexus-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

2. Create the database:

```bash
docker exec -it renexus-postgres createdb -U postgres renexus
```

3. Run migrations:

```bash
cd services/auth-service
npm run migrate
```

## Authentication Setup

For local development, the authentication service uses Passport.js with the following strategies:

- Local authentication (username/password)
- Google OAuth (optional)
- GitHub OAuth (optional)

To set up OAuth providers:

1. Create OAuth applications in Google and GitHub developer consoles
2. Add the client IDs and secrets to your `.env` file

## AI Services Setup

To use AI features locally:

1. Obtain API keys from Anthropic and OpenAI
2. Add the API keys to your `.env` file

## Docker Development Environment

For a containerized development environment:

1. Build the Docker images:

```bash
docker-compose build
```

2. Start the services:

```bash
docker-compose up
```

## IDE Setup

### Visual Studio Code

1. Install recommended extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

2. Use the provided workspace settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Troubleshooting

### Common Issues

1. **Node version mismatch**:
   - Use nvm to switch to the correct Node.js version

2. **Package installation errors**:
   - Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

3. **Port conflicts**:
   - Check if another process is using the required ports
   - Modify the port in the `.env` file

### Getting Help

If you encounter issues:

1. Check the project documentation in the `docs` directory
2. Review existing GitHub issues
3. Contact the development team

## Continuous Integration

The project uses GitHub Actions for CI/CD:

- Pull requests trigger linting, testing, and building
- Merges to main trigger deployment to staging
- Tags trigger deployment to production

## Next Steps

After setting up your development environment:

1. Review the architecture documentation
2. Explore the codebase
3. Pick up a task from the project board
4. Create a feature branch and start developing
