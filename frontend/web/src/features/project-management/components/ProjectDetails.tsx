import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { useProject } from '../hooks/useProject';
import { ProjectHeader } from './ProjectHeader';
import { Alert, Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from '@renexus/ui-components';
import { formatDate } from '../utils';

interface ProjectDetailsProps {
  projectId: string;
  onEdit?: (project: Project) => void;
  onBack?: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  projectId,
  onEdit,
  onBack,
}) => {
  const { project, isLoading, isError, refetch } = useProject(projectId);
  const [activeTab, setActiveTab] = useState('overview');

  if (isError) {
    return (
      <Alert
        open={true}
        title="Error loading project"
        description="There was an error loading the project details. Please try again."
        onConfirm={() => refetch()}
        onCancel={() => onBack?.()}
        onOpenChange={() => {}}
      />
    );
  }

  if (isLoading || !project) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader 
        project={project} 
        onEdit={() => onEdit?.(project)}
        onBack={onBack}
      />

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Project Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Key</p>
                  <p className="font-medium">{project.key}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 capitalize">
                    {project.status}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lead</p>
                  <div className="flex items-center">
                    {project.lead.avatar ? (
                      <img 
                        src={project.lead.avatar} 
                        alt={project.lead.name} 
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                        {project.lead.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{project.lead.name}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                    <p>{formatDate(project.startDate)}</p>
                  </div>
                  
                  {project.endDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                      <p>{formatDate(project.endDate)}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p>{formatDate(project.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Description</h3>
              <p className="whitespace-pre-line">{project.description}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Tasks</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Task management will be implemented in the next phase.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Team Members</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Team management will be implemented in the next phase.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Activity Log</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Activity tracking will be implemented in the next phase.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
