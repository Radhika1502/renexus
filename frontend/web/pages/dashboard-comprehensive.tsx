import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useQuery, useQueryClient } from 'react-query';
import { Card } from '../src/components/ui';
import { ArrowPathIcon, CalendarDaysIcon, ChartBarIcon, Cog6ToothIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

// All comprehensive interfaces and service definitions
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
  priority: 'high' | 'medium' | 'low';
}

interface TaskStatusSummary {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface TeamPerformance {
  teamId: string;
  teamName: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  averageTaskCompletionTime: number;
  onTimeDeliveryRate: number;
  members: any[];
}

interface AnalyticsData {
  taskCompletion: { completed: number; total: number; trend: number };
  timeTracking: { estimated: number; actual: number; efficiency: number };
  burndown: Array<{ date: string; ideal: number; actual: number }>;
  velocity: Array<{ sprint: string; completed: number; planned: number }>;
  cycleTime: { average: number; min: number; max: number; median: number };
  leadTime: { average: number; min: number; max: number; median: number };
  priorityDistribution: Array<{ priority: string; count: number }>;
}

// Comprehensive dashboard service
const comprehensiveDashboardService = {
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
    { id: '1', name: 'Project Alpha', status: 'active', progress: 75, tasksTotal: 20, tasksCompleted: 15, teamSize: 4, dueDate: '2024-02-15', priority: 'high' },
    { id: '2', name: 'Project Beta', status: 'active', progress: 45, tasksTotal: 15, tasksCompleted: 7, teamSize: 3, dueDate: '2024-03-01', priority: 'medium' },
    { id: '3', name: 'Project Gamma', status: 'active', progress: 90, tasksTotal: 25, tasksCompleted: 23, teamSize: 6, dueDate: '2024-01-30', priority: 'low' }
  ],
  
  getTaskStatusSummary: async (): Promise<TaskStatusSummary[]> => [
    { status: 'Completed', count: 32, percentage: 67, color: 'bg-green-500' },
    { status: 'In Progress', count: 10, percentage: 21, color: 'bg-blue-500' },
    { status: 'Pending', count: 6, percentage: 12, color: 'bg-yellow-500' }
  ],
  
  getTeamPerformance: async (): Promise<TeamPerformance[]> => [
    { teamId: '1', teamName: 'Frontend Team', completedTasks: 15, totalTasks: 20, completionRate: 0.75, averageTaskCompletionTime: 24, onTimeDeliveryRate: 0.85, members: [] },
    { teamId: '2', teamName: 'Backend Team', completedTasks: 12, totalTasks: 18, completionRate: 0.67, averageTaskCompletionTime: 32, onTimeDeliveryRate: 0.72, members: [] }
  ],
  
  getAnalyticsData: async (): Promise<AnalyticsData> => ({
    taskCompletion: { completed: 32, total: 48, trend: 5.2 },
    timeTracking: { estimated: 120, actual: 135, efficiency: 0.89 },
    burndown: [
      { date: '2024-01-01', ideal: 100, actual: 100 },
      { date: '2024-01-08', ideal: 80, actual: 85 }
    ],
    velocity: [
      { sprint: 'Sprint 1', completed: 25, planned: 30 },
      { sprint: 'Sprint 2', completed: 32, planned: 30 }
    ],
    cycleTime: { average: 3.2, min: 1.5, max: 8.0, median: 2.8 },
    leadTime: { average: 5.5, min: 2.0, max: 12.0, median: 4.8 },
    priorityDistribution: [
      { priority: 'high', count: 15 },
      { priority: 'medium', count: 20 },
      { priority: 'low', count: 13 }
    ]
  })
};

