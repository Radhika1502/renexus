const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

console.log('🚀 Starting Simple Mock API Server...');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Dashboard endpoints
app.get('/dashboard/summary', (req, res) => {
  res.json({
    totalProjects: 5,
    totalTasks: 23,
    completedTasks: 12,
    pendingTasks: 11,
    totalUsers: 8,
    activeUsers: 6
  });
});

app.get('/dashboard/projects', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Renexus Development',
      description: 'Main project development',
      completionRate: 65,
      totalTasks: 15,
      completedTasks: 10,
      status: 'active'
    },
    {
      id: '2',
      name: 'UI Components',
      description: 'Building reusable UI components',
      completionRate: 80,
      totalTasks: 8,
      completedTasks: 6,
      status: 'active'
    }
  ]);
});

app.get('/dashboard/tasks/status', (req, res) => {
  res.json([
    { status: 'todo', count: 8, percentage: 35 },
    { status: 'in_progress', count: 7, percentage: 30 },
    { status: 'review', count: 3, percentage: 13 },
    { status: 'done', count: 5, percentage: 22 }
  ]);
});

app.get('/dashboard/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const activities = [
    {
      id: '1',
      userName: 'John Doe',
      action: 'completed task',
      entityName: 'Fix login bug',
      entityType: 'TASK',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      userAvatar: null
    },
    {
      id: '2',
      userName: 'Jane Smith',
      action: 'created project',
      entityName: 'Mobile App',
      entityType: 'PROJECT',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      userAvatar: null
    },
    {
      id: '3',
      userName: 'Mike Johnson',
      action: 'commented on',
      entityName: 'API Integration',
      entityType: 'COMMENT',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      userAvatar: null
    },
    {
      id: '4',
      userName: 'Sarah Wilson',
      action: 'started sprint',
      entityName: 'Sprint 3',
      entityType: 'SPRINT',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      userAvatar: null
    },
    {
      id: '5',
      userName: 'Tom Brown',
      action: 'joined team',
      entityName: 'Development Team',
      entityType: 'TEAM',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      userAvatar: null
    }
  ];
  
  res.json(activities.slice(0, limit));
});

// Catch all other routes
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`✅ Mock API Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard Summary: http://localhost:${PORT}/dashboard/summary`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
}); 