import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  dueDate?: string;
  startDate?: string;
}

interface ProjectProgressCardProps {
  projects: ProjectSummary[];
}

export const ProjectProgressCard: React.FC<ProjectProgressCardProps> = ({ projects }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on track':
        return 'bg-blue-100 text-blue-800';
      case 'at risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Project Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No projects found</p>
          ) : (
            projects.slice(0, 5).map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{project.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {project.description || 'No description'}
                    </p>
                  </div>
                  <Badge 
                    className={`text-xs ${getStatusColor(project.status)}`}
                    variant="secondary"
                  >
                    {project.status}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{project.progress}% complete</span>
                    <span>{project.tasksCompleted}/{project.tasksTotal} tasks</span>
                  </div>
                  <Progress 
                    value={project.progress} 
                    className="h-2"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Due: {formatDate(project.dueDate)}</span>
                  </div>
                  {project.status === 'behind' && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Behind schedule</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {projects.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {projects.length} projects
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 