// Comprehensive dashboard hooks
const useComprehensiveDashboard = () => {
  const summaryQuery = useQuery('dashboard-summary', () => comprehensiveDashboardService.getDashboardSummary());
  const projectsQuery = useQuery('project-summaries', () => comprehensiveDashboardService.getProjectSummaries());
  const taskStatusQuery = useQuery('task-status', () => comprehensiveDashboardService.getTaskStatusSummary());
  const teamPerformanceQuery = useQuery('team-performance', () => comprehensiveDashboardService.getTeamPerformance());
  const analyticsQuery = useQuery('analytics-data', () => comprehensiveDashboardService.getAnalyticsData());
  
  return {
    summary: summaryQuery,
    projects: projectsQuery,
    taskStatus: taskStatusQuery,
    teamPerformance: teamPerformanceQuery,
    analytics: analyticsQuery,
    isLoading: summaryQuery.isLoading || projectsQuery.isLoading || taskStatusQuery.isLoading || teamPerformanceQuery.isLoading || analyticsQuery.isLoading,
    refetchAll: () => {
      summaryQuery.refetch();
      projectsQuery.refetch();
      taskStatusQuery.refetch();
      teamPerformanceQuery.refetch();
      analyticsQuery.refetch();
    }
  };
};

// Enhanced Dashboard Summary Card with analytics
const EnhancedDashboardSummaryCard: React.FC<{ data: DashboardSummary; analytics: AnalyticsData; isLoading: boolean }> = ({ data, analytics, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  const summaryItems = [
    { 
      label: 'Active Projects', 
      value: data.activeProjects.toString(), 
      color: 'text-blue-600',
      trend: '+2 this month',
      icon: '📊'
    },
    { 
      label: 'Task Progress', 
      value: `${data.completedTasks}/${data.totalTasks}`, 
      color: 'text-green-600',
      trend: `+${analytics.taskCompletion.trend}% this week`,
      icon: '✅'
    },
    { 
      label: 'Efficiency', 
      value: `${Math.round(analytics.timeTracking.efficiency * 100)}%`, 
      color: 'text-purple-600',
      trend: analytics.timeTracking.efficiency > 0.85 ? '↗ Good' : '↘ Needs attention',
      icon: '⚡'
    },
    { 
      label: 'Team Members', 
      value: data.teamMembers.toString(), 
      color: 'text-orange-600',
      trend: 'Across 3 teams',
      icon: '👥'
    },
    { 
      label: 'Avg Cycle Time', 
      value: `${analytics.cycleTime.average.toFixed(1)}d`, 
      color: 'text-indigo-600',
      trend: 'Target: 3.0d',
      icon: '🔄'
    },
  ];

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryItems.map((item, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-gray-500">{item.trend}</span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Advanced Analytics Panel
const AdvancedAnalyticsPanel: React.FC<{ analytics: AnalyticsData; isLoading: boolean }> = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <ChartBarIcon className="h-5 w-5 mr-2" />
        Advanced Analytics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cycle Time Metrics */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Cycle Time</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Average</span>
              <span className="font-medium">{analytics.cycleTime.average.toFixed(1)}d</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Median</span>
              <span className="font-medium">{analytics.cycleTime.median.toFixed(1)}d</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Range</span>
              <span className="font-medium">{analytics.cycleTime.min.toFixed(1)}d - {analytics.cycleTime.max.toFixed(1)}d</span>
            </div>
          </div>
        </div>

        {/* Lead Time Metrics */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Lead Time</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Average</span>
              <span className="font-medium">{analytics.leadTime.average.toFixed(1)}d</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Median</span>
              <span className="font-medium">{analytics.leadTime.median.toFixed(1)}d</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Range</span>
              <span className="font-medium">{analytics.leadTime.min.toFixed(1)}d - {analytics.leadTime.max.toFixed(1)}d</span>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Priority Distribution</h4>
          <div className="space-y-2">
            {analytics.priorityDistribution.map((item) => (
              <div key={item.priority} className="flex justify-between items-center">
                <span className="text-sm capitalize">{item.priority}</span>
                <div className="flex items-center">
                  <div className={`w-12 h-2 rounded-full mr-2 ${
                    item.priority === 'high' ? 'bg-red-400' : 
                    item.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}></div>
                  <span className="font-medium text-sm">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Main Comprehensive Dashboard Component
export default function ComprehensiveDashboard() {
  const [timeRange, setTimeRange] = useState('last30days');
  const [view, setView] = useState<'overview' | 'analytics' | 'performance' | 'trends'>('overview');
  const [apiStatus, setApiStatus] = useState<string>('Connected');
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  
  const queryClient = useQueryClient();
  const dashboardData = useComprehensiveDashboard();

  const handleRefreshAll = () => {
    dashboardData.refetchAll();
    queryClient.invalidateQueries();
  };

  return (
    <>
      <Head>
        <title>Comprehensive Dashboard | Renexus Project Management</title>
        <meta name="description" content="Advanced project management dashboard with comprehensive analytics, team performance metrics, and real-time insights" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comprehensive Dashboard</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Advanced analytics, team insights, and comprehensive project management overview.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* View Selector */}
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                {(['overview', 'analytics', 'performance', 'trends'] as const).map((viewOption) => (
                  <button
                    key={viewOption}
                    onClick={() => setView(viewOption)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize ${
                      view === viewOption 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {viewOption}
                  </button>
                ))}
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center">
                <CalendarDaysIcon className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="last7days">Last 7 days</option>
                  <option value="last30days">Last 30 days</option>
                  <option value="last90days">Last 90 days</option>
                  <option value="thisYear">This year</option>
                </select>
              </div>
              
              <button
                onClick={handleRefreshAll}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh All
              </button>
            </div>
          </div>

          {/* Main Content */}
          {view === 'overview' && (
            <div className="space-y-8">
              {/* Enhanced Summary Cards */}
              <EnhancedDashboardSummaryCard 
                data={dashboardData.summary.data || { activeProjects: 0, completedProjects: 0, totalTasks: 0, completedTasks: 0, upcomingDeadlines: 0, teamMembers: 0, recentActivities: [] }}
                analytics={dashboardData.analytics.data || { taskCompletion: { completed: 0, total: 0, trend: 0 }, timeTracking: { estimated: 0, actual: 0, efficiency: 0 }, burndown: [], velocity: [], cycleTime: { average: 0, min: 0, max: 0, median: 0 }, leadTime: { average: 0, min: 0, max: 0, median: 0 }, priorityDistribution: [] }}
                isLoading={dashboardData.isLoading} 
              />

              {/* Project Progress Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Active Projects</h3>
                  <div className="space-y-4">
                    {(dashboardData.projects.data || []).map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              project.priority === 'high' ? 'bg-red-100 text-red-800' :
                              project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {project.priority} priority
                            </span>
                          </div>
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
                          <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Task Status Distribution</h3>
                  <div className="space-y-4">
                    {(dashboardData.taskStatus.data || []).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.status}</span>
                        <div className="flex items-center flex-1 ml-4">
                          <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                            <div 
                              className={`h-3 rounded-full ${item.color}`}
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 min-w-[3rem]">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {view === 'analytics' && (
            <div className="space-y-8">
              <AdvancedAnalyticsPanel 
                analytics={dashboardData.analytics.data || { taskCompletion: { completed: 0, total: 0, trend: 0 }, timeTracking: { estimated: 0, actual: 0, efficiency: 0 }, burndown: [], velocity: [], cycleTime: { average: 0, min: 0, max: 0, median: 0 }, leadTime: { average: 0, min: 0, max: 0, median: 0 }, priorityDistribution: [] }}
                isLoading={dashboardData.isLoading}
              />
            </div>
          )}

          {/* Add performance and trends views here */}
        </div>
        
        {/* API Status Indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-md shadow-lg text-sm flex items-center ${
            apiConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
          }`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              apiConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            {apiStatus}
          </div>
        </div>
      </Layout>
    </>
  );
} 