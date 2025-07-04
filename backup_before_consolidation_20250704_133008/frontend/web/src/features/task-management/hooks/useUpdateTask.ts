import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateTaskInput, Task } from '../types';
import { apiClient } from "../../../lib/api-client";

const updateTaskFn = async (updateData: UpdateTaskInput): Promise<Task> => {
  const { id, ...data } = updateData;
  const response = await apiClient.patch(`/api/tasks/${id}`, data);
  return response.data as Task;
};

/**
 * Hook for updating an existing task
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateTaskFn,
    onSuccess: (data: Task) => {
      // Update the task in the cache
      queryClient.setQueryData(['task', data.id], data);
      
      // Invalidate tasks list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    updateTask: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

