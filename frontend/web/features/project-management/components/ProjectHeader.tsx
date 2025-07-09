import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { Button, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@renexus/ui-components';
import { ChevronLeft, MoreVertical, Edit, Trash, Clock, CheckCircle, AlertTriangle, PauseCircle } from 'lucide-react';
import { useUpdateProject } from '../hooks/useUpdateProject';

interface ProjectHeaderProps {
  project: Project;
  onEdit?: () => void;
  onBack?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onEdit,
  onBack,
}) => {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const { updateProject, isLoading } = useUpdateProject();

  const handleStatusChange = async (status: ProjectStatus) => {
    await updateProject({
      id: project.id,
      status,
    });
    setIsStatusMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <div className="flex items-center">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-2"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {project.key}
            </span>
          </div>
          
          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
              ${project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
              ${project.status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
              ${project.status === 'onHold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : ''}
              ${project.status === 'completed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : ''}
              ${project.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
            `}>
              {project.status}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 self-end md:self-auto">
        <Dropdown open={isStatusMenuOpen} onOpenChange={setIsStatusMenuOpen}>
          <DropdownTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Change Status
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem onClick={() => handleStatusChange('planning')}>
              <Clock className="mr-2 h-4 w-4" />
              <span>Planning</span>
            </DropdownItem>
            <DropdownItem onClick={() => handleStatusChange('active')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Active</span>
            </DropdownItem>
            <DropdownItem onClick={() => handleStatusChange('onHold')}>
              <PauseCircle className="mr-2 h-4 w-4" />
              <span>On Hold</span>
            </DropdownItem>
            <DropdownItem onClick={() => handleStatusChange('completed')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Completed</span>
            </DropdownItem>
            <DropdownItem onClick={() => handleStatusChange('cancelled')}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Cancelled</span>
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
        
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        
        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem>
              <span>Export</span>
            </DropdownItem>
            <DropdownItem className="text-red-600 dark:text-red-400">
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete Project</span>
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </div>
  );
};
