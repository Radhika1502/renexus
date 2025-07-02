/**
 * Offline-aware Project Service
 * 
 * This service wraps project-related API calls with offline support,
 * allowing projects to be created, updated, and deleted while offline.
 */

import { OfflineManager } from '../../services/offline/OfflineManager';
import { offlineAwareClient } from '../api/offlineAwareClient';
import { generateUniqueId } from '@packages/shared/utils';

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  teamMembers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  teamMembers: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  teamMembers?: string[];
}

// Local storage keys
const OFFLINE_PROJECTS_KEY = 'offline_projects';
const OFFLINE_PROJECT_OPERATIONS_KEY = 'offline_project_operations';

class OfflineProjectService {
  private offlineManager: OfflineManager;

  constructor() {
    this.offlineManager = OfflineManager.getInstance();
  }

  /**
   * Get all projects with offline support
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      // Try to get projects from API
      const response = await offlineAwareClient.get<Project[]>('/api/projects');
      
      // If online, store the latest projects in local storage
      if (this.offlineManager.isOnline()) {
        localStorage.setItem(OFFLINE_PROJECTS_KEY, JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      // If offline or error, return cached projects
      const cachedProjects = localStorage.getItem(OFFLINE_PROJECTS_KEY);
      if (cachedProjects) {
        return JSON.parse(cachedProjects);
      }
      
      // If no cached projects, return empty array
      return [];
    }
  }

  /**
   * Get a project by ID with offline support
   */
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      // Try to get project from API
      const response = await offlineAwareClient.get<Project>(`/api/projects/${projectId}`);
      return response.data;
    } catch (error) {
      // If offline or error, try to find project in cached projects
      const cachedProjects = localStorage.getItem(OFFLINE_PROJECTS_KEY);
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects) as Project[];
        return projects.find(project => project.id === projectId) || null;
      }
      
      return null;
    }
  }

  /**
   * Create a new project with offline support
   */
  async createProject(projectInput: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    
    // Create a temporary project with a client-generated ID
    const tempProject: Project = {
      id: `temp_${generateUniqueId()}`,
      ...projectInput,
      createdAt: now,
      updatedAt: now
    };
    
    try {
      // Try to create project via API
      const response = await offlineAwareClient.post<Project>('/api/projects', projectInput);
      
      // If successful, update the cached projects
      this.updateCachedProjects(response.data, 'create');
      
      return response.data;
    } catch (error) {
      // If offline, queue the operation and update local cache
      if (!this.offlineManager.isOnline()) {
        this.queueProjectOperation('create', tempProject);
        this.updateCachedProjects(tempProject, 'create');
        
        // Notify that we're working with offline data
        this.offlineManager.notifyOfflineOperation('Project created offline');
      }
      
      return tempProject;
    }
  }

  /**
   * Update a project with offline support
   */
  async updateProject(projectId: string, projectInput: UpdateProjectInput): Promise<Project> {
    try {
      // Try to update project via API
      const response = await offlineAwareClient.put<Project>(`/api/projects/${projectId}`, projectInput);
      
      // If successful, update the cached projects
      this.updateCachedProjects(response.data, 'update');
      
      return response.data;
    } catch (error) {
      // If offline, queue the operation and update local cache
      if (!this.offlineManager.isOnline()) {
        // Get current project data
        const cachedProjects = JSON.parse(localStorage.getItem(OFFLINE_PROJECTS_KEY) || '[]') as Project[];
        const existingProject = cachedProjects.find(p => p.id === projectId);
        
        if (existingProject) {
          // Update the project with new data
          const updatedProject: Project = {
            ...existingProject,
            ...projectInput,
            updatedAt: new Date().toISOString()
          };
          
          this.queueProjectOperation('update', updatedProject);
          this.updateCachedProjects(updatedProject, 'update');
          
          // Notify that we're working with offline data
          this.offlineManager.notifyOfflineOperation('Project updated offline');
          
          return updatedProject;
        }
        
        throw new Error('Project not found in offline cache');
      }
      
      throw error;
    }
  }

  /**
   * Delete a project with offline support
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      // Try to delete project via API
      await offlineAwareClient.delete(`/api/projects/${projectId}`);
      
      // If successful, update the cached projects
      this.updateCachedProjects({ id: projectId } as Project, 'delete');
    } catch (error) {
      // If offline, queue the operation and update local cache
      if (!this.offlineManager.isOnline()) {
        // Get current project data for the queue
        const cachedProjects = JSON.parse(localStorage.getItem(OFFLINE_PROJECTS_KEY) || '[]') as Project[];
        const existingProject = cachedProjects.find(p => p.id === projectId);
        
        if (existingProject) {
          this.queueProjectOperation('delete', existingProject);
          this.updateCachedProjects({ id: projectId } as Project, 'delete');
          
          // Notify that we're working with offline data
          this.offlineManager.notifyOfflineOperation('Project deleted offline');
          
          return;
        }
        
        throw new Error('Project not found in offline cache');
      }
      
      throw error;
    }
  }

  /**
   * Sync all offline project operations when back online
   */
  async syncOfflineProjects(): Promise<void> {
    if (!this.offlineManager.isOnline()) {
      return;
    }
    
    const operations = this.getQueuedOperations();
    if (operations.length === 0) {
      return;
    }
    
    this.offlineManager.notifySync('Syncing projects...');
    
    // Process operations in order
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create':
            // For create operations, we need to remove the temp_ prefix from the ID
            const createData = { ...operation.data };
            delete createData.id;
            await offlineAwareClient.post('/api/projects', createData);
            break;
            
          case 'update':
            const updateData = { ...operation.data };
            const updateId = updateData.id;
            delete updateData.id;
            delete updateData.createdAt;
            delete updateData.updatedAt;
            await offlineAwareClient.put(`/api/projects/${updateId}`, updateData);
            break;
            
          case 'delete':
            await offlineAwareClient.delete(`/api/projects/${operation.data.id}`);
            break;
        }
        
        // Remove the operation from the queue after successful processing
        this.removeOperationFromQueue(operation);
      } catch (error) {
        console.error(`Failed to sync project operation: ${operation.type}`, error);
        this.offlineManager.notifyError(`Failed to sync project: ${operation.data.name || operation.data.id}`);
      }
    }
    
    // After all operations are processed, refresh the projects from the server
    try {
      const response = await offlineAwareClient.get<Project[]>('/api/projects');
      localStorage.setItem(OFFLINE_PROJECTS_KEY, JSON.stringify(response.data));
      this.offlineManager.notifySync('Projects synced successfully');
    } catch (error) {
      console.error('Failed to refresh projects after sync', error);
      this.offlineManager.notifyError('Failed to refresh projects after sync');
    }
  }

  /**
   * Update the cached projects based on an operation
   */
  private updateCachedProjects(project: Project, operationType: 'create' | 'update' | 'delete'): void {
    const cachedProjectsStr = localStorage.getItem(OFFLINE_PROJECTS_KEY);
    const cachedProjects = cachedProjectsStr ? JSON.parse(cachedProjectsStr) as Project[] : [];
    
    switch (operationType) {
      case 'create':
        cachedProjects.push(project);
        break;
        
      case 'update':
        const updateIndex = cachedProjects.findIndex(p => p.id === project.id);
        if (updateIndex !== -1) {
          cachedProjects[updateIndex] = project;
        }
        break;
        
      case 'delete':
        const deleteIndex = cachedProjects.findIndex(p => p.id === project.id);
        if (deleteIndex !== -1) {
          cachedProjects.splice(deleteIndex, 1);
        }
        break;
    }
    
    localStorage.setItem(OFFLINE_PROJECTS_KEY, JSON.stringify(cachedProjects));
  }

  /**
   * Queue a project operation for later sync
   */
  private queueProjectOperation(
    type: 'create' | 'update' | 'delete',
    data: Project
  ): void {
    const operations = this.getQueuedOperations();
    
    // Add the new operation to the queue
    operations.push({
      id: generateUniqueId(),
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Save the updated queue
    localStorage.setItem(OFFLINE_PROJECT_OPERATIONS_KEY, JSON.stringify(operations));
    
    // Register with the offline manager for sync when back online
    this.offlineManager.registerSyncFunction(() => this.syncOfflineProjects());
  }

  /**
   * Get all queued project operations
   */
  private getQueuedOperations(): Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    data: Project;
    timestamp: string;
  }> {
    const operationsStr = localStorage.getItem(OFFLINE_PROJECT_OPERATIONS_KEY);
    return operationsStr ? JSON.parse(operationsStr) : [];
  }

  /**
   * Remove an operation from the queue
   */
  private removeOperationFromQueue(operation: {
    id: string;
    type: 'create' | 'update' | 'delete';
    data: Project;
    timestamp: string;
  }): void {
    const operations = this.getQueuedOperations();
    const updatedOperations = operations.filter(op => op.id !== operation.id);
    localStorage.setItem(OFFLINE_PROJECT_OPERATIONS_KEY, JSON.stringify(updatedOperations));
  }
}

// Export singleton instance
export const offlineProjectService = new OfflineProjectService();
