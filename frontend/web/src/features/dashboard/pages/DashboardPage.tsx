import React, { useState } from 'react';
import { DashboardSummaryCard } from '../components/DashboardSummaryCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { ProjectProgressCard } from '../components/ProjectProgressCard';
import { TaskStatusChart } from '../components/TaskStatusChart';
import { TeamPerformanceTable } from '../components/TeamPerformanceTable';
import { TimelineComponent } from '../components/TimelineComponent';
import { TimeRange } from '../types';
import { 
  useDashboardSummary, 
  useProjectSummaries, 
  useTaskStatusSummary, 
  useTeamPerformance, 
  useTimelineEvents 
} from '../hooks/useDashboard';
import { Select } from '@renexus/ui-components';
import { CalendarIcon, RefreshCwIcon } from 'lucide-react';
import { useQueryClient } from 'react-query';

export const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  const queryClient = useQueryClient();

  // Fetch dashboard data using the hooks
  const { 
    data: dashboardSummary, 
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useDashboardSummary();
  
  const { 
    data: projectSummaries, 
    isLoading: isLoadingProjects,
    refetch: refetchProjects
  } = useProjectSummaries(timeRange);
  
  const { 
    data: taskStatusSummary, 
    isLoading: isLoadingTaskStatus,
    refetch: refetchTaskStatus
  } = useTaskStatusSummary(undefined, timeRange);
  
  const { 
    data: teamPerformance, 
    isLoading: isLoadingTeamPerformance,
    refetch: refetchTeamPerformance
  } = useTeamPerformance(timeRange);
  
  const { 
    data: timelineEvents, 
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline
  } = useTimelineEvents(timeRange);

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
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Overview of your projects, tasks, and team performance.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <Select
              value={
                timeRange.start === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  ? 'last7days'
                  : timeRange.start === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  ? 'last30days'
                  : timeRange.start === new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  ? 'last90days'
                  : timeRange.start === new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
                  ? 'thisYear'
                  : 'last30days'
              }
              onChange={handleTimeRangeChange}
              className="w-40"
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="last90days">Last 90 days</option>
              <option value="thisYear">This year</option>
            </Select>
          </div>
          
          <button
            onClick={handleRefreshData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Dashboard Summary */}
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
      
      {/* Timeline */}
      <div className="mb-8">
        <TimelineComponent 
          events={timelineEvents || []} 
          isLoading={isLoadingTimeline} 
        />
      </div>
    </div>
  );
};
