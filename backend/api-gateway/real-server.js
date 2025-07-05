const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

console.log('🚀 Starting Renexus Real API Server...');

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Import the NestJS application
let nestApp = null;
let prismaAvailable = false;

// Try to initialize NestJS application
async function initializeNestApp() {
  try {
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/app.module');
    
    console.log('🔧 Initializing NestJS application...');
    nestApp = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    // Test database connection
    const { PrismaService } = require('./dist/prisma.service');
    const prisma = nestApp.get(PrismaService);
    await prisma.$connect();
    
    console.log('✅ Database connection established');
    prismaAvailable = true;
    
    return true;
  } catch (error) {
    console.warn('⚠️  NestJS/Database initialization failed:', error.message);
    console.log('📦 Falling back to mock data mode...');
    return false;
  }
}

// Mock data for fallback
const mockData = {
  summary: {
    totalProjects: 3,
    totalTasks: 10,
    completedTasks: 4,
    pendingTasks: 6,
    totalUsers: 4,
    activeUsers: 3
  },
  projects: [
    {
      id: '1',
      name: 'Renexus Core Development',
      description: 'Main project for developing the Renexus application',
      completionRate: 65,
      totalTasks: 4,
      completedTasks: 2,
      status: 'active'
    },
    {
      id: '2',
      name: 'UI Component Library',
      description: 'Building reusable UI components',
      completionRate: 80,
      totalTasks: 3,
      completedTasks: 2,
      status: 'active'
    },
    {
      id: '3',
      name: 'API Development',
      description: 'Backend API development and integration',
      completionRate: 90,
      totalTasks: 3,
      completedTasks: 3,
      status: 'active'
    }
  ],
  taskStatus: [
    { status: 'todo', count: 3, percentage: 30 },
    { status: 'in_progress', count: 3, percentage: 30 },
    { status: 'review', count: 1, percentage: 10 },
    { status: 'done', count: 3, percentage: 30 }
  ],
  activities: [
    {
      id: '1',
      userName: 'John Doe',
      action: 'completed task',
      entityName: 'Setup Database Schema',
      entityType: 'TASK',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      userAvatar: null
    },
    {
      id: '2',
      userName: 'Jane Smith',
      action: 'created project',
      entityName: 'UI Component Library',
      entityType: 'PROJECT',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      userAvatar: null
    },
    {
      id: '3',
      userName: 'Mike Johnson',
      action: 'completed task',
      entityName: 'Design Button Components',
      entityType: 'TASK',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      userAvatar: null
    },
    {
      id: '4',
      userName: 'Sarah Wilson',
      action: 'started working on',
      entityName: 'Form Components',
      entityType: 'TASK',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      userAvatar: null
    }
  ]
};

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Renexus API Server is running',
    database: prismaAvailable ? 'connected' : 'mock_mode',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    database: prismaAvailable ? 'postgresql' : 'mock_data',
    timestamp: new Date().toISOString()
  });
});

// Dashboard endpoints with real data or fallback
app.get('/dashboard/summary', async (req, res) => {
  try {
    if (nestApp && prismaAvailable) {
      const dashboardService = nestApp.get('DashboardService');
      const summary = await dashboardService.getDashboardSummary();
      res.json(summary);
    } else {
      res.json(mockData.summary);
    }
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.json(mockData.summary);
  }
});

app.get('/dashboard/projects', async (req, res) => {
  try {
    if (nestApp && prismaAvailable) {
      const dashboardService = nestApp.get('DashboardService');
      const projects = await dashboardService.getProjectSummaries();
      res.json(projects);
    } else {
      res.json(mockData.projects);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.json(mockData.projects);
  }
});

app.get('/dashboard/tasks/status', async (req, res) => {
  try {
    if (nestApp && prismaAvailable) {
      const dashboardService = nestApp.get('DashboardService');
      const taskStatus = await dashboardService.getTaskStatusSummary();
      res.json(taskStatus);
    } else {
      res.json(mockData.taskStatus);
    }
  } catch (error) {
    console.error('Error fetching task status:', error);
    res.json(mockData.taskStatus);
  }
});

app.get('/dashboard/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    if (nestApp && prismaAvailable) {
      const dashboardService = nestApp.get('DashboardService');
      const activities = await dashboardService.getActivityFeed(limit);
      res.json(activities);
    } else {
      res.json(mockData.activities.slice(0, limit));
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.json(mockData.activities.slice(0, parseInt(req.query.limit) || 10));
  }
});

// Catch all other routes
app.get('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found', 
    path: req.path,
    available_endpoints: [
      '/health',
      '/api/health',
      '/dashboard/summary',
      '/dashboard/projects',
      '/dashboard/tasks/status',
      '/dashboard/activity'
    ]
  });
});

// Initialize and start server
async function startServer() {
  // Try to initialize NestJS
  await initializeNestApp();
  
  app.listen(PORT, () => {
    console.log(`✅ Renexus API Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 Dashboard Summary: http://localhost:${PORT}/dashboard/summary`);
    
    if (prismaAvailable) {
      console.log('🗄️  Using PostgreSQL database for real data');
    } else {
      console.log('📦 Using mock data (PostgreSQL not available)');
      console.log('💡 To use real data, setup PostgreSQL and run: npx prisma db push');
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (nestApp) {
    await nestApp.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  if (nestApp) {
    await nestApp.close();
  }
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 