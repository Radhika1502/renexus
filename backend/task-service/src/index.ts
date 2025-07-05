import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'task-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic task routes
app.get('/api/tasks', (req, res) => {
  res.json({ 
    message: 'Task service is running',
    tasks: []
  });
});

app.post('/api/tasks', (req, res) => {
  res.json({ 
    message: 'Task created successfully',
    task: { id: Date.now(), ...req.body }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Task Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app; 