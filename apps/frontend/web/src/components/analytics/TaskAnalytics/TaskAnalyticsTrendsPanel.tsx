import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  useTheme
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TaskAnalyticsSummary, TaskTrend  } from "../../../shared/types/task-analytics";

interface TaskAnalyticsTrendsPanelProps {
  trends: TaskTrend[];
  summary: TaskAnalyticsSummary;
}

/**
 * Task Analytics Trends Panel
 * 
 * Displays trend charts for task analytics data
 */
const TaskAnalyticsTrendsPanel: React.FC<TaskAnalyticsTrendsPanelProps> = ({ 
  trends,
  summary 
}) => {
  const theme = useTheme();
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Colors for charts
  const colors = {
    created: theme.palette.primary.main,
    completed: theme.palette.success.main,
    active: theme.palette.info.main,
    todo: theme.palette.info.light,
    inProgress: theme.palette.warning.main,
    review: theme.palette.secondary.main,
    done: theme.palette.success.main,
    blocked: theme.palette.error.main,
    low: '#8BC34A',
    medium: '#FFC107',
    high: '#FF9800',
    urgent: '#F44336'
  };
  
  // Prepare data for status distribution chart
  const statusData = Object.entries(summary.tasksByStatus).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count
  }));
  
  // Prepare data for priority distribution chart
  const priorityData = Object.entries(summary.tasksByPriority).map(([priority, count]) => ({
    name: priority,
    value: count
  }));
  
  // Prepare data for assignee distribution chart
  const assigneeData = Object.entries(summary.tasksByAssignee)
    .map(([assignee, count]) => ({
      name: assignee,
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Show top 5 assignees
  
  // Prepare data for category distribution chart
  const categoryData = Object.entries(summary.tasksByCategory)
    .map(([category, count]) => ({
      name: category,
      value: count
    }))
    .sort((a, b) => b.value - a.value);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  backgroundColor: entry.color,
                  mr: 1
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {`${entry.name}: ${entry.value}`}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };
  
  // Custom tooltip for pie charts
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`Count: ${payload[0].value}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`Percentage: ${((payload[0].value / summary.totalTasks) * 100).toFixed(1)}%`}
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return colors.todo;
      case 'in_progress':
        return colors.inProgress;
      case 'review':
        return colors.review;
      case 'done':
        return colors.done;
      case 'blocked':
        return colors.blocked;
      default:
        return theme.palette.grey[500];
    }
  };
  
  // Get color for priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return colors.low;
      case 'medium':
        return colors.medium;
      case 'high':
        return colors.high;
      case 'urgent':
        return colors.urgent;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Task Trends Chart */}
        <Grid item xs={12}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Task Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Task creation and completion trends over time
            </Typography>
            
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={trends.map(trend => ({
                    ...trend,
                    date: formatDate(trend.date)
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={{ stroke: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={{ stroke: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke={colors.created}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={colors.completed}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    name="Active"
                    stroke={colors.active}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Status Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Distribution of tasks by status
            </Typography>
            
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getStatusColor(entry.name.replace(' ', '_'))} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Priority Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Priority Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Distribution of tasks by priority
            </Typography>
            
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={priorityData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    tickLine={{ stroke: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={{ stroke: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Tasks" 
                    fill={theme.palette.primary.main}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getPriorityColor(entry.name)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Assignee Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Top Assignees
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Distribution of tasks by assignee (top 5)
            </Typography>
            
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={assigneeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }} 
                    tickLine={{ stroke: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }} 
                    tickLine={{ stroke: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.text.secondary }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Tasks" 
                    fill={theme.palette.primary.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Category Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: theme.shape.borderRadius,
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Distribution of tasks by category
            </Typography>
            
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={theme.palette.primary.main} 
                        opacity={0.7 + (index * 0.05)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskAnalyticsTrendsPanel;

