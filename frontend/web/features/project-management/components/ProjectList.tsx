import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';
import { Project, ProjectFilters as FilterOptions } from '../types';
import { Alert, Button, Skeleton } from '@renexus/ui-components';

interface ProjectListProps {
  teamId?: string;
  onCreateProject?: () => void;
  onSelectProject?: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  teamId,
  onCreateProject,
  onSelectProject,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    teamId: teamId,
    status: ['active', 'planning'],
  });
  
  const { 
    projects, 
    isLoading, 
    isError, 
    refetch 
  } = useProjects(filters);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters({ ...filters, ...newFilters });
  };

  if (isError) {
    return (
      <Alert 
        open={true} 
        title="Error loading projects" 
        description="There was an error loading projects. Please try again."
        onConfirm={() => refetch()}
        onCancel={() => {}}
        onOpenChange={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Projects</h2>
        {onCreateProject && (
          <Button onClick={onCreateProject}>
            Create Project
          </Button>
        )}
      </div>

      <ProjectFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Show skeleton cards while loading
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 shadow-sm">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </div>
          ))
        ) : projects && projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject?.(project)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 border rounded-lg">
            <p className="text-gray-500">No projects found</p>
            {onCreateProject && (
              <Button 
                onClick={onCreateProject}
                className="mt-4"
              >
                Create your first project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
