import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useQuery, useQueryClient } from 'react-query';

// Use local UI components instead of @renexus/ui-components
import { Card } from '../src/components/ui';

// Icons
import { ArrowPathIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

// TypeScript interfaces for dashboard data
interface DashboardSummary {
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  teamMembers: number;
  recentActivities: any[];
}

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  teamSize: number;
  dueDate: string;
}

interface TaskStatusSummary {
  status: string;
  count: number;
  percentage: number;
}

interface TeamPerformance {
  teamId: string;
  teamName: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  averageTaskCompletionTime: number;
  onTimeDeliveryRate: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  projectId: string;
  projectName: string;
  completed: boolean;
}

interface TimeRange {
  start: string;
  end: string;
}

// Dashboard service with typed return values
const dashboardService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => ({
    activeProjects: 5,
    completedProjects: 12,
    totalTasks: 48,
    completedTasks: 32,
    upcomingDeadlines: 3,
    teamMembers: 8,
    recentActivities: []
  }),
  getProjectSummaries: async (): Promise<ProjectSummary[]> => [
    { id: '1', name: 'Project Alpha', status: 'active', progress: 75, tasksTotal: 20, tasksCompleted: 15, teamSize: 4, dueDate: '2024-02-15' },
    { id: '2', name: 'Project Beta', status: 'active', progress: 45, tasksTotal: 15, tasksCompleted: 7, teamSize: 3, dueDate: '2024-03-01' },
    { id: '3', name: 'Project Gamma', status: 'active', progress: 90, tasksTotal: 25, tasksCompleted: 23, teamSize: 6, dueDate: '2024-01-30' }
  ],
  getTaskStatusSummary: async (): Promise<TaskStatusSummary[]> => [
    { status: 'Completed', count: 32, percentage: 67 },
    { status: 'In Progress', count: 10, percentage: 21 },
    { status: 'Pending', count: 6, percentage: 12 }
  ],
  getTeamPerformance: async (): Promise<TeamPerformance[]> => [
    { teamId: '1', teamName: 'Frontend Team', completedTasks: 15, totalTasks: 20, completionRate: 0.75, averageTaskCompletionTime: 24, onTimeDeliveryRate: 0.85 },
    { teamId: '2', teamName: 'Backend Team', completedTasks: 12, totalTasks: 18, completionRate: 0.67, averageTaskCompletionTime: 32, onTimeDeliveryRate: 0.72 },
    { teamId: '3', teamName: 'DevOps Team', completedTasks: 8, totalTasks: 10, completionRate: 0.80, averageTaskCompletionTime: 18, onTimeDeliveryRate: 0.90 }
  ],
  getTimelineEvents: async (): Promise<TimelineEvent[]> => [
    { id: '1', title: 'Sprint 1 End', description: 'Final sprint review and retrospective', date: '2024-01-15', type: 'SPRINT_END', projectId: '1', projectName: 'Project Alpha', completed: true },
    { id: '2', title: 'Beta Release', description: 'Beta version deployment to staging', date: '2024-01-20', type: 'MILESTONE', projectId: '2', projectName: 'Project Beta', completed: false },
    { id: '3', title: 'Project Gamma Deadline', description: 'Final delivery deadline', date: '2024-01-30', type: 'DEADLINE', projectId: '3', projectName: 'Project Gamma', completed: false },
    { id: '4', title: 'Sprint 2 Start', description: 'Next sprint planning meeting', date: '2024-02-01', type: 'SPRINT_START', projectId: '1', projectName: 'Project Alpha', completed: false }
  ]
};

// Define dashboard hooks with proper typing
const useDashboardSummary = () => {
  return useQuery<DashboardSummary>(
    'dashboard-summary',
    () => dashboardService.getDashboardSummary(),
    {
      staleTime: 60000, // 1 minute
      refetchInterval: 300000, // 5 minutes
    }
  );
};

const useProjectSummaries = (timeRange?: TimeRange) => {
  return useQuery<ProjectSummary[]>(
    ['project-summaries', timeRange],
    () => dashboardService.getProjectSummaries(),
    {
      staleTime: 60000,
      refetchInterval: 300000,
    }
  );
};

const useTaskStatusSummary = (projectId?: string, timeRange?: TimeRange) => {
  return useQuery<TaskStatusSummary[]>(
    ['task-status-summary', projectId, timeRange],
    () => dashboardService.getTaskStatusSummary(),
    {
      staleTime: 60000,
      refetchInterval: 300000,
    }
  );
};

