import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { BulkOperationPayload, BulkOperationResult  } from "../../../shared/types/bulkOperations";
import { useState } from 'react';
import { useToast } from '../../../hooks/useToast';

/**
 * Hook for performing bulk operations on tasks
 */
export const useBulkOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate, isPending, isError, error, reset } = useMutation<
    BulkOperationResult,
    Error,
    BulkOperationPayload
  >({
    mutationFn: async (payload: BulkOperationPayload) => {
      const response = await api.post('/tasks/bulk', payload);
      return response.data;
    },
    onSuccess: (result, variables) => {
      // Invalidate tasks queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // If specific tasks were affected, invalidate their individual queries
      variables.taskIds.forEach(taskId => {
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      });
      
      // Show success toast with result information
      toast({
        title: 'Bulk operation completed',
        description: `Successfully processed ${result.successful} tasks${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        variant: result.failed > 0 ? 'warning' : 'default',
      });
      
      // If operation was move-project, invalidate the project tasks queries
      if (variables.operation === 'move-project' && variables.data?.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: ['tasks', { projectId: variables.data.projectId }] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Bulk operation failed',
        description: error.message || 'An error occurred while processing tasks',
        variant: 'destructive',
      });
    },
  });

  return {
    performBulkOperation: mutate,
    isPending,
    isError,
    error,
    reset,
  };
};

/**
 * Hook for managing bulk selection state
 */
export const useBulkSelection = () => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    if (isSelectMode) {
      // Clear selection when exiting select mode
      setSelectedTaskIds([]);
    }
  };
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const selectAll = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };
  
  const clearSelection = () => {
    setSelectedTaskIds([]);
  };
  
  const isSelected = (taskId: string) => {
    return selectedTaskIds.includes(taskId);
  };
  
  return {
    selectedTaskIds,
    isSelectMode,
    toggleSelectMode,
    toggleTaskSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectionCount: selectedTaskIds.length,
  };
};

