# Renexus Monorepo Structure

This document outlines the monorepo architecture for the Renexus project, including directory structure, package organization, and migration plan.

## Overview

The Renexus project has been restructured as a monorepo to improve code organization, eliminate duplicate directories, and establish clear boundaries between different parts of the application. This approach provides several benefits:

- **Centralized code management**: All code is in one repository, making it easier to manage dependencies and share code
- **Clear separation of concerns**: Each package has a well-defined responsibility
- **Simplified dependency management**: Packages can depend on each other without publishing to a registry
- **Consistent tooling**: Shared configuration for linting, testing, and building
- **Atomic commits**: Changes across multiple packages can be committed together

## Directory Structure

```
renexus/
├── apps/                  # Application code
│   ├── backend/           # Backend services
│   │   ├── api/           # Main API service
│   │   ├── auth/          # Authentication service
│   │   ├── notifications/ # Notification service
│   │   └── tasks/         # Task management service
│   └── frontend/          # Frontend applications
│       └── web/           # Web application
├── packages/              # Shared packages
│   ├── database/          # Database models and migrations
│   ├── shared/            # Shared utilities and types
│   │   ├── api-client/    # API client for frontend
│   │   ├── config/        # Shared configuration
│   │   ├── types/         # Shared TypeScript types
│   │   └── utils/         # Shared utility functions
│   └── ui/                # Shared UI components
├── tools/                 # Development and build tools
├── docs/                  # Documentation
└── .github/               # GitHub workflows and templates
```

## Package Organization

### Apps

The `apps` directory contains the actual applications that are deployed. Each application is a standalone package with its own dependencies, build process, and deployment configuration.

#### Backend Services

Backend services are organized as microservices, each with its own responsibility:

- **api**: Main API service that handles core business logic
- **auth**: Authentication and authorization service
- **notifications**: Service for sending and managing notifications
- **tasks**: Task management service

Each backend service follows this structure:

```
service-name/
├── src/                # Source code
│   ├── controllers/    # Request handlers
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── index.ts        # Entry point
├── tests/              # Tests
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

#### Frontend Applications

Frontend applications are organized by platform:

- **web**: Web application built with React and Next.js

The web application follows this structure:

```
web/
├── public/             # Static assets
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── common/     # Common components
│   │   └── layout/     # Layout components
│   ├── features/       # Feature-specific code
│   │   ├── auth/       # Authentication feature
│   │   ├── dashboard/  # Dashboard feature
│   │   └── tasks/      # Task management feature
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   │   ├── api/        # API client
│   │   ├── offline/    # Offline support
│   │   └── tasks/      # Task-specific services
│   ├── styles/         # Global styles
│   └── utils/          # Utility functions
├── pages/              # Next.js pages
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

### Packages

The `packages` directory contains shared code that is used by multiple applications. Each package is a standalone npm package with its own dependencies and build process.

#### Database

The `database` package contains database models, migrations, and utilities for interacting with the database.

```
database/
├── src/
│   ├── models/         # Data models
│   ├── migrations/     # Database migrations
│   ├── seeds/          # Seed data
│   └── index.ts        # Entry point
├── package.json
└── tsconfig.json
```

#### Shared

The `shared` package contains utilities and types that are used by both backend and frontend applications.

```
shared/
├── api-client/         # API client for frontend
├── config/             # Shared configuration
├── types/              # Shared TypeScript types
├── utils/              # Shared utility functions
├── package.json
└── tsconfig.json
```

#### UI

The `ui` package contains shared UI components that are used by frontend applications.

```
ui/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # UI-related hooks
│   ├── theme/          # Theme configuration
│   └── index.ts        # Entry point
├── package.json
└── tsconfig.json
```

## Workspace Configuration

The monorepo uses npm workspaces to manage dependencies between packages. The root `package.json` file includes:

```json
{
  "name": "renexus",
  "private": true,
  "workspaces": [
    "apps/*",
    "apps/backend/*",
    "apps/frontend/*",
    "packages/*",
    "packages/shared/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

## TypeScript Configuration

The monorepo uses TypeScript path aliases to simplify imports between packages. The root `tsconfig.json` file includes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@apps/backend/*": ["apps/backend/*/src"],
      "@apps/frontend/*": ["apps/frontend/*/src"],
      "@packages/*": ["packages/*"]
    }
  }
}
```

## Migration Plan

The migration from the previous directory structure to the monorepo structure involved the following steps:

1. **Analysis**: Analyze the existing codebase to identify components, dependencies, and shared code
2. **Design**: Design the new monorepo structure based on the analysis
3. **Creation**: Create the new directory structure and package configuration
4. **Migration**: Move files from the old structure to the new structure
5. **Update**: Update import paths to reflect the new structure
6. **Testing**: Test the migrated code to ensure it works correctly
7. **Documentation**: Document the new structure and migration process

## Migration Tools

The migration was performed using a combination of automated scripts and manual processes:

- **Automated script**: A Node.js script was created to automate the creation of directories, migration of files, and updating of import paths
- **Manual migration**: Some files required manual migration due to complex dependencies or special handling
- **PowerShell script**: A PowerShell script was created to handle file copying on Windows systems

## Best Practices

When working with the monorepo, follow these best practices:

1. **Package boundaries**: Respect package boundaries and avoid importing across package boundaries except through public APIs
2. **Dependency management**: Use workspace dependencies for internal packages (e.g., `"@packages/shared": "workspace:*"`)
3. **Path aliases**: Use TypeScript path aliases for imports (e.g., `import { Button } from '@packages/ui'`)
4. **Feature organization**: Organize frontend code by feature rather than by type
5. **Documentation**: Document package APIs and update this document when making structural changes
6. **Testing**: Write tests for shared packages to ensure they work correctly across applications

## Future Enhancements

Future enhancements to the monorepo structure may include:

1. **Build system**: Implement a more sophisticated build system with dependency tracking
2. **Versioning**: Implement versioning for shared packages
3. **Documentation**: Generate API documentation from code comments
4. **CI/CD**: Set up continuous integration and deployment for each application
5. **Monorepo tools**: Explore tools like Nx or Turborepo for advanced monorepo management
