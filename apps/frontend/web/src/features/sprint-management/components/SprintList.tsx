import React from 'react';
import { Link } from 'react-router-dom';
import { useSprints } from '../hooks/useSprints';
import { Sprint, SprintStatus } from '../types';
import { Button } from '@renexus/ui-components';
import { PlusIcon, CalendarIcon } from 'lucide-react';

interface SprintListProps {
  projectId?: string;
  onCreateSprint?: () => void;
}

export const SprintList: React.FC<SprintListProps> = ({ projectId, onCreateSprint }) => {
  const { data: sprints, isLoading, error } = useSprints(projectId);

  const getStatusBadgeClass = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.PLANNING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case SprintStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case SprintStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case SprintStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading sprints...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading sprints: {error.message}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Sprints</h2>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onCreateSprint}
          className="flex items-center gap-2"
        >
          <PlusIcon size={16} />
          <span>New Sprint</span>
        </Button>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sprints && sprints.length > 0 ? (
          sprints.map((sprint) => (
            <div key={sprint.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    <Link to={`/sprints/${sprint.id}`} className="hover:underline">
                      {sprint.name}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(sprint.status)}`}>
                      {sprint.status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <CalendarIcon size={14} />
                      {formatDateRange(sprint.startDate, sprint.endDate)}
                    </span>
                  </div>
                  {sprint.goal && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Goal: {sprint.goal}
                    </p>
                  )}
                </div>
                
                <div>
                  <Link
                    to={`/sprints/${sprint.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No sprints found. {projectId ? 'Create a sprint to get started.' : 'Select a project to view its sprints.'}
          </div>
        )}
      </div>
    </div>
  );
};
