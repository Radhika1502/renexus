import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Mock data
const mockSummary = {
  activeProjects: 0,
  completedTasks: 0,
  upcomingDeadlines: 0,
  teamMembers: 0,
  completedProjects: 0
};

const mockProjects = [];
const mockTasks = [];
const mockActivity = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.get('/dashboard/summary', (req, res) => {
  res.json(mockSummary);
});

app.get('/dashboard/projects', (req, res) => {
  res.json(mockProjects);
});

app.get('/dashboard/tasks/status', (req, res) => {
  res.json(mockTasks);
});

app.get('/dashboard/activity', (req, res) => {
  res.json(mockActivity);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple API Gateway running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
});

export default app; 