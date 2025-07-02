import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { TaskAnalyticsDashboard } from '../../components/analytics/TaskAnalytics';

/**
 * Task Analytics Demo Page
 * 
 * Demonstrates the Task Analytics Dashboard component
 */
const TaskAnalyticsDemo: React.FC = () => {
  // Mock user data - in a real app, this would come from authentication
  const userId = 'john-doe';
  const userName = 'John Doe';

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Analytics Demo
        </Typography>
        <Typography variant="body1" paragraph>
          This page demonstrates the Task Analytics Dashboard component with mock data.
          In a real application, this would be integrated with your task management system.
        </Typography>
      </Container>
      
      <TaskAnalyticsDashboard userId={userId} userName={userName} />
    </Box>
  );
};

export default TaskAnalyticsDemo;