const useTeamPerformance = (timeRange?: TimeRange) => {
  return useQuery<TeamPerformance[]>(
    ['team-performance', timeRange],
    () => dashboardService.getTeamPerformance(),
    {
      staleTime: 60000,
      refetchInterval: 300000,
    }
  );
};

const useTimelineEvents = (timeRange?: TimeRange) => {
  return useQuery<TimelineEvent[]>(
    ['timeline-events', timeRange],
    () => dashboardService.getTimelineEvents(),
    {
      staleTime: 60000,
      refetchInterval: 300000,
    }
  );
};

// Inline dashboard components with proper typing
const DashboardSummaryCard: React.FC<{ data: DashboardSummary; isLoading: boolean }> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex flex-col">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const summaryItems = [
    { label: 'Active Projects', value: data.activeProjects.toString(), color: 'text-blue-600' },
    { label: 'Completed Tasks', value: `${data.completedTasks}/${data.totalTasks}`, color: 'text-green-600' },
    { label: 'Upcoming Deadlines', value: data.upcomingDeadlines.toString(), color: 'text-yellow-600' },
    { label: 'Team Members', value: data.teamMembers.toString(), color: 'text-purple-600' },
    { label: 'Completed Projects', value: data.completedProjects.toString(), color: 'text-indigo-600' },
  ];

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryItems.map((item, index) => (
          <div key={index} className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ProjectProgressCard: React.FC<{ projects: ProjectSummary[]; isLoading: boolean }> = ({ projects, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Active Projects</h3>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{project.name}</h4>
              <span className="text-sm text-gray-500">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{project.tasksCompleted}/{project.tasksTotal} tasks</span>
              <span>{project.teamSize} members</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const TaskStatusChart: React.FC<{ data: TaskStatusSummary[]; isLoading: boolean }> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Task Status Distribution</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.status}</span>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const TeamPerformanceTable: React.FC<{ teams: TeamPerformance[]; isLoading: boolean }> = ({ teams, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teams.map((team) => (
              <tr key={team.teamId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.teamName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.round(team.completionRate * 100)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.completedTasks}/{team.totalTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.averageTaskCompletionTime}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const TimelineComponent: React.FC<{ events: TimelineEvent[]; isLoading: boolean }> = ({ events, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upcoming Timeline</h3>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-start space-x-3">
            <div className={`w-3 h-3 rounded-full mt-2 ${event.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <div className="flex-1">
              <h4 className="font-medium">{event.title}</h4>
              <p className="text-sm text-gray-600">{event.description}</p>
              <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()} - {event.projectName}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ActivityFeed: React.FC<{ limit?: number }> = ({ limit = 5 }) => {
  const activities = [
    { id: '1', action: 'Task completed', user: 'John Doe', time: '2 hours ago' },
    { id: '2', action: 'Project created', user: 'Jane Smith', time: '4 hours ago' },
    { id: '3', action: 'Sprint started', user: 'Bob Wilson', time: '1 day ago' },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.slice(0, limit).map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm">{activity.action}</p>
              <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default function Dashboard() {
  // State for time range filter
  const [timeRange, setTimeRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  // State for API connection status
  const [apiStatus, setApiStatus] = useState<string>('Checking connection...');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch dashboard data using the hooks
  const { 
    data: dashboardSummary, 
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary
  } = useDashboardSummary();
  
  const { 
    data: projectSummaries, 
    isLoading: isLoadingProjects,
    error: projectError,
    refetch: refetchProjects
  } = useProjectSummaries(timeRange);
  
  const { 
    data: taskStatusSummary, 
    isLoading: isLoadingTaskStatus,
    error: taskStatusError,
    refetch: refetchTaskStatus
  } = useTaskStatusSummary(undefined, timeRange);
  
  const { 
    data: teamPerformance, 
    isLoading: isLoadingTeamPerformance,
    error: teamPerformanceError,
    refetch: refetchTeamPerformance
  } = useTeamPerformance(timeRange);
  
  const { 
    data: timelineEvents, 
    isLoading: isLoadingTimeline,
    error: timelineError,
    refetch: refetchTimeline
  } = useTimelineEvents(timeRange);

  // Check backend API connection
  useEffect(() => {
    async function checkApiConnection() {
      try {
        setApiStatus('Connecting to backend...');
        await dashboardService.getDashboardSummary();
        setApiConnected(true);
        setApiStatus(`Connected to API`);
      } catch (err: any) {
        console.error('API connection error:', err);
        setApiConnected(false);
        setApiStatus(`Failed to connect to API: ${err?.message || 'Unknown error'}`);
      }
    }
    
    checkApiConnection();
  }, []);

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const today = new Date();
    let start = new Date();
    
    switch (value) {
      case 'last7days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    setTimeRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  const handleRefreshData = () => {
    refetchSummary();
    refetchProjects();
    refetchTaskStatus();
    refetchTeamPerformance();
    refetchTimeline();
    queryClient.invalidateQueries();
  };

  const getTimeRangeDisplayValue = () => {
    const startDate = new Date(timeRange.start);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'last7days';
    if (diffDays <= 30) return 'last30days';
    if (diffDays <= 90) return 'last90days';
    if (startDate.getFullYear() === today.getFullYear()) return 'thisYear';
    return 'last30days';
  };

  return (
    <>
      <Head>
        <title>Dashboard | Renexus Project Management</title>
        <meta name="description" content="Comprehensive project management dashboard with analytics, team performance, and insights" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Comprehensive overview of your projects, tasks, team performance, and analytics.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <CalendarDaysIcon className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={getTimeRangeDisplayValue()}
                  onChange={handleTimeRangeChange}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="last7days">Last 7 days</option>
                  <option value="last30days">Last 30 days</option>
                  <option value="last90days">Last 90 days</option>
                  <option value="thisYear">This year</option>
                </select>
              </div>
              
              <button
                onClick={handleRefreshData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
          
          {/* API Connection Status */}
          {!apiConnected && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-4 border border-yellow-200 dark:border-yellow-700/30 mb-6">
              <p className="text-yellow-800 dark:text-yellow-200">{apiStatus}</p>
            </div>
          )}
          
          {/* Dashboard Summary Card */}
          <div className="mb-8">
            <DashboardSummaryCard 
              data={dashboardSummary || {
                activeProjects: 0,
                completedProjects: 0,
                totalTasks: 0,
                completedTasks: 0,
                upcomingDeadlines: 0,
                teamMembers: 0,
                recentActivities: []
              }} 
              isLoading={isLoadingSummary} 
            />
          </div>
          
          {/* Project Progress and Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <ProjectProgressCard 
                projects={projectSummaries || []} 
                isLoading={isLoadingProjects} 
              />
            </div>
            <div>
              <ActivityFeed limit={5} />
            </div>
          </div>
          
          {/* Task Status and Team Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div>
              <TaskStatusChart 
                data={taskStatusSummary || []} 
                isLoading={isLoadingTaskStatus} 
              />
            </div>
            <div className="lg:col-span-2">
              <TeamPerformanceTable 
                teams={teamPerformance || []} 
                isLoading={isLoadingTeamPerformance} 
              />
            </div>
          </div>
          
          {/* Timeline Events */}
          <div className="mb-8">
            <TimelineComponent 
              events={timelineEvents || []} 
              isLoading={isLoadingTimeline} 
            />
          </div>

          {/* Error States */}
          {(summaryError || projectError || taskStatusError || teamPerformanceError || timelineError) && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-4 border border-red-200 dark:border-red-700/30 mb-6">
              <h4 className="text-red-800 dark:text-red-200 font-medium">Some data could not be loaded:</h4>
              <ul className="text-red-600 dark:text-red-300 mt-2 text-sm">
                {summaryError && <li>• Dashboard summary data</li>}
                {projectError && <li>• Project progress data</li>}
                {taskStatusError && <li>• Task status data</li>}
                {teamPerformanceError && <li>• Team performance data</li>}
                {timelineError && <li>• Timeline events</li>}
              </ul>
              <button
                onClick={handleRefreshData}
                className="mt-3 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
        
        {/* API Connection Status Indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-md shadow-lg text-sm flex items-center ${
            apiConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
              : apiConnected === false 
              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
          }`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              apiConnected ? 'bg-green-500' : apiConnected === false ? 'bg-red-500' : 'bg-yellow-500'
            }`}></span>
            {apiStatus}
          </div>
        </div>
      </Layout>
    </>
  );
}
