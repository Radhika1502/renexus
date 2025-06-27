# Renexus

Renexus is a unified project and task management platform that combines the UI components from Renexus_Replit with the feature sets from project-bolt. The platform features AI-powered workflow automation, task analytics, and team performance metrics to optimize project management.

## Backend Implementation Status

**Phase 1: 85% Complete**

✅ **Completed Features**:
- Authentication and user management services
- Project management service with CRUD operations and member management
- Task management service with assignment and tracking capabilities
- Project and task template functionality
- Database migration scripts
- API routing with proper middleware integration
- Error handling and logging infrastructure
- Rate limiting for API protection
- Comprehensive test suite for services and API endpoints

⏳ **In Progress**:
- Fixing remaining TypeScript type definition issues
- Integration with frontend components
- End-to-end testing

## Project Structure

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
├── infrastructure/       # Infrastructure as code
├── docs/                 # Documentation
├── tests/                # End-to-end and integration tests
└── tools/                # Development tools
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v10 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Key Features

### AI-Powered Workflow Automation

- **Intelligent Task Assignment**: AI suggests the best team member for tasks based on expertise and workload
- **Task Prioritization**: Identifies stalled tasks and suggests prioritization changes
- **Status Update Automation**: Recommends status changes when subtasks are completed

### Advanced Analytics

- **Task Performance Metrics**: Compare estimated vs. actual time spent on tasks
- **Team Workload Analysis**: Visualize workload distribution across team members
- **Completion Trends**: Track task completion patterns over time

### Real-time Collaboration

- **Live Updates**: See changes in real-time as team members update tasks
- **Smart Notifications**: Get notified about relevant changes and suggestions
- **Team Insights**: Understand team performance and identify improvement areas

## Documentation

For detailed documentation on the AI features, see [AI_FEATURES.md](./docs/AI_FEATURES.md).

## API Reference

```bash
npm run dev
```

## Development

This project uses Turborepo for monorepo management. To run commands across all packages:

- `npm run dev` - Start development servers
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Run linting

## Architecture

Renexus follows a modular architecture with:

- React 18 for frontend components
- Radix UI and Tailwind CSS for styling
- React Query for data fetching
- Express.js for backend services
- Drizzle ORM with Neon database
- Passport.js for authentication
- Anthropic and OpenAI for AI features

## License

This project is private and proprietary.
