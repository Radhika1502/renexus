import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';

import { errorHandler } from './middleware/errorHandler';
import { configurePassport } from './config/passport';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const port = process.env.PORT || 4001;

// Configure passport
configurePassport(passport);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Auth service running on port ${port}`);
});

export default app;
