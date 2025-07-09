import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Proxy middleware configuration
const authProxy = createProxyMiddleware({
  target: 'http://localhost:4001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
});

const taskProxy = createProxyMiddleware({
  target: 'http://localhost:4002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/tasks': '/api/tasks'
  }
});

const notificationProxy = createProxyMiddleware({
  target: 'http://localhost:4003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  }
});

// Routes
app.use('/api/auth', authProxy);
app.use('/api/tasks', taskProxy);
app.use('/api/notifications', notificationProxy);

// Dashboard routes
app.get('/dashboard/summary', (_req, res) => {
  res.json({
    activeProjects: 5,
    completedTasks: 10,
    upcomingDeadlines: 3,
    teamMembers: 8
  });
});

app.get('/dashboard/projects', (_req, res) => {
  res.json([
    { id: 1, name: 'Project A', status: 'active', progress: 75 },
    { id: 2, name: 'Project B', status: 'completed', progress: 100 }
  ]);
});

app.get('/dashboard/tasks/status', (_req, res) => {
  res.json({
    pending: 5,
    inProgress: 3,
    completed: 10,
    total: 18
  });
});

app.get('/dashboard/activity', (_req, res) => {
  res.json([
    {
      id: 1,
      userName: 'John Doe',
      userAvatar: null,
      action: 'completed',
      entityName: 'Task A',
      entityType: 'TASK',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      userName: 'Jane Smith',
      userAvatar: null,
      action: 'created',
      entityName: 'Project B',
      entityType: 'PROJECT',
      timestamp: new Date().toISOString()
    },
    {
      id: 3,
      userName: 'Mike Johnson',
      userAvatar: null,
      action: 'started',
      entityName: 'Sprint 1',
      entityType: 'SPRINT',
      timestamp: new Date().toISOString()
    }
  ]);
});

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
}); 