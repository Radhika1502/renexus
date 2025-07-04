import express from 'express';
import { Router } from 'express';
import { taskSuggestionRouter } from './task-suggestion';
import { workflowAutomationRouter } from './workflow-automation';
import { aiAnalyticsRouter } from './ai-analytics';
import { nlpRouter } from './nlp';

const router: Router = express.Router();

// AI Service Routes
router.use('/task-suggestions', taskSuggestionRouter);
router.use('/workflow-automation', workflowAutomationRouter);
router.use('/analytics', aiAnalyticsRouter);
router.use('/nlp', nlpRouter);

export { router as aiServiceRouter };
