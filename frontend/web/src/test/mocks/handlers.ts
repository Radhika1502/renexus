import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../config';
import { mockTasks, mockProjects, mockNotifications } from './data';
import { Task, CreateTaskInput, UpdateTaskInput } from '../../types/task';
import { Project, CreateProjectInput, UpdateProjectInput } from '../../types/project';

export const handlers = [
  // Task handlers
  http.get(`${API_BASE_URL}/tasks/:taskId`, ({ params }) => {
    const { taskId } = params;
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return new HttpResponse(
        JSON.stringify({ message: 'Task not found' }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(task);
  }),

  http.get(`${API_BASE_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return HttpResponse.json({
      tasks: mockTasks.slice(start, end),
      total: mockTasks.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockTasks.length / pageSize),
    });
  }),

  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    const taskInput = await request.json() as CreateTaskInput;
    const newTask: Task = {
      id: String(mockTasks.length + 1),
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '1', // Mock user ID
      comments: [],
      ...taskInput,
      tags: taskInput.tags || [],
    };
    mockTasks.push(newTask);
    return HttpResponse.json(newTask);
  }),

  http.patch(`${API_BASE_URL}/tasks/:taskId`, async ({ params, request }) => {
    const { taskId } = params;
    const updates = await request.json() as UpdateTaskInput;
    const taskIndex = mockTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Task not found' }),
        { status: 404 }
      );
    }
    
    const updatedTask: Task = {
      ...mockTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    mockTasks[taskIndex] = updatedTask;
    
    return HttpResponse.json(updatedTask);
  }),

  http.delete(`${API_BASE_URL}/tasks/:taskId`, ({ params }) => {
    const { taskId } = params;
    const taskIndex = mockTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Task not found' }),
        { status: 404 }
      );
    }
    
    mockTasks.splice(taskIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Project handlers
  http.get(`${API_BASE_URL}/projects/:projectId`, ({ params }) => {
    const { projectId } = params;
    const project = mockProjects.find(p => p.id === projectId);
    
    if (!project) {
      return new HttpResponse(
        JSON.stringify({ message: 'Project not found' }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(project);
  }),

  http.get(`${API_BASE_URL}/projects`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return HttpResponse.json({
      projects: mockProjects.slice(start, end),
      total: mockProjects.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockProjects.length / pageSize),
    });
  }),

  http.post(`${API_BASE_URL}/projects`, async ({ request }) => {
    const projectInput = await request.json() as CreateProjectInput;
    const newProject: Project = {
      id: String(mockProjects.length + 1),
      status: 'planning',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '1', // Mock user ID
      ...projectInput,
    };
    mockProjects.push(newProject);
    return HttpResponse.json(newProject);
  }),

  http.patch(`${API_BASE_URL}/projects/:projectId`, async ({ params, request }) => {
    const { projectId } = params;
    const updates = await request.json() as UpdateProjectInput;
    const projectIndex = mockProjects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Project not found' }),
        { status: 404 }
      );
    }
    
    // Ensure status is valid before updating
    const validStatus = ['planning', 'active', 'completed', 'on-hold'] as const;
    const updatedProject: Project = {
      ...mockProjects[projectIndex],
      ...updates,
      status: validStatus.includes(updates.status as any) 
        ? updates.status as Project['status']
        : mockProjects[projectIndex].status,
      updatedAt: new Date().toISOString(),
    };
    mockProjects[projectIndex] = updatedProject;
    
    return HttpResponse.json(updatedProject);
  }),

  http.delete(`${API_BASE_URL}/projects/:projectId`, ({ params }) => {
    const { projectId } = params;
    const projectIndex = mockProjects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Project not found' }),
        { status: 404 }
      );
    }
    
    mockProjects.splice(projectIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Notification handlers
  http.get(`${API_BASE_URL}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return HttpResponse.json({
      notifications: mockNotifications.slice(start, end),
      total: mockNotifications.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockNotifications.length / pageSize),
    });
  }),

  http.patch(`${API_BASE_URL}/notifications/:notificationId/read`, ({ params }) => {
    const { notificationId } = params;
    const notificationIndex = mockNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Notification not found' }),
        { status: 404 }
      );
    }
    
    mockNotifications[notificationIndex] = {
      ...mockNotifications[notificationIndex],
      isRead: true,
    };
    
    return HttpResponse.json(mockNotifications[notificationIndex]);
  }),

  http.patch(`${API_BASE_URL}/notifications/read-all`, () => {
    mockNotifications.forEach(notification => {
      notification.isRead = true;
    });
    
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API_BASE_URL}/notifications/:notificationId`, ({ params }) => {
    const { notificationId } = params;
    const notificationIndex = mockNotifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Notification not found' }),
        { status: 404 }
      );
    }
    
    mockNotifications.splice(notificationIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),
]; 