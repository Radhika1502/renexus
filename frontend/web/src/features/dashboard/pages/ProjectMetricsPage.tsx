import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Select } from '@renexus/ui-components';
import { useProjectMetrics } from '../hooks/useDashboard';
import { TimeRange } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { CalendarIcon, ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectMetricsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  const { data: projectMetrics, isLoading } = useProjectMetrics(projectId || '', timeRange);

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

  // Format dates for better display
  const formatBurndownData = projectMetrics?.burndownData.map(point => ({
    ...point,
    formattedDate: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  const formatCompletionTrend = projectMetrics?.taskCompletionTrend.map(point => ({
    ...point,
    formattedDate: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  // Get status colors for the chart
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return '#10B981'; // green-500
      case 'in progress':
      case 'inprogress':
      case 'in-progress':
        return '#3B82F6'; // blue-500
      case 'blocked':
        return '#EF4444'; // red-500
      case 'todo':
      case 'to do':
      case 'to-do':
        return '#9CA3AF'; // gray-400
      case 'review':
      case 'in review':
        return '#8B5CF6'; // violet-500
      default:
        return '#D1D5DB'; // gray-300
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-2">
        <Link to="/dashboard" className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {projectMetrics?.projectName || 'Project'} Metrics
        </h1>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <p className="text-gray-600 dark:text-gray-400">
          Detailed analytics and performance metrics for this project.
        </p>
        
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
      </div>
      
      {/* Burndown Chart and Task Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Burndown Chart</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formatBurndownData || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Remaining Tasks', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} tasks`, undefined]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="remainingTasks"
                  name="Actual Remaining"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="idealLine"
                  name="Ideal Burndown"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Task Status Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectMetrics?.tasksByStatus || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="status" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} tasks`, undefined]}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Number of Tasks" 
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  {projectMetrics?.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Task Completion Trend */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Task Completion Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formatCompletionTrend || []}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Completed Tasks', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value} tasks`, undefined]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed Tasks"
                stroke="#10B981"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Tasks by Assignee */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tasks by Assignee</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={projectMetrics?.tasksByAssignee || []}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="userName" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip
                formatter={(value: number) => [`${value} tasks`, undefined]}
              />
              <Legend />
              <Bar 
                dataKey="taskCount" 
                name="Number of Tasks" 
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
