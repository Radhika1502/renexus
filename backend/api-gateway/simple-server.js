const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard endpoints
app.get('/dashboard/summary', (req, res) => {
  res.json({
    activeProjects: 5,
    completedProjects: 12,
    totalTasks: 48,
    completedTasks: 36,
    upcomingDeadlines: 3,
    teamMembers: 8
  });
});

app.get('/dashboard/projects', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Renexus Core Development',
      status: 'active',
      progress: 75,
      tasksTotal: 20,
      tasksCompleted: 15
    },
    {
      id: '2',
      name: 'UI/UX Improvements',
      status: 'active',
      progress: 60,
      tasksTotal: 15,
      tasksCompleted: 9
    }
  ]);
});

app.get('/dashboard/activity', (req, res) => {
  res.json([
    {
      id: '1',
      type: 'task_completed',
      message: 'Task "Implement Dashboard" completed',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'John Doe'
    },
    {
      id: '2',
      type: 'project_created',
      message: 'New project "Mobile App" created',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Jane Smith'
    }
  ]);
});

// Catch all for unknown routes
app.get('*', (req, res) => {
  res.json({
    message: 'Renexus API Gateway',
    timestamp: new Date().toISOString(),
    requestedPath: req.path
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Renexus API Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard/summary`);
  console.log('✅ Ready to serve dashboard data!');
}); 