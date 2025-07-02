/**
 * Task Management Service
 * 
 * This is the entry point for the task management microservice
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Initialize express app
const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'tasks' });
});

// Task routes will be defined and used here
// Example: app.use('/api/tasks', taskRoutes);

// Start server
app.listen(port, () => {
  console.log(`Task service running on port ${port}`);
});

export default app;
