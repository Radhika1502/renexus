import { useMutation, useQueryClient } from 'react-query';
import { CreateTaskInput, Task } from '../types';
import { api } from '../../../utils/api';

/**
 * Hook for creating a new task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Task, Error, CreateTaskInput>(
    async (newTask) => {
      const response = await api.post('/tasks', newTask);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Invalidate tasks query to refetch the list
        queryClient.invalidateQueries('tasks');
        
        // Add the new task to the cache
        queryClient.setQueryData(['task', data.id], data);
      },
    }
  );

  return {
    createTask: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};
