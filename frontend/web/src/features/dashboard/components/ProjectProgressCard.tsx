import React from 'react';
import { Card } from '@renexus/ui-components';
import { ProjectSummary } from '../types';
import Link from 'next/link';
import { CalendarIcon, AlertCircleIcon } from 'lucide-react';

interface ProjectProgressCardProps {
  projects: ProjectSummary[];
  isLoading: boolean;
}

export const ProjectProgressCard: React.FC<ProjectProgressCardProps> = ({ 
  projects, 
  isLoading 
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on track':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'at risk':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'behind':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const isDueSoon = (dateString?: string) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <h2 className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2"></div>
              <div className="flex justify-between">
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Project Progress</h2>
      {projects && projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-start mb-2">
                <Link 
                  href={`/projects/${project.id}`} 
                  className="text-lg font-medium text-gray-900 dark:text-white hover:underline"
                >
                  {project.name}
                </Link>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <CalendarIcon size={14} className="mr-1" />
                <span className={isDueSoon(project.dueDate) ? 'text-red-500 font-medium' : ''}>
                  Due: {formatDate(project.dueDate)}
                  {isDueSoon(project.dueDate) && (
                    <span className="ml-2 inline-flex items-center">
                      <AlertCircleIcon size={14} className="text-red-500 mr-1" />
                      Due soon
                    </span>
                  )}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {project.tasksCompleted}/{project.tasksTotal} tasks completed
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {project.progress}% complete
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No active projects found.</p>
      )}
    </Card>
  );
};
