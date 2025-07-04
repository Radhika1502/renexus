import React from 'react';
import { ProjectFilters as FilterOptions, ProjectStatus } from '../types';
import { useTeams } from '../hooks/useTeams';
import { useUsers } from '../hooks/useUsers';

interface ProjectFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const { teams } = useTeams();
  const { users } = useUsers();
  
  const statusOptions: ProjectStatus[] = ['planning', 'active', 'onHold', 'completed', 'cancelled'];
  
  const handleStatusChange = (status: ProjectStatus) => {
    const updatedStatuses = filters.status?.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...(filters.status || []), status];
    
    onFilterChange({ ...filters, status: updatedStatuses });
  };
  
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, teamId: e.target.value || undefined });
  };
  
  const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, leadId: e.target.value || undefined });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Search projects..."
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Team Filter */}
        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team
          </label>
          <select
            id="team"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            value={filters.teamId || ''}
            onChange={handleTeamChange}
          >
            <option value="">All Teams</option>
            {teams?.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Lead Filter */}
        <div>
          <label htmlFor="lead" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Lead
          </label>
          <select
            id="lead"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            value={filters.leadId || ''}
            onChange={handleLeadChange}
          >
            <option value="">All Leads</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
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
                  {status}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
