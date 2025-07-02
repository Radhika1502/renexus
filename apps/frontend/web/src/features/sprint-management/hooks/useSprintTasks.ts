import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sprintService } from '../api/sprintService';
import { AddTaskToSprintDto, SprintTask } from '../types';
import { sprintKeys } from './useSprints';

// Hooks for fetching sprint tasks
export const useSprintTasks = (sprintId: string) => {
  return useQuery(
    sprintKeys.tasks(sprintId),
    () => sprintService.getSprintTasks(sprintId),
    {
      enabled: Boolean(sprintId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

// Hook for adding a task to a sprint
export const useAddTaskToSprint = (sprintId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: AddTaskToSprintDto) => sprintService.addTaskToSprint(sprintId, data),
    {
      onSuccess: (newSprintTask) => {
        // Update the sprint tasks cache
        queryClient.setQueryData(
          sprintKeys.tasks(sprintId),
          (old: SprintTask[] | undefined) => old ? [...old, newSprintTask] : [newSprintTask]
        );
        
        // Invalidate sprint stats as they will have changed
        queryClient.invalidateQueries(sprintKeys.stats(sprintId));
      },
    }
  );
};

// Hook for removing a task from a sprint
export const useRemoveTaskFromSprint = (sprintId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (taskId: string) => sprintService.removeTaskFromSprint(sprintId, taskId),
    {
      onSuccess: (_, taskId) => {
        // Update the sprint tasks cache by removing the task
        queryClient.setQueryData(
          sprintKeys.tasks(sprintId),
          (old: SprintTask[] | undefined) => 
            old ? old.filter(task => task.taskId !== taskId) : []
        );
        
        // Invalidate sprint stats as they will have changed
        queryClient.invalidateQueries(sprintKeys.stats(sprintId));
      },
    }
  );
};

// Hook for fetching sprint statistics
export const useSprintStats = (sprintId: string) => {
  return useQuery(
    sprintKeys.stats(sprintId),
    () => sprintService.getSprintStats(sprintId),
    {
      enabled: Boolean(sprintId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

// Hook for fetching sprint velocity for a project
export const useSprintVelocity = (projectId: string) => {
  return useQuery(
    ['projects', projectId, 'sprint-velocity'],
    () => sprintService.getSprintVelocity(projectId),
    {
      enabled: Boolean(projectId),
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};
