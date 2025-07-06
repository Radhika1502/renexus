import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { TaskAnalyticsDashboard } from '../../src/components/analytics/TaskAnalytics';

/**
 * Task Analytics Demo Page
 * 
 * Demonstrates the Task Analytics Dashboard component
 */
const TaskAnalyticsDemo: React.FC = () => {
  // Mock user data - in a real app, this would come from authentication
  const userId = "user123";
  const userName = "John Doe";

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Analytics Dashboard
        </Typography>
        <TaskAnalyticsDashboard userId={userId} userName={userName} />
      </Box>
    </Container>
  );
};

export default TaskAnalyticsDemo;
