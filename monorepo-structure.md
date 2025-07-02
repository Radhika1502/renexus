# Renexus Monorepo Structure

This document outlines the new monorepo structure for the Renexus project.

## Root Structure

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
│   ├── scripts/           # Build and deployment scripts
│   └── config/            # Configuration for tools
├── docs/                  # Documentation
└── .github/               # GitHub workflows and templates
```

## Backend Structure

Each backend service follows a consistent structure:

```
backend/<service-name>/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   ├── middleware/        # Middleware functions
│   ├── utils/             # Utility functions
│   ├── config/            # Service-specific configuration
│   └── index.ts           # Entry point
├── tests/                 # Tests for this service
├── package.json           # Dependencies for this service
└── tsconfig.json          # TypeScript configuration
```

## Frontend Structure

The frontend follows a feature-based organization:

```
frontend/web/
├── src/
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication feature
│   │   ├── dashboard/     # Dashboard feature
│   │   ├── tasks/         # Task management feature
│   │   └── analytics/     # Analytics feature
│   ├── components/        # Shared components
│   │   ├── common/        # Common UI components
│   │   ├── layout/        # Layout components
│   │   └── forms/         # Form components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Service integrations
│   │   ├── api/           # API service wrappers
│   │   └── offline/       # Offline support services
│   ├── utils/             # Utility functions
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── index.tsx          # Entry point
├── public/                # Static assets
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Shared Packages

Shared packages are organized by domain:

```
packages/
├── database/              # Database package
│   ├── src/
│   │   ├── models/        # Prisma models
│   │   ├── migrations/    # Database migrations
│   │   └── index.ts       # Entry point
│   └── package.json       # Dependencies
├── shared/                # Shared utilities and types
│   ├── api-client/        # API client for frontend
│   ├── config/            # Shared configuration
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utility functions
└── ui/                    # Shared UI components
    ├── src/
    │   ├── components/    # UI components
    │   ├── hooks/         # UI-related hooks
    │   └── index.ts       # Entry point
    └── package.json       # Dependencies
```

## Migration Plan

1. Create the new directory structure
2. Move files to their new locations
3. Update import paths
4. Test the application to ensure everything works
5. Remove old directories once migration is complete
