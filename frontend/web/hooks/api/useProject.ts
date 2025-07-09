import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectApi } from '../../api/project.api';
import { Project, CreateProjectInput, UpdateProjectInput, ProjectFilter, ProjectSort } from '../../types/project';

// Get a single project
export const useProject = (projectId: string) => {
  return useQuery<Project, Error>(['project', projectId], 
    () => projectApi.getProject(projectId), 
    { enabled: !!projectId }
  );
};

// Get a list of projects
export const useProjects = (
  filter?: ProjectFilter,
  sort?: ProjectSort,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery<Project[], Error>(['projects', filter, sort, page, pageSize], 
    () => projectApi.listProjects(filter, sort, page, pageSize)
  );
};

// Create a project
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectInput>(
    (project) => projectApi.createProject(project),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
      },
    }
  );
};

// Update a project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { projectId: string; data: UpdateProjectInput }>(
    ({ projectId, data }) => projectApi.updateProject(projectId, data),
    {
      onSuccess: (updatedProject) => {
        queryClient.invalidateQueries(['project', updatedProject.id]);
        queryClient.invalidateQueries('projects');
      },
    }
  );
};

// Delete a project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    (projectId) => projectApi.deleteProject(projectId),
    {
      onSuccess: (_, projectId) => {
        queryClient.invalidateQueries('projects');
        queryClient.removeQueries(['project', projectId]);
      },
    }
  );
};

// Get project members
export const useProjectMembers = (projectId: string) => {
  return useQuery<any[], Error>(['project-members', projectId], 
    () => projectApi.getProjectMembers(projectId), 
    { enabled: !!projectId }
  );
};

// Add project member
export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { projectId: string; userId: string; role: string }>(
    ({ projectId, userId, role }) => projectApi.addProjectMember(projectId, userId, role),
    {
      onSuccess: (_, { projectId }) => {
        queryClient.invalidateQueries(['project-members', projectId]);
      },
    }
  );
};

// Update project member
export const useUpdateProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { projectId: string; userId: string; role: string }>(
    ({ projectId, userId, role }) => projectApi.updateProjectMember(projectId, userId, role),
    {
      onSuccess: (_, { projectId }) => {
        queryClient.invalidateQueries(['project-members', projectId]);
      },
    }
  );
};

// Remove project member
export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { projectId: string; userId: string }>(
    ({ projectId, userId }) => projectApi.removeProjectMember(projectId, userId),
    {
      onSuccess: (_, { projectId }) => {
        queryClient.invalidateQueries(['project-members', projectId]);
      },
    }
  );
};

// Get project statistics
export const useProjectStats = (projectId: string) => {
  return useQuery<any, Error>(['project-stats', projectId], 
    () => projectApi.getProjectStats(projectId), 
    { enabled: !!projectId }
  );
};

// Get project history
export const useProjectHistory = (projectId: string) => {
  return useQuery<any[], Error>(['project-history', projectId], 
    () => projectApi.getProjectHistory(projectId), 
    { enabled: !!projectId }
  );
}; 