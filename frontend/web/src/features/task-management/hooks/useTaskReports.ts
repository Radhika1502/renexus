import { useQuery } from 'react-query';
import { useTaskApi } from './useTaskApi';
import { useOfflineSync } from './useOfflineSync';

interface TaskReportParams {
  projectId?: string;
  reportType: 'status' | 'priority' | 'timeline' | 'velocity' | 'burndown';
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
}

export const useTaskReports = (params: TaskReportParams) => {
  const taskApi = useTaskApi();
  const { isOnline, getCachedData } = useOfflineSync();
  
  return useQuery(
    ['taskReports', params],
    async () => {
      if (isOnline) {
        try {
          // Call the real API when online
          return await taskApi.getTaskReports(params);
        } catch (error) {
          console.error('Error fetching task reports:', error);
          // Fall back to cached data if API call fails
          return getCachedReportData(params);
        }
      } else {
        // Use cached data when offline
        return getCachedReportData(params);
      }
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );
  
  // Helper function to get cached report data when offline
  function getCachedReportData(params: TaskReportParams) {
    const cachedTasks = getCachedData('tasks') || [];
    
    // Generate mock report data based on cached tasks
    switch (params.reportType) {
      case 'status':
        return generateStatusReport(cachedTasks, params);
      case 'priority':
        return generatePriorityReport(cachedTasks, params);
      case 'timeline':
        return generateTimelineReport(cachedTasks, params);
      case 'velocity':
        return generateVelocityReport(cachedTasks, params);
      case 'burndown':
        return generateBurndownReport(cachedTasks, params);
      default:
        return [];
    }
  }
};

// Helper functions to generate reports from cached tasks
function generateStatusReport(tasks: any[], params: TaskReportParams) {
  const filteredTasks = filterTasksByDateRange(tasks, params.startDate, params.endDate);
  
  // Group tasks by status
  const statusCounts = filteredTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    tasks: count,
    percentage: Math.round((count / filteredTasks.length) * 100) || 0
  }));
}

function generatePriorityReport(tasks: any[], params: TaskReportParams) {
  const filteredTasks = filterTasksByDateRange(tasks, params.startDate, params.endDate);
  
  // Group tasks by priority
  const priorityCounts = filteredTasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(priorityCounts).map(([priority, count]) => ({
    name: priority,
    tasks: count,
    percentage: Math.round((count / filteredTasks.length) * 100) || 0
  }));
}

function generateTimelineReport(tasks: any[], params: TaskReportParams) {
  const filteredTasks = filterTasksByDateRange(tasks, params.startDate, params.endDate);
  const datePoints = generateDatePoints(params.startDate, params.endDate, params.groupBy);
  
  return datePoints.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const nextDate = getNextDate(date, params.groupBy);
    
    const created = filteredTasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate >= date && createdDate < nextDate;
    }).length;
    
    const completed = filteredTasks.filter(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : null;
      return completedDate && completedDate >= date && completedDate < nextDate;
    }).length;
    
    return {
      date: dateStr,
      created,
      completed
    };
  });
}

function generateVelocityReport(tasks: any[], params: TaskReportParams) {
  const filteredTasks = filterTasksByDateRange(tasks, params.startDate, params.endDate);
  const datePoints = generateDatePoints(params.startDate, params.endDate, params.groupBy);
  
  return datePoints.map(date => {
    const dateStr = formatPeriod(date, params.groupBy);
    const nextDate = getNextDate(date, params.groupBy);
    
    const completedTasks = filteredTasks.filter(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : null;
      return completedDate && completedDate >= date && completedDate < nextDate;
    });
    
    const points = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
    
    return {
      period: dateStr,
      completed: completedTasks.length,
      points
    };
  });
}

function generateBurndownReport(tasks: any[], params: TaskReportParams) {
  const filteredTasks = filterTasksByDateRange(tasks, params.startDate, params.endDate);
  const datePoints = generateDatePoints(params.startDate, params.endDate, params.groupBy);
  
  // Calculate total points at start
  const totalPoints = filteredTasks.reduce((sum, task) => sum + (task.points || 1), 0);
  const totalTasks = filteredTasks.length;
  
  // Calculate ideal burndown (straight line from start to end)
  const numPeriods = datePoints.length;
  const idealDecrement = totalPoints / numPeriods;
  
  let remainingPoints = totalPoints;
  
  return datePoints.map((date, index) => {
    const dateStr = date.toISOString().split('T')[0];
    const nextDate = getNextDate(date, params.groupBy);
    
    // Calculate completed points in this period
    const completedTasksInPeriod = filteredTasks.filter(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : null;
      return completedDate && completedDate >= date && completedDate < nextDate;
    });
    
    const pointsCompletedInPeriod = completedTasksInPeriod.reduce((sum, task) => 
      sum + (task.points || 1), 0);
    
    remainingPoints -= pointsCompletedInPeriod;
    
    return {
      date: dateStr,
      remaining: Math.max(0, remainingPoints),
      ideal: Math.max(0, totalPoints - (idealDecrement * index))
    };
  });
}

// Utility functions
function filterTasksByDateRange(tasks: any[], startDate: Date, endDate: Date) {
  return tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= startDate && taskDate <= endDate;
  });
}

function generateDatePoints(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month') {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = getNextDate(currentDate, groupBy);
  }
  
  return dates;
}

function getNextDate(date: Date, groupBy: 'day' | 'week' | 'month') {
  const nextDate = new Date(date);
  
  switch (groupBy) {
    case 'day':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'week':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'month':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
}

function formatPeriod(date: Date, groupBy: 'day' | 'week' | 'month') {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  switch (groupBy) {
    case 'day':
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    case 'week':
      return `Week ${getWeekNumber(date)}, ${year}`;
    case 'month':
      return `${getMonthName(month)} ${year}`;
    default:
      return '';
  }
}

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getMonthName(month: number) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}
