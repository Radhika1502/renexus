import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@renexus/ui-components';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { useProject } from '../../project-management/hooks/useProject';

export const ProjectAnalytics: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [view, setView] = useState<'dashboard' | 'reports' | 'team'>('dashboard');
  
  const { data: project, isLoading: projectLoading } = useProject(projectId || '');
  
  if (!projectId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-800 dark:text-yellow-200">
          <p className="font-medium">No project selected</p>
          <p className="text-sm mt-1">Please select a project to view analytics.</p>
        </div>
      </div>
    );
  }
  
  if (projectLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project?.name} Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track project performance and team productivity
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
              <SelectItem value="year">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={view} onValueChange={(value) => setView(value as any)} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <AnalyticsDashboard projectId={projectId} timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Detailed Reports</h2>
            <p className="text-gray-500">
              Detailed reports will be available in a future update. Currently, you can view the dashboard 
              for an overview of project performance.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="team">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
            <p className="text-gray-500">
              Detailed team performance metrics will be available in a future update. Currently, you can view 
              the dashboard for a summary of team performance.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectAnalytics;
