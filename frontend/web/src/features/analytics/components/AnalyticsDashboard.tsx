import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renexus/ui-components';
import { TaskCompletionChart } from './TaskCompletionChart';
import { TimeTrackingReport } from './TimeTrackingReport';
import { BurndownChart } from './BurndownChart';
import { useProjectAnalytics } from '../hooks/useProjectAnalytics';

interface AnalyticsDashboardProps {
  projectId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  timeRange = 'month',
}) => {
  const { data, isLoading, error } = useProjectAnalytics(projectId, timeRange);

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

  return (
    <div className="space-y-6">
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
            <CardDescription>Distribution of tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <div className="grid grid-cols-2 gap-2">
                {data?.tasksByStatus.map((item) => (
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Tasks completed by team member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.teamPerformance.map((member) => (
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
                        style={{ width: `${(member.tasksCompleted / data.teamPerformance.reduce((acc, m) => acc + m.tasksCompleted, 0)) * 100}%` }}
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
              {data?.priorityDistribution.map((item) => (
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
    </div>
  );
};

export default AnalyticsDashboard;
