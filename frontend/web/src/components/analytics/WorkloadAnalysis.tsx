import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Tooltip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from 'react-query';
import { LoadingState } from '../common/LoadingState';

interface WorkloadData {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  overdueTasks: number;
  estimatedHours: number;
  actualHours: number;
}

interface WorkloadMetrics {
  workloadScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export const WorkloadAnalysis: React.FC = () => {
  const { data: workloadData, isLoading, error } = useQuery<WorkloadData[]>(
    'workload-analysis',
    async () => {
      const response = await fetch('/api/analytics/workload');
      if (!response.ok) throw new Error('Failed to fetch workload data');
      return response.json();
    }
  );

  const workloadMetrics = useMemo(() => {
    if (!workloadData) return [];

    return workloadData.map(user => {
      const metrics: WorkloadMetrics = {
        workloadScore: calculateWorkloadScore(user),
        riskLevel: determineRiskLevel(user),
        recommendations: generateRecommendations(user)
      };
      return { ...user, ...metrics };
    });
  }, [workloadData]);

  if (isLoading) return <LoadingState message="Loading workload analysis..." />;
  if (error) return <Typography color="error">Error loading workload analysis</Typography>;
  if (!workloadData) return null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Team Workload Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Workload Distribution Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workload Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workloadMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="assignedTasks" name="Assigned Tasks" fill="#2196f3" />
                  <Bar dataKey="completedTasks" name="Completed Tasks" fill="#4caf50" />
                  <Bar dataKey="upcomingDeadlines" name="Upcoming Deadlines" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Individual Workload Cards */}
        {workloadMetrics.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user.userId}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {user.userName}
                </Typography>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Workload Score
                  </Typography>
                  <Tooltip title={`Risk Level: ${user.riskLevel}`}>
                    <LinearProgress
                      variant="determinate"
                      value={user.workloadScore}
                      color={
                        user.riskLevel === 'high' ? 'error' :
                        user.riskLevel === 'medium' ? 'warning' : 'success'
                      }
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Tooltip>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Assigned Tasks
                    </Typography>
                    <Typography variant="h6">
                      {user.assignedTasks}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Completion Rate
                    </Typography>
                    <Typography variant="h6">
                      {Math.round((user.completedTasks / user.assignedTasks) * 100)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Estimated Hours
                    </Typography>
                    <Typography variant="h6">
                      {user.estimatedHours}h
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Actual Hours
                    </Typography>
                    <Typography variant="h6">
                      {user.actualHours}h
                    </Typography>
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Recommendations
                  </Typography>
                  {user.recommendations.map((rec, index) => (
                    <Typography key={index} variant="body2" color="textSecondary">
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Helper functions
function calculateWorkloadScore(user: WorkloadData): number {
  const taskLoad = (user.assignedTasks - user.completedTasks) / 10; // Normalize to 0-100
  const deadlineStress = (user.upcomingDeadlines + user.overdueTasks * 2) / 5;
  const hoursPressure = (user.actualHours / user.estimatedHours) * 50;
  
  return Math.min(Math.max(taskLoad + deadlineStress + hoursPressure, 0), 100);
}

function determineRiskLevel(user: WorkloadData): WorkloadMetrics['riskLevel'] {
  const score = calculateWorkloadScore(user);
  if (score > 75) return 'high';
  if (score > 50) return 'medium';
  return 'low';
}

function generateRecommendations(user: WorkloadData): string[] {
  const recommendations: string[] = [];
  
  if (user.overdueTasks > 0) {
    recommendations.push(`Prioritize ${user.overdueTasks} overdue tasks`);
  }
  
  if (user.actualHours > user.estimatedHours * 1.2) {
    recommendations.push('Review task time estimates for accuracy');
  }
  
  if (user.upcomingDeadlines > 5) {
    recommendations.push('Consider redistributing upcoming deadlines');
  }
  
  if (user.assignedTasks - user.completedTasks > 10) {
    recommendations.push('High number of open tasks - may need support');
  }
  
  return recommendations;
} 