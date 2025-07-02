import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Select, Button } from '../../../components/ui';
// Import icons from react-icons
import { FiDownload, FiRefreshCw, FiSettings } from 'react-icons/fi';

import { TaskCompletionChart } from './TaskCompletionChart';
import { TimeTrackingReport } from './TimeTrackingReport';
import { BurndownChart } from './BurndownChart';
import { VelocityChart } from './VelocityChart';
import { CumulativeFlowDiagram } from './CumulativeFlowDiagram';
import { useProjectAnalytics } from '../hooks/useProjectAnalytics';
import { useReportingApi } from '../../reporting/hooks/useReportingApi';
import { useOfflineSync } from '../../task-management/hooks/useOfflineSync';

interface AnalyticsDashboardProps {
  projectId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { isOnline } = useOfflineSync();
  const reportingApi = useReportingApi();
  const { 
    data: analyticsData, 
    isLoading, 
    error, 
    refetch 
  } = useProjectAnalytics(projectId, selectedTimeRange);

  const handleRefresh = async () => {
    if (!isOnline) {
      alert('Cannot refresh data while offline');
      return;
    }
    
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleExport = async () => {
    if (!isOnline) {
      alert('Cannot export data while offline');
      return;
    }
    
    setIsExporting(true);
    try {
      // Create a report first, then export it
      const report = await reportingApi.generateReport({
        type: activeTab as 'velocity' | 'burndown' | 'cumulative-flow' | 'task-completion' | 'time-tracking',
        timeframe: selectedTimeRange,
        project: projectId
      }).mutateAsync();
      
      if (report && report.id) {
        await reportingApi.exportReport({
          reportId: report.id,
          format: 'excel'
        }).mutateAsync();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <div className="text-red-700">Error loading analytics data</div>
        <div className="text-sm text-red-500 mt-1">{error.message}</div>
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={handleRefresh}
          disabled={!isOnline}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Analytics</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFilters}
          >
            <FiSettings className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <FiRefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={isExporting || !isOnline}
          >
            <FiDownload className="h-4 w-4 mr-1" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium mb-1">Time Range</label>
                <Select
                  value={selectedTimeRange}
                  onChange={(value: unknown) => setSelectedTimeRange(value as 'week' | 'month' | 'quarter' | 'year')}
                  options={[
                    { value: 'week', label: 'Last Week' },
                    { value: 'month', label: 'Last Month' },
                    { value: 'quarter', label: 'Last Quarter' },
                    { value: 'year', label: 'Last Year' },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion</CardTitle>
                <CardDescription>Tasks completed vs. planned</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {analyticsData?.taskCompletion ? (
                  <TaskCompletionChart 
                    completed={analyticsData.taskCompletion.completed} 
                    total={analyticsData.taskCompletion.total} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No task completion data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>Hours spent per category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {analyticsData?.timeTracking ? (
                  <TimeTrackingReport 
                    estimated={analyticsData.timeTracking.estimated} 
                    actual={analyticsData.timeTracking.actual} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No time tracking data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart</CardTitle>
                <CardDescription>Remaining work over time</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {analyticsData?.burndown ? (
                  <BurndownChart data={analyticsData.burndown} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No burndown data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Velocity</CardTitle>
                <CardDescription>Story points completed per sprint</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {analyticsData?.velocity ? (
                  <VelocityChart data={analyticsData.velocity} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No velocity data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumulative Flow</CardTitle>
                <CardDescription>Task status distribution over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {analyticsData?.cumulativeFlow ? (
                  <CumulativeFlowDiagram data={analyticsData.cumulativeFlow} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No cumulative flow data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Task completion by team member</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {analyticsData?.teamPerformance ? (
                  <div className="h-full">
                    {/* Team performance visualization would go here */}
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Team performance visualization
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No team performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
