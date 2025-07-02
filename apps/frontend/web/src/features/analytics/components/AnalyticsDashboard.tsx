import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Select, Button } from '../../../components/ui';
// Import icons directly from React icons which is more stable
import { FiDownload, FiRefreshCw, FiSliders } from 'react-icons/fi';

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
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  showFilters?: boolean;
  showExport?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  timeRange = 'month',
  showFilters = true,
  showExport = true
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  const { data, isLoading, error, refetch } = useProjectAnalytics(projectId, selectedTimeRange as any);
  const { generateReport } = useReportingApi();
  const { isOnline } = useOfflineSync();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-800 dark:text-red-200">
        <p className="font-medium">Failed to load analytics data</p>
        <p className="text-sm mt-1">Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }

  const handleExportDashboard = async () => {
    if (!isOnline) {
      alert('Cannot export while offline. Please try again when you have internet connection.');
      return;
    }
    
    try {
      setIsExporting(true);
      await generateReport.mutateAsync({
        reportType: 'project-progress',
        filters: {
          projectIds: [projectId],
          startDate: getTimeRangeStartDate(selectedTimeRange as any)
        }
      });
      setIsExporting(false);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };
  
  const getTimeRangeStartDate = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Project Analytics</h2>
        <div className="flex items-center space-x-2">
          {showFilters && (
            <Select
              value={selectedTimeRange}
              onChange={(value: string) => setSelectedTimeRange(value)}
              options={[
                { value: 'week', label: 'Last Week' },
                { value: 'month', label: 'Last Month' },
                { value: 'quarter', label: 'Last Quarter' },
                { value: 'year', label: 'Last Year' }
              ]}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <FiRefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDashboard}
              disabled={isExporting || !isOnline}
            >
              <FiDownload className="h-4 w-4 mr-1" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
            <CardDescription>Tasks completed vs. total tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <TaskCompletionChart 
                completed={data?.taskCompletion.completed || 0} 
                total={data?.taskCompletion.total || 0} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Tracking</CardTitle>
            <CardDescription>Estimated vs. actual time spent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <TimeTrackingReport 
                estimated={data?.timeTracking.estimated || 0} 
                actual={data?.timeTracking.actual || 0} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <div className="grid grid-cols-2 gap-2">
                {data?.tasksByStatus?.map((item: { status: string; count: number }) => (
                  <div key={item.status} className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.status}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          item.status === 'done' ? 'bg-green-500' : 
                          item.status === 'in-progress' ? 'bg-blue-500' : 
                          item.status === 'review' ? 'bg-yellow-500' : 
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(item.count / data.taskCompletion.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Project Burndown</CardTitle>
              <CardDescription>Remaining work over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BurndownChart data={data?.burndown || []} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Velocity Chart</CardTitle>
                <CardDescription>Story points completed per sprint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <VelocityChart data={data?.velocity || []} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Flow</CardTitle>
                <CardDescription>Task status distribution over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <CumulativeFlowDiagram data={data?.cumulativeFlow || []} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cycle Time</CardTitle>
                <CardDescription>Average time to complete tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {data?.cycleTime ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-4xl font-bold">{data.cycleTime.average.toFixed(1)} days</div>
                      <div className="text-sm text-gray-500 mt-2">Average cycle time</div>
                      <div className="flex justify-between w-full mt-4">
                        <div className="text-center">
                          <div className="text-xl font-medium">{data.cycleTime.min.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Min</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-medium">{data.cycleTime.median.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Median</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-medium">{data.cycleTime.max.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Max</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Lead Time</CardTitle>
                <CardDescription>Time from creation to completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {data?.leadTime ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-4xl font-bold">{data.leadTime.average.toFixed(1)} days</div>
                      <div className="text-sm text-gray-500 mt-2">Average lead time</div>
                      <div className="flex justify-between w-full mt-4">
                        <div className="text-center">
                          <div className="text-xl font-medium">{data.leadTime.min.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Min</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-medium">{data.leadTime.median.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Median</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-medium">{data.leadTime.max.toFixed(1)}</div>
                          <div className="text-xs text-gray-500">Max</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Tasks completed by team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.teamPerformance?.map((member: { userId: string; name: string; avatar?: string; tasksCompleted: number }) => (
                <div key={member.userId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <span>{member.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{member.tasksCompleted}</span>
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(member.tasksCompleted / data.teamPerformance.reduce((acc: number, m: { tasksCompleted: number }) => acc + m.tasksCompleted, 0)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {data?.priorityDistribution?.map((item: { priority: string; count: number }) => (
                <div key={item.priority} className="flex flex-col items-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-white
                    ${item.priority === 'high' ? 'bg-red-500' : 
                      item.priority === 'medium' ? 'bg-yellow-500' : 
                      'bg-blue-500'}
                  `}>
                    {item.count}
                  </div>
                  <span className="mt-2 text-sm font-medium">{item.priority}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
