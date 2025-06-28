import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import {
  FilterList as FilterIcon,
  CloudDownload as ExportIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { GanttChart } from '../tasks/GanttChart';
import useTaskDependencies from '../../hooks/useTaskDependencies';
import { Task, TaskDependency } from '../../types/task';
import CriticalPathPanel from './CriticalPathPanel';

interface ProjectGanttViewProps {
  projectId: string;
  tasks: Task[];
  isLoading?: boolean;
  error?: Error | null;
  onTaskUpdate?: (task: Task) => void;
}

/**
 * ProjectGanttView Component
 * 
 * Displays project tasks in a Gantt chart with dependencies and critical path analysis
 */
const ProjectGanttView: React.FC<ProjectGanttViewProps> = ({
  projectId,
  tasks,
  isLoading = false,
  error = null,
  onTaskUpdate
}) => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState<boolean>(true);
  
  const {
    dependencies,
    loading: dependenciesLoading,
    error: dependenciesError,
    addDependency,
    removeDependency,
    criticalPath,
    refreshDependencies
  } = useTaskDependencies({
    projectId,
    tasks
  });
  
  // Calculate date range based on tasks
  useEffect(() => {
    if (tasks.length === 0) return;
    
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    
    tasks.forEach(task => {
      const taskStartDate = new Date(task.startDate);
      const taskEndDate = new Date(task.dueDate || task.startDate);
      
      if (!minDate || taskStartDate < minDate) {
        minDate = taskStartDate;
      }
      
      if (!maxDate || taskEndDate > maxDate) {
        maxDate = taskEndDate;
      }
    });
    
    // Add padding to the date range
    if (minDate) {
      minDate.setDate(minDate.getDate() - 7);
      setStartDate(minDate);
    }
    
    if (maxDate) {
      maxDate.setDate(maxDate.getDate() + 14);
      setEndDate(maxDate);
    }
  }, [tasks]);
  
  // Handle task update
  const handleTaskUpdate = (updatedTask: Task) => {
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
    }
  };
  
  // Handle dependency create
  const handleDependencyCreate = async (dependency: TaskDependency) => {
    await addDependency(
      dependency.fromTaskId,
      dependency.toTaskId,
      dependency.type
    );
  };
  
  // Handle dependency delete
  const handleDependencyDelete = async (dependencyId: string) => {
    await removeDependency(dependencyId);
  };
  
  // Toggle critical path display
  const toggleCriticalPath = () => {
    setShowCriticalPath(!showCriticalPath);
  };
  
  // Export Gantt chart as image
  const exportGanttChart = () => {
    // This would be implemented with a library like html2canvas
    alert('Export functionality would be implemented here');
  };
  
  // Loading state
  if (isLoading || dependenciesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error || dependenciesError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error?.message || dependenciesError?.message || 'An error occurred'}
      </Alert>
    );
  }
  
  // No tasks state
  if (tasks.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No tasks available for this project. Create tasks to see the Gantt chart.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Project Timeline</Typography>
        
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<FilterIcon />}
            variant="outlined"
          >
            Filter
          </Button>
          
          <Button
            size="small"
            startIcon={<ExportIcon />}
            variant="outlined"
            onClick={exportGanttChart}
          >
            Export
          </Button>
          
          <Button
            size="small"
            color={showCriticalPath ? 'primary' : 'inherit'}
            variant={showCriticalPath ? 'contained' : 'outlined'}
            onClick={toggleCriticalPath}
          >
            Critical Path
          </Button>
        </Stack>
      </Box>
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box sx={{ flexGrow: 1, minHeight: '500px' }}>
          {startDate && endDate && (
            <GanttChart
              tasks={tasks}
              dependencies={dependencies}
              startDate={startDate}
              endDate={endDate}
              onTaskUpdate={handleTaskUpdate}
              onDependencyCreate={handleDependencyCreate}
              onDependencyDelete={handleDependencyDelete}
            />
          )}
        </Box>
        
        {showCriticalPath && criticalPath && (
          <Box sx={{ width: '300px', ml: 2 }}>
            <CriticalPathPanel criticalPath={criticalPath} />
          </Box>
        )}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Legend
        </Typography>
        <Stack direction="row" spacing={2}>
          <Chip 
            size="small" 
            label="Critical Task" 
            sx={{ 
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText
            }} 
          />
          <Chip 
            size="small" 
            label="In Progress" 
            sx={{ 
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText
            }} 
          />
          <Chip 
            size="small" 
            label="Completed" 
            sx={{ 
              backgroundColor: theme.palette.success.main,
              color: theme.palette.success.contrastText
            }} 
          />
          <Chip 
            size="small" 
            label="High Priority" 
            sx={{ 
              backgroundColor: theme.palette.warning.main,
              color: theme.palette.warning.contrastText
            }} 
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default ProjectGanttView;
