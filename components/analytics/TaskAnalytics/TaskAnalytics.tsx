import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab,
  useTheme
} from '@mui/material';
import useTaskAnalytics from '../../../hooks/useTaskAnalytics';
import TaskAnalyticsSummaryPanel from './TaskAnalyticsSummaryPanel';
import TaskAnalyticsFiltersPanel from './TaskAnalyticsFiltersPanel';
import TaskAnalyticsTrendsPanel from './TaskAnalyticsTrendsPanel';
import TaskAnalyticsTable from './TaskAnalyticsTable';
import { TaskAnalyticsFilters } from '../../../types/task-analytics';

interface TaskAnalyticsProps {
  userId?: string;
  initialFilters?: TaskAnalyticsFilters;
}

/**
 * Task Analytics Component
 * 
 * Displays comprehensive task analytics including summary metrics,
 * trends, and detailed task data with filtering capabilities
 */
const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ 
  userId,
  initialFilters 
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  
  const { 
    data, 
    loading, 
    error, 
    filters, 
    updateFilters, 
    resetFilters,
    refreshData 
  } = useTaskAnalytics(initialFilters);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[2]
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Task Analytics
        </Typography>
        
        {/* Filters Panel */}
        <TaskAnalyticsFiltersPanel 
          filters={filters}
          onFilterChange={updateFilters}
          onResetFilters={resetFilters}
        />
        
        {/* Loading and Error States */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error.message || 'An error occurred while fetching task analytics data.'}
          </Alert>
        )}
        
        {/* Data Display */}
        {!loading && !error && data && (
          <>
            {/* Summary Cards */}
            <TaskAnalyticsSummaryPanel summary={data.summary} />
            
            {/* Tabs for different views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="task analytics tabs"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Trends" id="tab-0" aria-controls="tabpanel-0" />
                <Tab label="Tasks" id="tab-1" aria-controls="tabpanel-1" />
              </Tabs>
            </Box>
            
            {/* Trends Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {activeTab === 0 && (
                <Box sx={{ py: 3 }}>
                  <TaskAnalyticsTrendsPanel 
                    trends={data.trends} 
                    summary={data.summary}
                  />
                </Box>
              )}
            </div>
            
            {/* Tasks Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {activeTab === 1 && (
                <Box sx={{ py: 3 }}>
                  <TaskAnalyticsTable 
                    tasks={data.tasks} 
                    userId={userId}
                    onRefresh={refreshData}
                  />
                </Box>
              )}
            </div>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TaskAnalytics;
