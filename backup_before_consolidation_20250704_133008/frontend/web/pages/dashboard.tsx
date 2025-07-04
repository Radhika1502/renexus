import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useFetchApi } from '../src/hooks/useApi';
import { api } from '../src/services/api';
import { DashboardSummaryCard } from '../src/features/dashboard/components/DashboardSummaryCard';
import { ProjectProgressCard } from '../src/features/dashboard/components/ProjectProgressCard';
import { TaskStatusChart } from '../src/features/dashboard/components/TaskStatusChart';
import { ActivityFeed } from '../src/features/dashboard/components/ActivityFeed';
import { dashboardService } from '../src/features/dashboard/api/dashboardService';
import { TimeRange } from '../src/features/dashboard/types';

export default function Dashboard() {
  // State for API data
  const [apiStatus, setApiStatus] = useState<string>('Checking connection...');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  
  // State for time range filter
  const [timeRangeOption, setTimeRangeOption] = useState('last30days');
  
  // Convert time range option to actual date range
  const getTimeRange = (): TimeRange | undefined => {
    const now = new Date();
    const end = now.toISOString();
    let start: Date;
    
    switch (timeRangeOption) {
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      start: start.toISOString(),
      end
    };
  };
  
  // Use React Query hooks for data fetching
  const { 
    data: summaryData, 
    isLoading: isSummaryLoading, 
    error: summaryError 
  } = useFetchApi('/dashboard/summary', {
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: 0,
    teamMembers: 0
  });
  
  const { 
    data: projectData, 
    isLoading: isProjectLoading, 
    error: projectError 
  } = useFetchApi('/dashboard/projects', []);
  
  const { 
    data: taskStatusData, 
    isLoading: isTaskStatusLoading, 
    error: taskStatusError 
  } = useFetchApi('/dashboard/tasks/status', []);
  
  const { 
    data: activityData, 
    isLoading: isActivityLoading, 
    error: activityError 
  } = useFetchApi('/dashboard/activity?limit=10', []);
  
  // Check backend API connection
  useEffect(() => {
    async function checkApiConnection() {
      try {
        setApiStatus('Connecting to backend...');
        const response = await api.get('/health');
        console.log('API health check response:', response.data);
        setApiConnected(true);
        setApiStatus(`Connected to API on ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`);
      } catch (err: any) {
        console.error('API connection error:', err);
        setApiConnected(false);
        setApiStatus(`Failed to connect to API: ${err?.message || 'Unknown error'}`);
      }
    }
    
    checkApiConnection();
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard | Renexus Project Management</title>
        <meta name="description" content="Renexus Project Management Dashboard" />
      </Head>

      <Layout>
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
                <select
                  value={timeRangeOption}
                  onChange={(e) => setTimeRangeOption(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="last7days">Last 7 days</option>
                  <option value="last30days">Last 30 days</option>
                  <option value="last90days">Last 90 days</option>
                  <option value="thisYear">This year</option>
                </select>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
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
              data={{
                activeProjects: summaryData?.activeProjects || 0,
                completedProjects: summaryData?.completedProjects || 0,
                totalTasks: summaryData?.totalTasks || 0,
                completedTasks: summaryData?.completedTasks || 0,
                upcomingDeadlines: summaryData?.upcomingDeadlines || 0,
                teamMembers: summaryData?.teamMembers || 0,
                recentActivities: activityData || []
              }}
              isLoading={isSummaryLoading}
            />
          </div>
          
          {/* Project Progress and Task Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Project Progress */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
              {isProjectLoading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400">Loading project data...</p>
                </div>
              ) : projectError ? (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-4 border border-red-200 dark:border-red-700/30">
                  <p className="text-red-600 dark:text-red-300">Error loading project data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ProjectProgressCard 
                    projects={Array.isArray(projectData) ? projectData : []} 
                    isLoading={isProjectLoading} 
                  />
                  
                  {(!Array.isArray(projectData) || projectData.length === 0) && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400">No projects found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Task Status Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Task Status</h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <TaskStatusChart 
                  data={taskStatusData || []} 
                  isLoading={isTaskStatusLoading} 
                />
              </div>
            </div>
          </div>
          
          {/* Activity Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
            </div>
            <div className="px-6 py-4">
              {isActivityLoading ? (
                <p className="text-center py-10 text-gray-500 dark:text-gray-400">
                  Loading activity data...
                </p>
              ) : activityError ? (
                <p className="text-center py-10 text-red-500 dark:text-red-400">
                  Error loading activity data. Please try again.
                </p>
              ) : !Array.isArray(activityData) || activityData.length === 0 ? (
                <p className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No activity found.
                </p>
              ) : (
                <ActivityFeed limit={10} />
              )}
            </div>
          </div>
          
          {/* Task Progress Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Task Progress</h3>
            </div>
            <div className="px-6 py-4">
              {isSummaryLoading ? (
                <p className="text-center py-10 text-gray-500 dark:text-gray-400">
                  Loading task data...
                </p>
              ) : summaryError ? (
                <p className="text-center py-10 text-red-500 dark:text-red-400">
                  Error loading task data. Please try again.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Task Progress</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {summaryData.completedTasks} of {summaryData.totalTasks} tasks completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {summaryData.totalTasks > 0 ? 
                          `${Math.round((summaryData.completedTasks / summaryData.totalTasks) * 100)}%` : 
                          '0%'}
                      </p>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${summaryData.totalTasks > 0 ? Math.round((summaryData.completedTasks / summaryData.totalTasks) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {summaryData && summaryData.upcomingDeadlines > 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </span>
                        {summaryData.upcomingDeadlines} task{summaryData.upcomingDeadlines > 1 ? 's' : ''} with upcoming deadlines
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* API Connection Status */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-md shadow-lg text-sm flex items-center ${apiConnected ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : apiConnected === false ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${apiConnected ? 'bg-green-500' : apiConnected === false ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            {apiStatus}
          </div>
        </div>
      </Layout>
    </>
  );
}
