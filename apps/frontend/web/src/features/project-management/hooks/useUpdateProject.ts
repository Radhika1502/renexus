import { useMutation, useQueryClient } from 'react-query';
import { UpdateProjectInput, Project } from '../types';
import { api } from "../../../shared/utils/api";

/**
 * Hook for updating an existing project
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Project, Error, UpdateProjectInput>(
    async (updateData) => {
      const { id, ...data } = updateData;
      const response = await api.patch(`/projects/${id}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update the project in the cache
        queryClient.setQueryData(['project', data.id], data);
        
        // Invalidate projects list to refetch with updated data
        queryClient.invalidateQueries('projects');
      },
    }
  );

  return {
    updateProject: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

