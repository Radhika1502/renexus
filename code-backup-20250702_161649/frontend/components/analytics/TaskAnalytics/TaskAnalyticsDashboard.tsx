import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Tab, 
  Tabs, 
  useTheme,
  Button,
  Divider
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  List as ListIcon, 
  Notifications as NotificationsIcon 
} from '@mui/icons-material';
import TaskAnalytics from './TaskAnalytics';
import UserMentionsPanel from './UserMentionsPanel';
import { TaskAnalyticsFilters  } from "../../../shared/types/task-analytics";

interface TaskAnalyticsDashboardProps {
  userId: string;
  userName: string;
}

/**
 * Task Analytics Dashboard
 * 
 * Main dashboard component that integrates all task analytics components
 */
const TaskAnalyticsDashboard: React.FC<TaskAnalyticsDashboardProps> = ({
  userId,
  userName
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Calculate date range filters
  const getDateRangeFilters = (): TaskAnalyticsFilters => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle date range change
  const handleDateRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    setDateRange(range);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[2]
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Task Analytics Dashboard
          </Typography>
          <Box>
            <Button
              variant={dateRange === 'week' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange('week')}
              sx={{ mr: 1 }}
            >
              Week
            </Button>
            <Button
              variant={dateRange === 'month' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange('month')}
              sx={{ mr: 1 }}
            >
              Month
            </Button>
            <Button
              variant={dateRange === 'quarter' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange('quarter')}
              sx={{ mr: 1 }}
            >
              Quarter
            </Button>
            <Button
              variant={dateRange === 'year' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange('year')}
            >
              Year
            </Button>
          </Box>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {userName}. Here's your task analytics overview.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="task analytics dashboard tabs"
          sx={{ mb: 2 }}
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="Overview" 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            icon={<ListIcon />} 
            label="Task Details" 
            id="tab-1" 
            aria-controls="tabpanel-1" 
          />
          <Tab 
            icon={<NotificationsIcon />} 
            label="Your Mentions" 
            id="tab-2" 
            aria-controls="tabpanel-2" 
          />
        </Tabs>
        
        {/* Overview Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 0}
          id="tabpanel-0"
          aria-labelledby="tab-0"
        >
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TaskAnalytics 
                  userId={userId} 
                  initialFilters={getDateRangeFilters()} 
                />
              </Grid>
            </Grid>
          )}
        </div>
        
        {/* Task Details Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 1}
          id="tabpanel-1"
          aria-labelledby="tab-1"
        >
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TaskAnalytics 
                  userId={userId} 
                  initialFilters={getDateRangeFilters()} 
                />
              </Grid>
            </Grid>
          )}
        </div>
        
        {/* Your Mentions Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 2}
          id="tabpanel-2"
          aria-labelledby="tab-2"
        >
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <UserMentionsPanel userId={userId} />
              </Grid>
            </Grid>
          )}
        </div>
      </Paper>
    </Container>
  );
};

export default TaskAnalyticsDashboard;

