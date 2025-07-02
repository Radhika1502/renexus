import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  useTheme 
} from '@mui/material';
import { 
  CheckCircleOutline, 
  PendingOutlined, 
  ErrorOutline, 
  AccessTimeOutlined 
} from '@mui/icons-material';
import { TaskAnalyticsSummary  } from "../../../shared/types/task-analytics";

interface TaskAnalyticsSummaryPanelProps {
  summary: TaskAnalyticsSummary;
}

/**
 * Task Analytics Summary Panel
 * 
 * Displays key metrics from task analytics summary data
 */
const TaskAnalyticsSummaryPanel: React.FC<TaskAnalyticsSummaryPanelProps> = ({ summary }) => {
  const theme = useTheme();

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Tasks',
      value: summary.totalTasks,
      icon: <AccessTimeOutlined fontSize="large" />,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light,
    },
    {
      title: 'Completed',
      value: summary.completedTasks,
      icon: <CheckCircleOutline fontSize="large" />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light,
    },
    {
      title: 'In Progress',
      value: summary.pendingTasks,
      icon: <PendingOutlined fontSize="large" />,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light,
    },
    {
      title: 'Overdue',
      value: summary.overdueTasks,
      icon: <ErrorOutline fontSize="large" />,
      color: theme.palette.error.main,
      bgColor: theme.palette.error.light,
    },
  ];

  // Format time in hours
  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                borderRadius: theme.shape.borderRadius,
                borderLeft: `4px solid ${card.color}`,
                height: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  backgroundColor: card.bgColor,
                  color: card.color,
                  mr: 2,
                }}
              >
                {card.icon}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
                <Typography variant="h5" component="div">
                  {card.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Average Completion Time */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Average Completion Time
            </Typography>
            <Typography variant="h5" component="div">
              {formatTime(summary.averageCompletionTime)}
            </Typography>
          </Paper>
        </Grid>

        {/* Tasks by Status */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tasks by Status
            </Typography>
            <Box>
              {Object.entries(summary.tasksByStatus).map(([status, count]) => (
                <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {status.replace('_', ' ')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Tasks by Priority */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%',
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tasks by Priority
            </Typography>
            <Box>
              {Object.entries(summary.tasksByPriority).map(([priority, count]) => (
                <Box key={priority} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {priority}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskAnalyticsSummaryPanel;

