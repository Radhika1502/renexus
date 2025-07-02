import React from 'react';
import { Box, useTheme } from '@mui/material';

interface GanttGridProps {
  dayCount: number;
  taskCount: number;
  cellWidth: number;
  rowHeight: number;
}

/**
 * GanttGrid Component
 * 
 * Displays the grid lines for the Gantt chart
 */
const GanttGrid: React.FC<GanttGridProps> = ({
  dayCount,
  taskCount,
  cellWidth,
  rowHeight
}) => {
  const theme = useTheme();
  
  // Generate vertical grid lines
  const renderVerticalLines = () => {
    const lines = [];
    
    for (let i = 0; i <= dayCount; i++) {
      lines.push(
        <Box
          key={`vline-${i}`}
          sx={{
            position: 'absolute',
            left: `${i * cellWidth}px`,
            top: 0,
            height: `${taskCount * rowHeight}px`,
            width: '1px',
            backgroundColor: theme.palette.divider,
            zIndex: 1
          }}
        />
      );
    }
    
    return lines;
  };
  
  // Generate horizontal grid lines
  const renderHorizontalLines = () => {
    const lines = [];
    
    for (let i = 0; i <= taskCount; i++) {
      lines.push(
        <Box
          key={`hline-${i}`}
          sx={{
            position: 'absolute',
            left: 0,
            top: `${i * rowHeight}px`,
            height: '1px',
            width: `${dayCount * cellWidth}px`,
            backgroundColor: theme.palette.divider,
            zIndex: 1
          }}
        />
      );
    }
    
    return lines;
  };
  
  // Generate today marker
  const renderTodayMarker = () => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Assuming startDate is 7 days ago
    
    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= dayCount) {
      return (
        <Box
          sx={{
            position: 'absolute',
            left: `${diffDays * cellWidth}px`,
            top: 0,
            height: `${taskCount * rowHeight}px`,
            width: '2px',
            backgroundColor: theme.palette.primary.main,
            zIndex: 2
          }}
        />
      );
    }
    
    return null;
  };
  
  // Generate weekend highlights
  const renderWeekendHighlights = () => {
    const highlights = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Assuming startDate is 7 days ago
    
    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      
      if (isWeekend) {
        highlights.push(
          <Box
            key={`weekend-${i}`}
            sx={{
              position: 'absolute',
              left: `${i * cellWidth}px`,
              top: 0,
              height: `${taskCount * rowHeight}px`,
              width: `${cellWidth}px`,
              backgroundColor: theme.palette.action.hover,
              zIndex: 0
            }}
          />
        );
      }
    }
    
    return highlights;
  };
  
  return (
    <Box sx={{ position: 'relative', height: `${taskCount * rowHeight}px`, width: `${dayCount * cellWidth}px` }}>
      {renderWeekendHighlights()}
      {renderVerticalLines()}
      {renderHorizontalLines()}
      {renderTodayMarker()}
    </Box>
  );
};

export default GanttGrid;
