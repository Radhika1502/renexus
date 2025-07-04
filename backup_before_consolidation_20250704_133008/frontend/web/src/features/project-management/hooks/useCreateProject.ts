import { useMutation, useQueryClient } from 'react-query';
import { CreateProjectInput, Project } from '../types';
import { api } from "../../../shared/utils/api";

/**
 * Hook for creating a new project
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Project, Error, CreateProjectInput>(
    async (newProject) => {
      const response = await api.post('/projects', newProject);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Invalidate projects query to refetch the list
        queryClient.invalidateQueries('projects');
        
        // Add the new project to the cache
        queryClient.setQueryData(['project', data.id], data);
      },
    }
  );

  return {
    createProject: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

