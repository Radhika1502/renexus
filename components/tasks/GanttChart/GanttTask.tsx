import React, { useState, useRef } from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { Task } from '../../../types/task';

interface GanttTaskProps {
  task: Task;
  index: number;
  startDate: Date;
  cellWidth: number;
  rowHeight: number;
  onDragStart: (taskId: string) => void;
  onDragEnd: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onDependencyStart: (taskId: string) => void;
  onDependencyEnd: (taskId: string) => void;
}

/**
 * GanttTask Component
 * 
 * Displays a single task bar in the Gantt chart
 */
const GanttTask: React.FC<GanttTaskProps> = ({
  task,
  index,
  startDate,
  cellWidth,
  rowHeight,
  onDragStart,
  onDragEnd,
  onDependencyStart,
  onDependencyEnd
}) => {
  const theme = useTheme();
  const taskRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [resizing, setResizing] = useState<'start' | 'end' | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  
  // Calculate task position and width
  const taskStartDate = new Date(task.startDate);
  const taskEndDate = new Date(task.dueDate || task.startDate);
  
  const diffDaysStart = Math.floor((taskStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const diffDaysEnd = Math.floor((taskEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const taskLeft = diffDaysStart * cellWidth;
  const taskWidth = (diffDaysEnd - diffDaysStart + 1) * cellWidth;
  
  // Get task color based on status and priority
  const getTaskColor = () => {
    switch (task.status) {
      case 'done':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.primary.main;
      case 'blocked':
        return theme.palette.error.main;
      default:
        return task.priority === 'high' 
          ? theme.palette.warning.main 
          : theme.palette.info.main;
    }
  };
  
  // Get task background color
  const getTaskBackgroundColor = () => {
    const baseColor = getTaskColor();
    return `${baseColor}40`; // 25% opacity
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = taskRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const offsetX = e.clientX - rect.left;
    
    // Check if clicking near edges for resizing
    const resizeMargin = 10;
    if (offsetX <= resizeMargin) {
      setResizing('start');
    } else if (offsetX >= rect.width - resizeMargin) {
      setResizing('end');
    } else {
      setIsDragging(true);
      setDragOffset(offsetX);
      onDragStart(task.id);
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse move for dragging or resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (!taskRef.current) return;
    
    if (isDragging) {
      const newLeft = e.clientX - dragOffset;
      setLeft(newLeft);
    } else if (resizing) {
      const rect = taskRef.current.getBoundingClientRect();
      
      if (resizing === 'start') {
        const newLeft = e.clientX;
        const newWidth = rect.right - newLeft;
        
        if (newWidth > cellWidth) {
          setLeft(newLeft);
          setWidth(newWidth);
        }
      } else if (resizing === 'end') {
        const newWidth = e.clientX - rect.left;
        
        if (newWidth > cellWidth) {
          setWidth(newWidth);
        }
      }
    }
  };
  
  // Handle mouse up to end dragging or resizing
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    if (isDragging || resizing) {
      // Calculate new dates based on position
      const currentLeft = left !== null ? left : taskLeft;
      const currentWidth = width !== null ? width : taskWidth;
      
      const dayDiff = Math.round(currentLeft / cellWidth);
      const dayCount = Math.round(currentWidth / cellWidth);
      
      const newStartDate = new Date(startDate);
      newStartDate.setDate(newStartDate.getDate() + dayDiff);
      
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + dayCount - 1);
      
      onDragEnd(task.id, newStartDate, newEndDate);
    }
    
    setIsDragging(false);
    setResizing(null);
    setWidth(null);
    setLeft(null);
  };
  
  // Handle dependency creation
  const handleDependencyStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDependencyStart(task.id);
  };
  
  const handleDependencyEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDependencyEnd(task.id);
  };
  
  // Format date for tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${left !== null ? left : taskLeft}px`,
        top: `${index * rowHeight + 5}px`,
        width: `${width !== null ? width : taskWidth}px`,
        height: `${rowHeight - 10}px`,
        backgroundColor: getTaskBackgroundColor(),
        border: `2px solid ${getTaskColor()}`,
        borderRadius: '4px',
        zIndex: isDragging || resizing ? 100 : 10,
        cursor: isDragging ? 'grabbing' : resizing ? 'ew-resize' : 'grab',
        userSelect: 'none',
        transition: isDragging || resizing ? 'none' : 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }
      }}
      ref={taskRef}
      onMouseDown={handleMouseDown}
    >
      <Tooltip
        title={
          <React.Fragment>
            <Typography variant="subtitle2">{task.title}</Typography>
            <Typography variant="body2">Status: {task.status}</Typography>
            <Typography variant="body2">Priority: {task.priority}</Typography>
            <Typography variant="body2">
              {formatDate(taskStartDate)} - {formatDate(taskEndDate)}
            </Typography>
          </React.Fragment>
        }
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            width: '100%',
            px: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: task.priority === 'high' ? 'bold' : 'normal',
              color: theme.palette.getContrastText(getTaskBackgroundColor()),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {task.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {task.status === 'done' && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.success.main,
                  mr: 0.5
                }}
              />
            )}
            
            {task.priority === 'high' && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.warning.main
                }}
              />
            )}
          </Box>
        </Box>
      </Tooltip>
      
      {/* Dependency handle - start */}
      <Box
        sx={{
          position: 'absolute',
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${getTaskColor()}`,
          cursor: 'pointer',
          zIndex: 20
        }}
        onClick={handleDependencyEnd}
      />
      
      {/* Dependency handle - end */}
      <Box
        sx={{
          position: 'absolute',
          right: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: theme.palette.background.paper,
          border: `2px solid ${getTaskColor()}`,
          cursor: 'pointer',
          zIndex: 20
        }}
        onClick={handleDependencyStart}
      />
      
      {/* Progress indicator */}
      {task.progress !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            width: `${task.progress}%`,
            backgroundColor: getTaskColor(),
            borderRadius: '0 0 0 4px'
          }}
        />
      )}
    </Box>
  );
};

export default GanttTask;
