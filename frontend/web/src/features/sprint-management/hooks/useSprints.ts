import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sprintService } from '../api/sprintService';
import { CreateSprintDto, UpdateSprintDto, Sprint } from '../types';

// Query keys
export const sprintKeys = {
  all: ['sprints'] as const,
  lists: () => [...sprintKeys.all, 'list'] as const,
  list: (filters: { projectId?: string }) => 
    [...sprintKeys.lists(), filters] as const,
  details: () => [...sprintKeys.all, 'detail'] as const,
  detail: (id: string) => [...sprintKeys.details(), id] as const,
  tasks: (sprintId: string) => [...sprintKeys.detail(sprintId), 'tasks'] as const,
  stats: (sprintId: string) => [...sprintKeys.detail(sprintId), 'stats'] as const,
};

// Hooks for fetching sprints
export const useSprints = (projectId?: string) => {
  return useQuery(
    sprintKeys.list({ projectId }),
    () => sprintService.getAllSprints(projectId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useSprint = (id: string) => {
  return useQuery(
    sprintKeys.detail(id),
    () => sprintService.getSprint(id),
    {
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

// Hooks for mutating sprints
export const useCreateSprint = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: CreateSprintDto) => sprintService.createSprint(data),
    {
      onSuccess: (newSprint) => {
        // Invalidate all sprint lists
        queryClient.invalidateQueries(sprintKeys.lists());
        
        // Optimistically add the new sprint to any project-specific list
        queryClient.setQueryData(
          sprintKeys.list({ projectId: newSprint.projectId }),
          (old: Sprint[] | undefined) => old ? [...old, newSprint] : [newSprint]
        );
      },
    }
  );
};

export const useUpdateSprint = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: UpdateSprintDto) => sprintService.updateSprint(id, data),
    {
      onSuccess: (updatedSprint) => {
        // Update the sprint in the cache
        queryClient.setQueryData(sprintKeys.detail(id), updatedSprint);
        
        // Invalidate all sprint lists that might include this sprint
        queryClient.invalidateQueries(sprintKeys.lists());
      },
    }
  );
};

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => sprintService.deleteSprint(id),
    {
      onSuccess: (_, deletedSprintId) => {
        // Remove the sprint from the cache
        queryClient.removeQueries(sprintKeys.detail(deletedSprintId));
        
        // Invalidate all sprint lists
        queryClient.invalidateQueries(sprintKeys.lists());
      },
    }
  );
};

// Hooks for sprint status changes
export const useStartSprint = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => sprintService.startSprint(id),
    {
      onSuccess: (updatedSprint) => {
        queryClient.setQueryData(sprintKeys.detail(id), updatedSprint);
        queryClient.invalidateQueries(sprintKeys.lists());
      },
    }
  );
};

export const useCompleteSprint = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => sprintService.completeSprint(id),
    {
      onSuccess: (updatedSprint) => {
        queryClient.setQueryData(sprintKeys.detail(id), updatedSprint);
        queryClient.invalidateQueries(sprintKeys.lists());
      },
    }
  );
};

export const useCancelSprint = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => sprintService.cancelSprint(id),
    {
      onSuccess: (updatedSprint) => {
        queryClient.setQueryData(sprintKeys.detail(id), updatedSprint);
        queryClient.invalidateQueries(sprintKeys.lists());
      },
    }
  );
};
