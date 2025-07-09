import React from 'react';
import { Project, ProjectStatus } from '../types';
import { formatDate } from '../utils';
import { Badge, Tooltip } from '@renexus/ui-components';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'planning':
      return 'bg-blue-100 text-blue-800';
    case 'onHold':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const statusColor = getStatusColor(project.status);
  
  return (
    <div 
      className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View ${project.name} project details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium truncate" title={project.name}>
          {project.name}
        </h3>
        <Badge className={statusColor}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" title={project.description}>
        {project.description}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Tooltip content={`Lead: ${project.lead.name}`}>
            <div className="flex items-center">
              {project.lead.avatar ? (
                <img 
                  src={project.lead.avatar} 
                  alt={project.lead.name} 
                  className="w-8 h-8 rounded-full mr-2"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                  {project.lead.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {project.key}
              </span>
            </div>
          </Tooltip>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(project.startDate)}
        </div>
      </div>
    </div>
  );
};
