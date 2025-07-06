# Renexus - Task Management System

A comprehensive task management system with real-time collaboration features.

## Features

- Task Management
  - Create, update, and delete tasks
  - Assign tasks to team members
  - Set priorities and deadlines
  - Track progress and time spent
  - Add dependencies and subtasks

- Project Management
  - Create and manage projects
  - Add team members with different roles
  - Track project progress and budget
  - View project statistics and reports
  - Manage project templates

- Real-time Collaboration
  - Real-time task updates
  - Collaborative task editing
  - User presence indicators
  - In-app notifications
  - Real-time chat (coming soon)

- Security
  - Role-based access control
  - Data encryption
  - Input validation and sanitization
  - Rate limiting
  - CSRF protection

## Tech Stack

- Frontend
  - React with TypeScript
  - Material-UI for components
  - React Query for data fetching
  - WebSocket for real-time features
  - Jest and Testing Library for testing

- Backend
  - Node.js with TypeScript
  - PostgreSQL for database
  - Redis for caching
  - WebSocket for real-time features
  - Jest for testing

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/renexus.git
   cd renexus
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend/web
   npm install

   # Install backend dependencies
   cd ../../backend
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Frontend
   cp frontend/web/.env.example frontend/web/.env
   # Edit frontend/web/.env with your settings

   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

4. Set up the database:
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend/web
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- WebSocket: ws://localhost:4000/ws

## Development

### Project Structure

```
renexus/
├── frontend/
│   └── web/
│       ├── public/
│       └── src/
│           ├── api/        # API integration
│           ├── components/ # React components
│           ├── contexts/   # React contexts
│           ├── hooks/      # Custom hooks
│           ├── pages/      # Page components
│           ├── services/   # Business logic
│           ├── styles/     # Global styles
│           ├── test/       # Test utilities
│           ├── types/      # TypeScript types
│           └── utils/      # Utility functions
├── backend/
│   ├── src/
│   │   ├── api/           # API routes
│   │   ├── config/        # Configuration
│   │   ├── database/      # Database setup
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── websocket/     # WebSocket handlers
│   └── test/              # Test files
└── shared/                # Shared code
    ├── constants/         # Constants
    └── types/            # Shared types
```

### Code Style

We use ESLint and Prettier for code formatting. Run the following commands to check and fix code style:

```bash
# Check code style
npm run lint

# Fix code style
npm run lint:fix
```

### Testing

We use Jest and Testing Library for testing. Run the following commands to run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

To build the application for production:

```bash
# Build frontend
cd frontend/web
npm run build

# Build backend
cd backend
npm run build
```

## Deployment

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- NGINX or similar web server

### Steps

1. Build the application as described above

2. Set up environment variables for production

3. Set up NGINX:
   ```nginx
   # Frontend
   server {
     listen 80;
     server_name your-domain.com;
     root /path/to/frontend/dist;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     location /api {
       proxy_pass http://localhost:4000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
     
     location /ws {
       proxy_pass http://localhost:4000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

4. Start the application:
   ```bash
   # Start backend
   cd backend
   npm run start:prod

   # Serve frontend with NGINX
   sudo service nginx restart
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@renexus.com or join our Slack channel.
