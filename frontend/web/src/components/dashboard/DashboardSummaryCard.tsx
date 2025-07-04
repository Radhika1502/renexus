import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Users, Target, CheckCircle } from 'lucide-react';

interface DashboardSummaryProps {
  tasks: {
    total: number;
    active: number;
    completed: number;
    upcomingDeadlines: number;
  };
  projects: {
    total: number;
    active: number;
  };
  users: {
    total: number;
  };
}

export const DashboardSummaryCard: React.FC<DashboardSummaryProps> = ({
  tasks,
  projects,
  users
}) => {
  const completionRate = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;
  const isPositiveTrend = completionRate > 50;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tasks.total}</div>
          <p className="text-xs text-muted-foreground">
            {tasks.active} active, {tasks.completed} completed
          </p>
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projects.active}</div>
          <p className="text-xs text-muted-foreground">
            {projects.total} total projects
          </p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users.total}</div>
          <p className="text-xs text-muted-foreground">
            Active contributors
          </p>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          {isPositiveTrend ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isPositiveTrend ? "default" : "destructive"}
              className="text-xs"
            >
              {isPositiveTrend ? "Good" : "Needs Attention"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 