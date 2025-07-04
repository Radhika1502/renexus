import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@renexus/ui-components/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TaskAnalytics: React.FC<{ taskId: string }> = ({ taskId }) => {
  // Mock data - will connect to real API later
  const timeSpentData = [
    { name: 'Estimated', hours: 8 },
    { name: 'Actual', hours: 6.5 },
  ];

  const completionTrends = [
    { date: 'Jun 1', completed: 2 },
    { date: 'Jun 8', completed: 5 },
    { date: 'Jun 15', completed: 8 },
    { date: 'Jun 22', completed: 12 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Spent vs Estimated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSpentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completion Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
