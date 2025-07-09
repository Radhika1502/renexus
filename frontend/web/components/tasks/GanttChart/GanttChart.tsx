import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Today as TodayIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import GanttHeader from './GanttHeader';
import GanttGrid from './GanttGrid';
import GanttTask from './GanttTask';
import GanttDependency from './GanttDependency';
import { Task, TaskDependency  } from "../../../shared/types/task";

interface GanttChartProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  startDate?: Date;
  endDate?: Date;
  onTaskUpdate?: (task: Task) => void;
  onDependencyCreate?: (dependency: TaskDependency) => void;
  onDependencyDelete?: (dependencyId: string) => void;
}

/**
 * Gantt Chart Component
 * 
 * Displays project tasks in a timeline view with dependencies
 */
const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies,
  startDate: propStartDate,
  endDate: propEndDate,
  onTaskUpdate,
  onDependencyCreate,
  onDependencyDelete
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate start and end dates if not provided
  const calculateDateRange = () => {
    if (tasks.length === 0) {
      const today = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(today.getMonth() + 1);
      return { start: today, end: oneMonthFromNow };
    }
    
    let minDate = new Date(tasks[0].startDate);
    let maxDate = new Date(tasks[0].dueDate || tasks[0].startDate);
    
    tasks.forEach(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate || task.startDate);
      
      if (taskStart < minDate) minDate = taskStart;
      if (taskEnd > maxDate) maxDate = taskEnd;
    });
    
    // Add padding to the date range
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);
    
    return { start: minDate, end: maxDate };
  };
  
  const dateRange = calculateDateRange();
  const [startDate, setStartDate] = useState<Date>(propStartDate || dateRange.start);
  const [endDate, setEndDate] = useState<Date>(propEndDate || dateRange.end);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = day, 2 = week, 3 = month
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [creatingDependency, setCreatingDependency] = useState<{
    fromTaskId: string;
    toTaskId: string | null;
  } | null>(null);
  
  // Calculate the number of days in the chart
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate cell width based on zoom level
  const getCellWidth = () => {
    switch (zoomLevel) {
      case 1: return 40; // Day view
      case 2: return 20; // Week view
      case 3: return 10; // Month view
      default: return 40;
    }
  };
  
  const cellWidth = getCellWidth();
  const rowHeight = 40;
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (zoomLevel > 1) {
      setZoomLevel(zoomLevel - 1);
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (zoomLevel < 3) {
      setZoomLevel(zoomLevel + 1);
    }
  };
  
  // Handle go to today
  const handleGoToToday = () => {
    const today = new Date();
    const dayWidth = cellWidth;
    const daysFromStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const scrollTo = daysFromStart * dayWidth;
    
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollTo - (containerRef.current.clientWidth / 2);
    }
  };
  
  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollLeft);
  };
  
  // Handle task drag
  const handleTaskDragStart = (taskId: string) => {
    setDraggingTask(taskId);
  };
  
  // Handle task drag end
  const handleTaskDragEnd = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    setDraggingTask(null);
    
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask && onTaskUpdate) {
      onTaskUpdate({
        ...updatedTask,
        startDate: newStartDate.toISOString(),
        dueDate: newEndDate.toISOString()
      });
    }
  };
  
  // Handle dependency creation start
  const handleDependencyStart = (taskId: string) => {
    setCreatingDependency({
      fromTaskId: taskId,
      toTaskId: null
    });
  };
  
  // Handle dependency creation end
  const handleDependencyEnd = (taskId: string) => {
    if (creatingDependency && creatingDependency.fromTaskId !== taskId) {
      setCreatingDependency({
        ...creatingDependency,
        toTaskId: taskId
      });
      
      if (onDependencyCreate) {
        onDependencyCreate({
          id: `dep-${creatingDependency.fromTaskId}-${taskId}`,
          fromTaskId: creatingDependency.fromTaskId,
          toTaskId: taskId,
          type: 'finish-to-start' // Default type
        });
      }
    }
    
    setCreatingDependency(null);
  };
  
  // Handle dependency delete
  const handleDependencyDelete = (dependencyId: string) => {
    if (onDependencyDelete) {
      onDependencyDelete(dependencyId);
    }
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6">Project Timeline</Typography>
        <Box>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoomLevel === 1}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoomLevel === 3}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Go to Today">
            <IconButton onClick={handleGoToToday}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          height: 'calc(100% - 48px)',
          overflow: 'auto'
        }}
        onScroll={handleScroll}
      >
        <Box sx={{ 
          width: '200px', 
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}>
          <Box sx={{ height: '60px', p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2">Task Name</Typography>
          </Box>
          <Box>
            {tasks.map((task, index) => (
              <Box 
                key={task.id} 
                sx={{ 
                  height: `${rowHeight}px`, 
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: index % 2 === 0 ? 'background.default' : 'background.paper'
                }}
              >
                <Typography 
                  variant="body2" 
                  noWrap 
                  title={task.title}
                  sx={{ 
                    fontWeight: task.priority === 'high' ? 'bold' : 'normal',
                    color: task.status === 'done' ? 'text.disabled' : 'text.primary'
                  }}
                >
                  {task.title}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <GanttHeader 
            startDate={startDate} 
            dayCount={dayCount} 
            cellWidth={cellWidth} 
            zoomLevel={zoomLevel}
          />
          
          <Box sx={{ position: 'relative' }}>
            <GanttGrid 
              dayCount={dayCount} 
              taskCount={tasks.length} 
              cellWidth={cellWidth} 
              rowHeight={rowHeight}
            />
            
            {tasks.map((task, index) => (
              <GanttTask 
                key={task.id}
                task={task}
                index={index}
                startDate={startDate}
                cellWidth={cellWidth}
                rowHeight={rowHeight}
                onDragStart={handleTaskDragStart}
                onDragEnd={handleTaskDragEnd}
                onDependencyStart={handleDependencyStart}
                onDependencyEnd={handleDependencyEnd}
              />
            ))}
            
            {dependencies.map(dependency => (
              <GanttDependency 
                key={dependency.id}
                dependency={dependency}
                tasks={tasks}
                startDate={startDate}
                cellWidth={cellWidth}
                rowHeight={rowHeight}
                onDelete={handleDependencyDelete}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default GanttChart;

