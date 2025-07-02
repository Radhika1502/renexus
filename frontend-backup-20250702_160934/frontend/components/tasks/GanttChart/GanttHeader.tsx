import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface GanttHeaderProps {
  startDate: Date;
  dayCount: number;
  cellWidth: number;
  zoomLevel: number;
}

/**
 * GanttHeader Component
 * 
 * Displays the date headers for the Gantt chart
 */
const GanttHeader: React.FC<GanttHeaderProps> = ({
  startDate,
  dayCount,
  cellWidth,
  zoomLevel
}) => {
  const theme = useTheme();
  
  // Format date for display
  const formatDate = (date: Date, format: 'day' | 'month' | 'weekday' | 'full'): string => {
    switch (format) {
      case 'day':
        return date.getDate().toString();
      case 'month':
        return date.toLocaleString('default', { month: 'short' });
      case 'weekday':
        return date.toLocaleString('default', { weekday: 'short' });
      case 'full':
        return date.toLocaleDateString();
      default:
        return '';
    }
  };
  
  // Generate days array
  const generateDays = (): Date[] => {
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < dayCount; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };
  
  // Generate months array with start index and day count
  const generateMonths = (): { month: string; startIndex: number; dayCount: number }[] => {
    const days = generateDays();
    const months: { month: string; startIndex: number; dayCount: number }[] = [];
    
    let currentMonth = '';
    let startIndex = 0;
    let dayCount = 0;
    
    days.forEach((day, index) => {
      const month = formatDate(day, 'month') + ' ' + day.getFullYear();
      
      if (month !== currentMonth) {
        if (currentMonth !== '') {
          months.push({ month: currentMonth, startIndex, dayCount });
        }
        
        currentMonth = month;
        startIndex = index;
        dayCount = 1;
      } else {
        dayCount++;
      }
    });
    
    // Add the last month
    if (currentMonth !== '') {
      months.push({ month: currentMonth, startIndex, dayCount });
    }
    
    return months;
  };
  
  // Generate weeks array with start index and day count
  const generateWeeks = (): { week: string; startIndex: number; dayCount: number }[] => {
    const days = generateDays();
    const weeks: { week: string; startIndex: number; dayCount: number }[] = [];
    
    let currentWeek = '';
    let startIndex = 0;
    let dayCount = 0;
    
    days.forEach((day, index) => {
      // Get week number
      const weekNum = getWeekNumber(day);
      const week = `Week ${weekNum}`;
      
      if (week !== currentWeek) {
        if (currentWeek !== '') {
          weeks.push({ week: currentWeek, startIndex, dayCount });
        }
        
        currentWeek = week;
        startIndex = index;
        dayCount = 1;
      } else {
        dayCount++;
      }
    });
    
    // Add the last week
    if (currentWeek !== '') {
      weeks.push({ week: currentWeek, startIndex, dayCount });
    }
    
    return weeks;
  };
  
  // Get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  
  const days = generateDays();
  const months = generateMonths();
  const weeks = generateWeeks();
  
  return (
    <Box sx={{ 
      height: '60px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 2,
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`
    }}>
      {/* Month row */}
      <Box sx={{ 
        display: 'flex', 
        height: '30px', 
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        {zoomLevel <= 2 && months.map((month, index) => (
          <Box 
            key={`month-${index}`} 
            sx={{ 
              width: `${month.dayCount * cellWidth}px`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: index < months.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent'
            }}
          >
            <Typography variant="caption" noWrap>
              {month.month}
            </Typography>
          </Box>
        ))}
        
        {zoomLevel === 3 && weeks.map((week, index) => (
          <Box 
            key={`week-${index}`} 
            sx={{ 
              width: `${week.dayCount * cellWidth}px`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: index < weeks.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent'
            }}
          >
            <Typography variant="caption" noWrap>
              {week.week}
            </Typography>
          </Box>
        ))}
      </Box>
      
      {/* Day row */}
      <Box sx={{ display: 'flex', height: '30px' }}>
        {days.map((day, index) => {
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isToday = new Date().toDateString() === day.toDateString();
          
          return (
            <Box 
              key={`day-${index}`} 
              sx={{ 
                width: `${cellWidth}px`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: `1px solid ${theme.palette.divider}`,
                backgroundColor: isWeekend 
                  ? theme.palette.action.hover 
                  : isToday 
                  ? theme.palette.primary.light + '20' 
                  : 'transparent',
                color: isToday ? theme.palette.primary.main : 'inherit'
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
                {formatDate(day, 'day')}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {formatDate(day, 'weekday')}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default GanttHeader;
