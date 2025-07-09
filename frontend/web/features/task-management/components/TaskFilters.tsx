import React from 'react';
import { TaskFilters as FilterOptions, TaskStatus, TaskPriority } from '../types';
import { useUsers } from '../../project-management/hooks/useUsers';
import { useProjects } from '../../project-management/hooks/useProjects';

interface TaskFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const { users } = useUsers();
  const { projects } = useProjects();
  
  const statusOptions: TaskStatus[] = ['backlog', 'todo', 'inProgress', 'review', 'done'];
  const priorityOptions: TaskPriority[] = ['highest', 'high', 'medium', 'low', 'lowest'];
  
  const handleStatusChange = (status: TaskStatus) => {
    const updatedStatuses = filters.status?.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...(filters.status || []), status];
    
    onFilterChange({ ...filters, status: updatedStatuses });
  };
  
  const handlePriorityChange = (priority: TaskPriority) => {
    const updatedPriorities = filters.priority?.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...(filters.priority || []), priority];
    
    onFilterChange({ ...filters, priority: updatedPriorities });
  };
  
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, assigneeId: e.target.value || undefined });
  };
  
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, projectId: e.target.value || undefined });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };
  
  const handleDueDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, dueDateStart: e.target.value || undefined });
  };
  
  const handleDueDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, dueDateEnd: e.target.value || undefined });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Project Filter */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project
          </label>
          <select
            id="project"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            value={filters.projectId || ''}
            onChange={handleProjectChange}
            disabled={!!filters.projectId && !projects} // Disable if projectId is provided as prop
          >
            <option value="">All Projects</option>
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Assignee Filter */}
        <div>
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignee
          </label>
          <select
            id="assignee"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            value={filters.assigneeId || ''}
            onChange={handleAssigneeChange}
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Due Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="dueDateStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due From
            </label>
            <input
              id="dueDateStart"
              type="date"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              value={filters.dueDateStart || ''}
              onChange={handleDueDateStartChange}
            />
          </div>
          <div>
            <label htmlFor="dueDateEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due To
            </label>
            <input
              id="dueDateEnd"
              type="date"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              value={filters.dueDateEnd || ''}
              onChange={handleDueDateEndChange}
            />
          </div>
        </div>
        
        {/* Status Filter - Multiple Checkboxes */}
        <div>
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => (
              <label 
                key={status} 
                className="inline-flex items-center"
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={filters.status?.includes(status) || false}
                  onChange={() => handleStatusChange(status)}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {status === 'inProgress' ? 'In Progress' : status}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Priority Filter - Multiple Checkboxes */}
        <div>
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </p>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map(priority => (
              <label 
                key={priority} 
                className="inline-flex items-center"
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  checked={filters.priority?.includes(priority) || false}
                  onChange={() => handlePriorityChange(priority)}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {priority}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
