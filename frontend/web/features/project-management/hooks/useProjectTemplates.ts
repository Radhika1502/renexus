import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { ProjectTemplate } from '../types';

/**
 * Hook to fetch all project templates
 */
export const useProjectTemplates = () => {
  return useQuery<ProjectTemplate[], Error>({
    queryKey: ['projectTemplates'],
    queryFn: projectService.getTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch a specific project template
 * @param templateId The ID of the template to fetch
 */
export const useProjectTemplate = (templateId: string) => {
  return useQuery<ProjectTemplate, Error>({
    queryKey: ['projectTemplate', templateId],
    queryFn: () => projectService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to create a new project template from an existing project
 */
export const useCreateProjectTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      projectId, 
      name, 
      description 
    }: { 
      projectId: string; 
      name: string; 
      description: string;
    }) => projectService.createTemplate(projectId, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTemplates'] });
    },
  });
};

/**
 * Hook to apply a template to create a new project
 */
export const useApplyProjectTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      templateId, 
      projectName 
    }: { 
      templateId: string; 
      projectName: string;
    }) => projectService.applyTemplate(templateId, projectName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
