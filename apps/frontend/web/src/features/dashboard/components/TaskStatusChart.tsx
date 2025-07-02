import React from 'react';
import { Card } from '@renexus/ui-components';
import { TaskStatusSummary } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TaskStatusChartProps {
  data: TaskStatusSummary[];
  isLoading: boolean;
}

export const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data, isLoading }) => {
  // Define colors for different task statuses
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
      <Card className="p-6 animate-pulse">
        <h2 className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></h2>
        <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Task Status Distribution</h2>
      {data && data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} tasks (${(data.find(item => item.status === name)?.percentage || 0).toFixed(1)}%)`,
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 h-64 flex items-center justify-center">
          No task status data available.
        </p>
      )}
    </Card>
  );
};
