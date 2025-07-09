import { useMutation, useQueryClient } from 'react-query';
import { api } from "../../../shared/utils/api";

/**
 * Hook for deleting a project
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>(
    async (projectId) => {
      await api.delete(`/projects/${projectId}`);
    },
    {
      onSuccess: (_, projectId) => {
        // Remove the project from the cache
        queryClient.removeQueries(['project', projectId]);
        
        // Invalidate projects list to refetch without the deleted project
        queryClient.invalidateQueries('projects');
      },
    }
  );

  return {
    deleteProject: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

