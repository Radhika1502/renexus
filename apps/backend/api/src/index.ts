/**
 * Main API Service
 * 
 * This is the entry point for the main API service
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Initialize express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api' });
});

// API routes will be imported and used here
// Example: app.use('/api/v1/users', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`API service running on port ${port}`);
});

export default app;
