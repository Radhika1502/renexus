import { useMutation, useQueryClient } from 'react-query';
import { api } from "../../../shared/utils/api";

/**
 * Hook for deleting a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, string>(
    async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
    },
    {
      onSuccess: (_, taskId) => {
        // Remove the task from the cache
        queryClient.removeQueries(['task', taskId]);
        
        // Invalidate tasks list to refetch without the deleted task
        queryClient.invalidateQueries('tasks');
      },
    }
  );

  return {
    deleteTask: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

