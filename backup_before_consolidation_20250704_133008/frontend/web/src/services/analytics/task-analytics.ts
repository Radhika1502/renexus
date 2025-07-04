import express from 'express';
import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { TaskAnalytics  } from "../../../shared/types/ai";

const router: Router = express.Router();

/**
 * @route GET /api/analytics/tasks/completion
 * @desc Get task completion metrics for a project
 * @access Private
 */
router.get('/completion', authenticateUser, async (req, res) => {
  try {
    const { projectId, timeframe = '30d' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Get task completion metrics
    const metrics = await getTaskCompletionMetrics(projectId as string, timeframe as string);
    
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting task completion metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get task completion metrics'
    });
  }
});

/**
 * @route GET /api/analytics/tasks/time-tracking
 * @desc Get time tracking visualization data
 * @access Private
 */
router.get('/time-tracking', authenticateUser, async (req, res) => {
  try {
    const { projectId, timeframe = '30d' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Get time tracking visualization data
    const timeTracking = await getTimeTrackingVisualization(projectId as string, timeframe as string);
    
    return res.status(200).json({
      success: true,
      data: timeTracking
    });
  } catch (error) {
    console.error('Error getting time tracking visualization:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get time tracking visualization'
    });
  }
});

/**
 * @route GET /api/analytics/tasks/distribution
 * @desc Get task distribution analysis
 * @access Private
 */
router.get('/distribution', authenticateUser, async (req, res) => {
  try {
    const { projectId, groupBy = 'status' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Get task distribution analysis
    const distribution = await getTaskDistributionAnalysis(
      projectId as string, 
      groupBy as string
    );
    
    return res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error getting task distribution analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get task distribution analysis'
    });
  }
});

/**
 * @route GET /api/analytics/tasks/trends
 * @desc Get task trends over time
 * @access Private
 */
router.get('/trends', authenticateUser, async (req, res) => {
  try {
    const { projectId, timeframe = '90d', interval = 'week' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Get task trends over time
    const trends = await getTaskTrendAnalysis(
      projectId as string, 
      timeframe as string,
      interval as string
    );
    
    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting task trend analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get task trend analysis'
    });
  }
});

/**
 * @route GET /api/analytics/tasks/dashboard
 * @desc Get complete task analytics dashboard data
 * @access Private
 */
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const { projectId, timeframe = '30d' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Get complete task analytics dashboard
    const dashboard = await getTaskAnalyticsDashboard(projectId as string, timeframe as string);
    
    return res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error getting task analytics dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get task analytics dashboard'
    });
  }
});

// Helper functions for task analytics service

/**
 * Gets task completion metrics for a project
 * @param projectId Project ID to get metrics for
 * @param timeframe Timeframe for metrics (e.g., '30d', '90d')
 * @returns Task completion metrics
 */
async function getTaskCompletionMetrics(projectId: string, timeframe: string): Promise<any> {
  // Query database for task completion metrics
  // For now, return mock metrics
  return {
    total: 120,
    completed: 85,
    inProgress: 25,
    blocked: 10,
    completionRate: 70.83,
    timeframe
  };
}

/**
 * Gets time tracking visualization data
 * @param projectId Project ID to get data for
 * @param timeframe Timeframe for data (e.g., '30d', '90d')
 * @returns Time tracking visualization data
 */
async function getTimeTrackingVisualization(projectId: string, timeframe: string): Promise<any> {
  try {
    const response = await fetch(`/api/analytics/time-tracking?projectId=${encodeURIComponent(projectId)}&timeframe=${encodeURIComponent(timeframe)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch time tracking visualization:', error);
    // Fallback with minimal data structure if API fails
    return {
      totalHours: 0,
      averageTaskTime: 0,
      taskTimeDistribution: [],
      timeByDay: [],
      timeframe,
      error: 'Failed to load data'
    };
  }
}

/**
 * Gets task distribution analysis
 * @param projectId Project ID to get analysis for
 * @param groupBy Field to group tasks by
 * @returns Task distribution analysis
 */
async function getTaskDistributionAnalysis(projectId: string, groupBy: string): Promise<any> {
  try {
    const response = await fetch(`/api/analytics/task-distribution?projectId=${encodeURIComponent(projectId)}&groupBy=${encodeURIComponent(groupBy)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch task distribution analysis:', error);
    
    // Fallback with minimal structure based on groupBy parameter
    const emptyDistribution = { groupBy, items: [], total: 0, error: 'Failed to load data' };
    return emptyDistribution;
  }
}
}

/**
 * Gets task trend analysis over time
 * @param projectId Project ID to get analysis for
 * @param timeframe Timeframe for analysis (e.g., '30d', '90d')
 * @param interval Interval for data points (e.g., 'day', 'week', 'month')
 * @returns Task trend analysis
 */
async function getTaskTrendAnalysis(
  projectId: string, 
  timeframe: string,
  interval: string
): Promise<any> {
  // Query database for task trend data
  // For now, return mock trend data
  return {
    trends: [
      { period: '2025-04-01', completedTasks: 12, createdTasks: 15 },
      { period: '2025-04-08', completedTasks: 15, createdTasks: 18 },
      { period: '2025-04-15', completedTasks: 18, createdTasks: 14 },
      { period: '2025-04-22', completedTasks: 14, createdTasks: 16 },
      { period: '2025-04-29', completedTasks: 16, createdTasks: 20 },
      { period: '2025-05-06', completedTasks: 19, createdTasks: 17 },
      { period: '2025-05-13', completedTasks: 17, createdTasks: 15 },
      { period: '2025-05-20', completedTasks: 20, createdTasks: 18 },
      { period: '2025-05-27', completedTasks: 22, createdTasks: 19 },
      { period: '2025-06-03', completedTasks: 18, createdTasks: 21 },
      { period: '2025-06-10', completedTasks: 21, createdTasks: 16 },
      { period: '2025-06-17', completedTasks: 19, createdTasks: 18 },
      { period: '2025-06-24', completedTasks: 23, createdTasks: 20 }
    ],
    timeframe,
    interval
  };
}

/**
 * Gets complete task analytics dashboard data
 * @param projectId Project ID to get dashboard for
 * @param timeframe Timeframe for dashboard data
 * @returns Complete task analytics dashboard
 */
async function getTaskAnalyticsDashboard(projectId: string, timeframe: string): Promise<TaskAnalytics> {
  // Combine all task analytics data
  const completionMetrics = await getTaskCompletionMetrics(projectId, timeframe);
  const timeTracking = await getTimeTrackingVisualization(projectId, timeframe);
  const distributionByStatus = await getTaskDistributionAnalysis(projectId, 'status');
  const distributionByAssignee = await getTaskDistributionAnalysis(projectId, 'assignee');
  const distributionByPriority = await getTaskDistributionAnalysis(projectId, 'priority');
  const trends = await getTaskTrendAnalysis(projectId, timeframe, 'week');
  
  return {
    projectId,
    timeframe,
    completionMetrics: {
      total: completionMetrics.total,
      completed: completionMetrics.completed,
      inProgress: completionMetrics.inProgress,
      blocked: completionMetrics.blocked,
      completionRate: completionMetrics.completionRate
    },
    timeTracking: {
      totalHours: timeTracking.totalHours,
      averageTaskTime: timeTracking.averageTaskTime,
      taskTimeDistribution: timeTracking.taskTimeDistribution
    },
    distribution: {
      byStatus: distributionByStatus.byStatus,
      byAssignee: distributionByAssignee.byAssignee,
      byPriority: distributionByPriority.byPriority
    },
    trends: trends.trends
  };
}

export { router as taskAnalyticsRouter };

