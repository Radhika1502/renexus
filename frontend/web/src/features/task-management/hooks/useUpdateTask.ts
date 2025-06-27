import { useMutation, useQueryClient } from 'react-query';
import { UpdateTaskInput, Task } from '../types';
import { api } from '../../../utils/api';

/**
 * Hook for updating an existing task
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Task, Error, UpdateTaskInput>(
    async (updateData) => {
      const { id, ...data } = updateData;
      const response = await api.patch(`/tasks/${id}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update the task in the cache
        queryClient.setQueryData(['task', data.id], data);
        
        // Invalidate tasks list to refetch with updated data
        queryClient.invalidateQueries('tasks');
      },
    }
  );

  return {
    updateTask: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};
