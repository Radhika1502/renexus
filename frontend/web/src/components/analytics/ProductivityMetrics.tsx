import React, { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Tooltip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from 'react-query';
import { LoadingState } from '../common/LoadingState';

interface ProductivityData {
  userId: string;
  userName: string;
  metrics: {
    date: string;
    tasksCompleted: number;
    timeSpent: number;
    codeCommits: number;
    reviewsCompleted: number;
    bugsClosed: number;
  }[];
}

interface ProductivityScore {
  overall: number;
  velocity: number;
  quality: number;
  efficiency: number;
  trends: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export const ProductivityMetrics: React.FC = () => {
  const { data: productivityData, isLoading, error } = useQuery<ProductivityData[]>(
    'productivity-metrics',
    async () => {
      const response = await fetch('/api/analytics/productivity');
      if (!response.ok) throw new Error('Failed to fetch productivity data');
      return response.json();
    }
  );

  const productivityScores = useMemo(() => {
    if (!productivityData) return [];

    return productivityData.map(user => {
      const score = calculateProductivityScore(user);
      return { ...user, score };
    });
  }, [productivityData]);

  const teamAverages = useMemo(() => {
    if (!productivityScores.length) return null;

    return {
      overall: average(productivityScores.map(u => u.score.overall)),
      velocity: average(productivityScores.map(u => u.score.velocity)),
      quality: average(productivityScores.map(u => u.score.quality)),
      efficiency: average(productivityScores.map(u => u.score.efficiency))
    };
  }, [productivityScores]);

  if (isLoading) return <LoadingState message="Loading productivity metrics..." />;
  if (error) return <Typography color="error">Error loading productivity metrics</Typography>;
  if (!productivityData || !teamAverages) return null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Productivity Metrics
      </Typography>

      <Grid container spacing={3}>
        {/* Team Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Performance Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <CircularProgressWithLabel value={teamAverages.overall} label="Overall" />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <CircularProgressWithLabel value={teamAverages.velocity} label="Velocity" />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <CircularProgressWithLabel value={teamAverages.quality} label="Quality" />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <CircularProgressWithLabel value={teamAverages.efficiency} label="Efficiency" />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Productivity Trends */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Productivity Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={aggregateTeamMetrics(productivityData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tasksCompleted" name="Tasks Completed" stroke="#2196f3" />
                  <Line type="monotone" dataKey="codeCommits" name="Code Commits" stroke="#4caf50" />
                  <Line type="monotone" dataKey="bugsClosed" name="Bugs Closed" stroke="#f44336" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Individual Performance Cards */}
        {productivityScores.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user.userId}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {user.userName}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Overall Score
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(user.score.overall)}%
                      <TrendIndicator trend={user.score.trends} />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Velocity
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(user.score.velocity)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Quality
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(user.score.quality)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Efficiency
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(user.score.efficiency)}%
                    </Typography>
                  </Grid>
                </Grid>

                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Last 30 Days:
                  </Typography>
                  <Typography variant="body2">
                    • {getLastPeriodMetrics(user.metrics).tasksCompleted} tasks completed
                  </Typography>
                  <Typography variant="body2">
                    • {getLastPeriodMetrics(user.metrics).codeCommits} code commits
                  </Typography>
                  <Typography variant="body2">
                    • {getLastPeriodMetrics(user.metrics).bugsClosed} bugs resolved
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Helper Components
const CircularProgressWithLabel: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={value} size={80} />
      <Box
        position="absolute"
        top={0}
        left={0}
        bottom={0}
        right={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
    <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
      {label}
    </Typography>
  </Box>
);

const TrendIndicator: React.FC<{ trend: ProductivityScore['trends'] }> = ({ trend }) => {
  const color = trend.direction === 'up' ? 'success.main' : trend.direction === 'down' ? 'error.main' : 'text.secondary';
  const symbol = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
  
  return (
    <Tooltip title={`${trend.direction === 'up' ? 'Increased' : trend.direction === 'down' ? 'Decreased' : 'Stable'} by ${trend.percentage}%`}>
      <Typography component="span" color={color} style={{ marginLeft: 8 }}>
        {symbol}
      </Typography>
    </Tooltip>
  );
};

// Helper Functions
function calculateProductivityScore(user: ProductivityData): ProductivityScore {
  const recentMetrics = getLastPeriodMetrics(user.metrics);
  const previousMetrics = getPreviousPeriodMetrics(user.metrics);

  const velocity = (recentMetrics.tasksCompleted / 20) * 100; // Normalize to percentage
  const quality = ((recentMetrics.bugsClosed / recentMetrics.tasksCompleted) * 100) || 0;
  const efficiency = (recentMetrics.codeCommits / recentMetrics.timeSpent) * 100;
  const overall = (velocity + quality + efficiency) / 3;

  const trend = calculateTrend(recentMetrics, previousMetrics);

  return {
    overall,
    velocity,
    quality,
    efficiency,
    trends: trend
  };
}

function getLastPeriodMetrics(metrics: ProductivityData['metrics']) {
  const last30Days = metrics.slice(-30);
  return {
    tasksCompleted: sum(last30Days.map(m => m.tasksCompleted)),
    timeSpent: sum(last30Days.map(m => m.timeSpent)),
    codeCommits: sum(last30Days.map(m => m.codeCommits)),
    reviewsCompleted: sum(last30Days.map(m => m.reviewsCompleted)),
    bugsClosed: sum(last30Days.map(m => m.bugsClosed))
  };
}

function getPreviousPeriodMetrics(metrics: ProductivityData['metrics']) {
  const previous30Days = metrics.slice(-60, -30);
  return {
    tasksCompleted: sum(previous30Days.map(m => m.tasksCompleted)),
    timeSpent: sum(previous30Days.map(m => m.timeSpent)),
    codeCommits: sum(previous30Days.map(m => m.codeCommits)),
    reviewsCompleted: sum(previous30Days.map(m => m.reviewsCompleted)),
    bugsClosed: sum(previous30Days.map(m => m.bugsClosed))
  };
}

function calculateTrend(
  recent: ReturnType<typeof getLastPeriodMetrics>,
  previous: ReturnType<typeof getLastPeriodMetrics>
): ProductivityScore['trends'] {
  const recentScore = (recent.tasksCompleted + recent.codeCommits + recent.bugsClosed) / 3;
  const previousScore = (previous.tasksCompleted + previous.codeCommits + previous.bugsClosed) / 3;
  
  const percentageChange = ((recentScore - previousScore) / previousScore) * 100;
  
  return {
    direction: percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable',
    percentage: Math.abs(percentageChange)
  };
}

function aggregateTeamMetrics(data: ProductivityData[]) {
  const dates = [...new Set(data.flatMap(user => user.metrics.map(m => m.date)))].sort();
  
  return dates.map(date => {
    const dayMetrics = data.flatMap(user => 
      user.metrics.filter(m => m.date === date)
    );
    
    return {
      date,
      tasksCompleted: sum(dayMetrics.map(m => m.tasksCompleted)),
      codeCommits: sum(dayMetrics.map(m => m.codeCommits)),
      bugsClosed: sum(dayMetrics.map(m => m.bugsClosed))
    };
  });
}

// Utility Functions
const sum = (numbers: number[]) => numbers.reduce((a, b) => a + b, 0);
const average = (numbers: number[]) => sum(numbers) / numbers.length; 