import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  useDashboardAnalytics,
  useWorkloadAnalytics,
  useTaskTrends,
  useResourceUtilization,
} from '../../hooks/api/useDashboard';
import { useRealTimeUpdates } from '../../hooks/useWebSocket';
import { LoadingState } from '../common/LoadingState';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { TaskStatusChart } from './charts/TaskStatusChart';
import { TaskTrendChart } from './charts/TaskTrendChart';
import { ResourceUtilizationChart } from './charts/ResourceUtilizationChart';
import { WorkloadChart } from './charts/WorkloadChart';

interface DashboardProps {
  projectId?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ projectId }) => {
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = useDashboardAnalytics(projectId);

  const {
    data: workload,
    isLoading: isWorkloadLoading,
    error: workloadError,
  } = useWorkloadAnalytics();

  const {
    data: trends,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useTaskTrends();

  const {
    data: resources,
    isLoading: isResourcesLoading,
    error: resourcesError,
  } = useResourceUtilization();

  // Enable real-time updates
  useRealTimeUpdates();

  if (isAnalyticsLoading || isWorkloadLoading || isTrendsLoading || isResourcesLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  if (analyticsError || workloadError || trendsError || resourcesError) {
    return (
      <Box p={2}>
        <Typography color="error">
          Failed to load dashboard data. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box p={3}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Total Tasks</Typography>
              <Typography variant="h3">{analytics?.totalTasks}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Completed</Typography>
              <Typography variant="h3">{analytics?.completedTasks}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Overdue</Typography>
              <Typography variant="h3" color="error">
                {analytics?.overdueTasks}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Upcoming</Typography>
              <Typography variant="h3">{analytics?.upcomingTasks}</Typography>
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <TaskStatusChart data={analytics?.statusBreakdown} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <WorkloadChart data={workload} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <TaskTrendChart data={trends} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <ResourceUtilizationChart data={resources} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </ErrorBoundary>
  );
}; 