import express from 'express';
import { taskAnalyticsRouter } from './task-analytics';
import { teamPerformanceRouter } from './team-performance';
import { reportBuilderRouter } from './report-builder';
import { dataVisualizationRouter } from './data-visualization';

const router = express.Router();

// Mount task analytics routes
router.use('/tasks', taskAnalyticsRouter);

// Mount team performance routes
router.use('/team', teamPerformanceRouter);

// Mount report builder routes
router.use('/reports', reportBuilderRouter);

// Mount data visualization routes
router.use('/visualizations', dataVisualizationRouter);

export { router as analyticsRouter };
