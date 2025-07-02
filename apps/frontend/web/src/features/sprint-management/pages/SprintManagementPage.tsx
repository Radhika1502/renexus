import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { SprintList } from '../components/SprintList';
import { SprintDetails } from '../components/SprintDetails';
import { SprintForm } from '../components/SprintForm';
import { useCreateSprint } from '../hooks/useSprints';
import { CreateSprintDto } from '../types';
import { useQuery } from 'react-query';
import { api } from '../../../services/api';
import { Select } from '@renexus/ui-components';

interface Project {
  id: string;
  name: string;
}

export const SprintManagementPage: React.FC = () => {
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const createSprint = useCreateSprint();
  const navigate = useNavigate();

  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>(
    ['projects'],
    async () => {
      const response = await api.get('/projects');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleCreateSprint = async (data: CreateSprintDto) => {
    try {
      const newSprint = await createSprint.mutateAsync(data);
      setIsCreatingSprint(false);
      navigate(`/sprints/${newSprint.id}`);
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sprint Management</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Create and manage sprints, track progress, and organize tasks.
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Project
                </label>
                <Select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  className="max-w-md"
                  disabled={isLoadingProjects}
                >
                  <option value="">All Projects</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
                {isLoadingProjects && (
                  <p className="text-sm text-gray-500 mt-1">Loading projects...</p>
                )}
              </div>
              
              <SprintList 
                projectId={selectedProjectId || undefined}
                onCreateSprint={() => setIsCreatingSprint(true)} 
              />
              
              {isCreatingSprint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-semibold mb-4">Create New Sprint</h2>
                    <SprintForm
                      onSubmit={handleCreateSprint}
                      onCancel={() => setIsCreatingSprint(false)}
                      isSubmitting={createSprint.isLoading}
                      projectId={selectedProjectId}
                    />
                  </div>
                </div>
              )}
            </>
          } 
        />
        <Route path="/:sprintId/*" element={<SprintDetails />} />
      </Routes>
    </div>
  );
};
