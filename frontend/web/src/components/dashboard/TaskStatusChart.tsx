import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface TaskStatusSummary {
  status: string;
  count: number;
  percentage: number;
}

interface TaskStatusChartProps {
  data: TaskStatusSummary[];
}

const COLORS = {
  'COMPLETED': '#10b981', // green
  'IN_PROGRESS': '#3b82f6', // blue
  'PENDING': '#f59e0b', // yellow
  'TODO': '#f59e0b', // yellow
  'BLOCKED': '#ef4444', // red
  'done': '#10b981',
  'in_progress': '#3b82f6',
  'todo': '#f59e0b',
  'blocked': '#ef4444'
};

const formatStatusName = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending':
    case 'todo':
      return 'To Do';
    case 'blocked':
      return 'Blocked';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
};

const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  return COLORS[normalizedStatus] || '#64748b'; // default gray
};

export const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    name: formatStatusName(item.status),
    value: item.count,
    percentage: item.percentage,
    fill: getStatusColor(item.status)
  }));

  const totalTasks = data.reduce((sum, item) => sum + item.count, 0);

  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: {data.value} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Task Status Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalTasks === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-gray-700">
                    {item.name}: {item.value} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Total Tasks: {totalTasks}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};