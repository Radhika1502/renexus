import { useQuery } from '@tanstack/react-query';

interface TaskCompletion {
  total: number;
  completed: number;
}

interface TimeTracking {
  estimated: number;
  actual: number;
}

interface TaskStatusCount {
  status: string;
  count: number;
}

interface BurndownDataPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface TeamMemberPerformance {
  userId: string;
  name: string;
  avatar?: string;
  tasksCompleted: number;
}

interface PriorityDistribution {
  priority: string;
  count: number;
}

interface ProjectAnalytics {
  taskCompletion: TaskCompletion;
  timeTracking: TimeTracking;
  tasksByStatus: TaskStatusCount[];
  burndown: BurndownDataPoint[];
  teamPerformance: TeamMemberPerformance[];
  priorityDistribution: PriorityDistribution[];
}

// This would be replaced with an actual API call in production
const fetchProjectAnalytics = async (
  projectId: string,
  timeRange: 'week' | 'month' | 'quarter' | 'year'
): Promise<ProjectAnalytics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock data based on projectId and timeRange
  const seed = projectId.charCodeAt(0) + (timeRange === 'week' ? 1 : timeRange === 'month' ? 2 : timeRange === 'quarter' ? 3 : 4);
  
  // Task completion data
  const totalTasks = 20 + (seed % 30);
  const completedTasks = Math.floor(totalTasks * (0.3 + (seed % 50) / 100));
  
  // Time tracking data
  const estimatedHours = 40 + (seed % 60);
  const actualHours = estimatedHours * (0.8 + (seed % 40) / 100);
  
  // Tasks by status
  const todoCount = totalTasks - completedTasks - Math.floor((seed % 10) + 3);
  const inProgressCount = Math.floor((seed % 8) + 2);
  const reviewCount = Math.floor((seed % 5) + 1);
  
  // Generate burndown data
  const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
  const burndownData: BurndownDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const initialTasks = totalTasks + completedTasks;
  const idealBurnRate = initialTasks / days;
  
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    // Ideal burndown is a straight line from start to end
    const ideal = Math.max(0, initialTasks - (idealBurnRate * i));
    
    // Actual remaining follows a more realistic pattern
    let remaining = initialTasks;
    if (i > 0) {
      // First third: slow progress
      if (i < days / 3) {
        remaining = initialTasks - (initialTasks * 0.1 * (i / (days / 3)));
      } 
      // Middle third: faster progress
      else if (i < 2 * (days / 3)) {
        remaining = initialTasks * 0.9 - (initialTasks * 0.5 * ((i - days / 3) / (days / 3)));
      } 
      // Final third: slowing down again
      else {
        remaining = initialTasks * 0.4 - (initialTasks * 0.4 * ((i - 2 * (days / 3)) / (days / 3)));
      }
      
      // Add some noise
      const noise = (Math.sin(i * seed) * initialTasks * 0.05);
      remaining = Math.max(0, remaining + noise);
    }
    
    burndownData.push({
      date: currentDate.toISOString(),
      remaining: Math.round(remaining),
      ideal: Math.round(ideal),
    });
  }
  
  // Team performance data
  const teamPerformance: TeamMemberPerformance[] = [
    {
      userId: '1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john',
      tasksCompleted: Math.floor((seed % 10) + 5),
    },
    {
      userId: '2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=jane',
      tasksCompleted: Math.floor((seed % 8) + 3),
    },
    {
      userId: '3',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=alex',
      tasksCompleted: Math.floor((seed % 7) + 2),
    },
    {
      userId: '4',
      name: 'Sarah Williams',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      tasksCompleted: Math.floor((seed % 6) + 1),
    },
  ];
  
  // Priority distribution
  const priorityDistribution: PriorityDistribution[] = [
    {
      priority: 'high',
      count: Math.floor((seed % 10) + 3),
    },
    {
      priority: 'medium',
      count: Math.floor((seed % 15) + 5),
    },
    {
      priority: 'low',
      count: Math.floor((seed % 12) + 4),
    },
  ];
  
  return {
    taskCompletion: {
      total: totalTasks,
      completed: completedTasks,
    },
    timeTracking: {
      estimated: estimatedHours,
      actual: Math.round(actualHours),
    },
    tasksByStatus: [
      { status: 'todo', count: todoCount },
      { status: 'in-progress', count: inProgressCount },
      { status: 'review', count: reviewCount },
      { status: 'done', count: completedTasks },
    ],
    burndown: burndownData,
    teamPerformance,
    priorityDistribution,
  };
};

export const useProjectAnalytics = (
  projectId: string,
  timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
) => {
  return useQuery(
    ['projectAnalytics', projectId, timeRange],
    () => fetchProjectAnalytics(projectId, timeRange),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );
};

export default useProjectAnalytics;
