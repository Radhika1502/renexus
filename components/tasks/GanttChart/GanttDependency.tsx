import React from 'react';
import { Box, IconButton, Tooltip, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Task, TaskDependency } from '../../../types/task';

interface GanttDependencyProps {
  dependency: TaskDependency;
  tasks: Task[];
  startDate: Date;
  cellWidth: number;
  rowHeight: number;
  onDelete: (dependencyId: string) => void;
}

/**
 * GanttDependency Component
 * 
 * Displays a dependency arrow between two tasks
 */
const GanttDependency: React.FC<GanttDependencyProps> = ({
  dependency,
  tasks,
  startDate,
  cellWidth,
  rowHeight,
  onDelete
}) => {
  const theme = useTheme();
  
  // Find the source and target tasks
  const fromTask = tasks.find(task => task.id === dependency.fromTaskId);
  const toTask = tasks.find(task => task.id === dependency.toTaskId);
  
  if (!fromTask || !toTask) {
    return null;
  }
  
  // Get task indices
  const fromTaskIndex = tasks.findIndex(task => task.id === dependency.fromTaskId);
  const toTaskIndex = tasks.findIndex(task => task.id === dependency.toTaskId);
  
  // Calculate positions
  const fromTaskStartDate = new Date(fromTask.startDate);
  const fromTaskEndDate = new Date(fromTask.dueDate || fromTask.startDate);
  const toTaskStartDate = new Date(toTask.startDate);
  
  const fromDiffDaysStart = Math.floor((fromTaskStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const fromDiffDaysEnd = Math.floor((fromTaskEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const toDiffDaysStart = Math.floor((toTaskStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const fromTaskLeft = fromDiffDaysStart * cellWidth;
  const fromTaskRight = (fromDiffDaysEnd + 1) * cellWidth;
  const toTaskLeft = toDiffDaysStart * cellWidth;
  
  const fromY = fromTaskIndex * rowHeight + rowHeight / 2;
  const toY = toTaskIndex * rowHeight + rowHeight / 2;
  
  // Determine arrow path based on dependency type
  const getArrowPath = () => {
    switch (dependency.type) {
      case 'finish-to-start':
        return drawFinishToStart();
      case 'start-to-start':
        return drawStartToStart();
      case 'finish-to-finish':
        return drawFinishToFinish();
      case 'start-to-finish':
        return drawStartToFinish();
      default:
        return drawFinishToStart();
    }
  };
  
  // Draw finish-to-start arrow (most common)
  const drawFinishToStart = () => {
    const startX = fromTaskRight;
    const endX = toTaskLeft;
    const midX = (startX + endX) / 2;
    
    // If tasks are on the same row, need to add some vertical space
    if (fromTaskIndex === toTaskIndex) {
      const offset = 20;
      return `
        M ${startX},${fromY}
        C ${startX + offset},${fromY} ${startX + offset},${fromY + offset} ${midX},${fromY + offset}
        C ${endX - offset},${fromY + offset} ${endX - offset},${fromY} ${endX},${fromY}
      `;
    }
    
    // If target is above source
    if (toTaskIndex < fromTaskIndex) {
      return `
        M ${startX},${fromY}
        L ${midX},${fromY}
        L ${midX},${toY}
        L ${endX},${toY}
      `;
    }
    
    // If target is below source
    return `
      M ${startX},${fromY}
      L ${midX},${fromY}
      L ${midX},${toY}
      L ${endX},${toY}
    `;
  };
  
  // Draw start-to-start arrow
  const drawStartToStart = () => {
    const startX = fromTaskLeft;
    const endX = toTaskLeft;
    const midX = Math.min(startX, endX) - 20;
    
    // If tasks are on the same row, need to add some vertical space
    if (fromTaskIndex === toTaskIndex) {
      const offset = 20;
      return `
        M ${startX},${fromY}
        C ${startX - offset},${fromY} ${startX - offset},${fromY + offset} ${midX},${fromY + offset}
        C ${endX - offset},${fromY + offset} ${endX - offset},${fromY} ${endX},${fromY}
      `;
    }
    
    // If target is above source
    if (toTaskIndex < fromTaskIndex) {
      return `
        M ${startX},${fromY}
        L ${midX},${fromY}
        L ${midX},${toY}
        L ${endX},${toY}
      `;
    }
    
    // If target is below source
    return `
      M ${startX},${fromY}
      L ${midX},${fromY}
      L ${midX},${toY}
      L ${endX},${toY}
    `;
  };
  
  // Draw finish-to-finish arrow
  const drawFinishToFinish = () => {
    const startX = fromTaskRight;
    const endX = toTaskRight;
    const midX = Math.max(startX, endX) + 20;
    
    // If tasks are on the same row, need to add some vertical space
    if (fromTaskIndex === toTaskIndex) {
      const offset = 20;
      return `
        M ${startX},${fromY}
        C ${startX + offset},${fromY} ${startX + offset},${fromY + offset} ${midX},${fromY + offset}
        C ${endX + offset},${fromY + offset} ${endX + offset},${fromY} ${endX},${fromY}
      `;
    }
    
    // If target is above source
    if (toTaskIndex < fromTaskIndex) {
      return `
        M ${startX},${fromY}
        L ${midX},${fromY}
        L ${midX},${toY}
        L ${endX},${toY}
      `;
    }
    
    // If target is below source
    return `
      M ${startX},${fromY}
      L ${midX},${fromY}
      L ${midX},${toY}
      L ${endX},${toY}
    `;
  };
  
  // Draw start-to-finish arrow
  const drawStartToFinish = () => {
    const startX = fromTaskLeft;
    const endX = toTaskRight;
    const midX = (startX + endX) / 2;
    
    // If tasks are on the same row, need to add some vertical space
    if (fromTaskIndex === toTaskIndex) {
      const offset = 20;
      return `
        M ${startX},${fromY}
        C ${startX - offset},${fromY} ${startX - offset},${fromY + offset} ${midX},${fromY + offset}
        C ${endX + offset},${fromY + offset} ${endX + offset},${fromY} ${endX},${fromY}
      `;
    }
    
    // If target is above source
    if (toTaskIndex < fromTaskIndex) {
      return `
        M ${startX},${fromY}
        L ${midX},${fromY}
        L ${midX},${toY}
        L ${endX},${toY}
      `;
    }
    
    // If target is below source
    return `
      M ${startX},${fromY}
      L ${midX},${fromY}
      L ${midX},${toY}
      L ${endX},${toY}
    `;
  };
  
  // Calculate arrow head points
  const getArrowHeadPoints = () => {
    let endX, endY;
    
    switch (dependency.type) {
      case 'finish-to-start':
        endX = toTaskLeft;
        endY = toY;
        break;
      case 'start-to-start':
        endX = toTaskLeft;
        endY = toY;
        break;
      case 'finish-to-finish':
        endX = toTaskRight;
        endY = toY;
        break;
      case 'start-to-finish':
        endX = toTaskRight;
        endY = toY;
        break;
      default:
        endX = toTaskLeft;
        endY = toY;
    }
    
    // Determine direction of arrow
    let dx = 0;
    
    if (dependency.type === 'finish-to-start' || dependency.type === 'start-to-start') {
      dx = -1; // Arrow pointing left
    } else {
      dx = 1; // Arrow pointing right
    }
    
    const arrowSize = 5;
    
    return `${endX},${endY} ${endX - arrowSize * dx},${endY - arrowSize} ${endX - arrowSize * dx},${endY + arrowSize}`;
  };
  
  // Handle delete click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(dependency.id);
  };
  
  // Get dependency type label
  const getDependencyTypeLabel = () => {
    switch (dependency.type) {
      case 'finish-to-start':
        return 'Finish to Start';
      case 'start-to-start':
        return 'Start to Start';
      case 'finish-to-finish':
        return 'Finish to Finish';
      case 'start-to-finish':
        return 'Start to Finish';
      default:
        return 'Dependency';
    }
  };
  
  // Calculate control point for delete button
  const getControlPoint = () => {
    const path = getArrowPath();
    const pathLength = path.length;
    
    // Extract middle point from path string (very simplified)
    const midIndex = Math.floor(pathLength / 2);
    let startIndex = path.indexOf('L', midIndex);
    if (startIndex === -1) startIndex = path.indexOf('C', midIndex);
    if (startIndex === -1) return { x: 0, y: 0 };
    
    const endIndex = path.indexOf(',', startIndex);
    if (endIndex === -1) return { x: 0, y: 0 };
    
    const x = parseFloat(path.substring(startIndex + 1, endIndex).trim());
    
    const yStartIndex = endIndex + 1;
    const yEndIndex = path.indexOf(' ', yStartIndex);
    if (yEndIndex === -1) return { x, y: 0 };
    
    const y = parseFloat(path.substring(yStartIndex, yEndIndex).trim());
    
    return { x, y };
  };
  
  const controlPoint = getControlPoint();
  
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
        <defs>
          <marker
            id={`arrowhead-${dependency.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon 
              points="0 0, 10 3.5, 0 7" 
              fill={theme.palette.text.secondary} 
            />
          </marker>
        </defs>
        <path
          d={getArrowPath()}
          stroke={theme.palette.text.secondary}
          strokeWidth="2"
          fill="none"
          markerEnd={`url(#arrowhead-${dependency.id})`}
        />
      </svg>
      
      <Tooltip title={`${getDependencyTypeLabel()}: ${fromTask.title} → ${toTask.title}`}>
        <Box
          sx={{
            position: 'absolute',
            top: controlPoint.y - 10,
            left: controlPoint.x - 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
          onClick={handleDeleteClick}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default GanttDependency;
