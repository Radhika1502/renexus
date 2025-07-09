import { renderHook, act } from '@testing-library/react-hooks';
import { 
  useTaskTemplates, 
  useTaskTemplate, 
  useCreateTaskTemplate, 
  useUpdateTaskTemplate, 
  useDeleteTaskTemplate,
  useCreateTaskFromTemplate
} from '../useTaskTemplates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { TaskTemplate, TaskTemplateInput, TaskTemplateUpdate } from '../../types';

// Mock API
jest.mock('../../../../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock task template data
const mockTemplates: TaskTemplate[] = [
  {
    id: 'template-1',
    name: 'Bug Template',
    description: 'Template for bug reports',
    status: 'todo',
    priority: 'high',
    estimatedHours: 2,
    labels: ['bug', 'issue'],
    createdBy: 'user-1',
    projectId: 'project-1',
    isGlobal: false,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z'
  },
  {
    id: 'template-2',
    name: 'Feature Template',
    description: 'Template for new features',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 8,
    labels: ['feature', 'enhancement'],
    createdBy: 'user-1',
    projectId: undefined,
    isGlobal: true,
    createdAt: '2025-06-02T00:00:00Z',
    updatedAt: '2025-06-02T00:00:00Z'
  }
];

// Setup wrapper for hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTaskTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches all templates when no projectId is provided', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockTemplates });
    
    const { result, waitFor } = renderHook(() => useTaskTemplates(), {
      wrapper: createWrapper(),
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.get).toHaveBeenCalledWith('/task-templates');
    expect(result.current.data).toEqual(mockTemplates);
  });

  it('fetches project-specific templates when projectId is provided', async () => {
    const projectId = 'project-1';
    const projectTemplates = mockTemplates.filter(t => t.projectId === projectId);
    
    (api.get as jest.Mock).mockResolvedValueOnce({ data: projectTemplates });
    
    const { result, waitFor } = renderHook(() => useTaskTemplates(projectId), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.get).toHaveBeenCalledWith(`/task-templates?projectId=${projectId}`);
    expect(result.current.data).toEqual(projectTemplates);
  });
});

describe('useTaskTemplate', () => {
  it('fetches a single template by id', async () => {
    const templateId = 'template-1';
    const template = mockTemplates.find(t => t.id === templateId);
    
    (api.get as jest.Mock).mockResolvedValueOnce({ data: template });
    
    const { result, waitFor } = renderHook(() => useTaskTemplate(templateId), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.get).toHaveBeenCalledWith(`/task-templates/${templateId}`);
    expect(result.current.data).toEqual(template);
  });

  it('does not fetch when templateId is not provided', () => {
    const { result } = renderHook(() => useTaskTemplate(''), {
      wrapper: createWrapper(),
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe('useCreateTaskTemplate', () => {
  it('creates a new task template', async () => {
    const newTemplate: TaskTemplateInput = {
      name: 'New Template',
      description: 'A new template',
      status: 'todo',
      priority: 'medium',
      isGlobal: false,
      projectId: 'project-1'
    };
    
    const createdTemplate: TaskTemplate = {
      ...newTemplate,
      id: 'template-3',
      createdBy: 'user-1',
      labels: [],
      estimatedHours: 0,
      createdAt: '2025-06-27T00:00:00Z',
      updatedAt: '2025-06-27T00:00:00Z'
    };
    
    (api.post as jest.Mock).mockResolvedValueOnce({ data: createdTemplate });
    
    const { result, waitFor } = renderHook(() => useCreateTaskTemplate(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.mutate(newTemplate);
    });
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.post).toHaveBeenCalledWith('/task-templates', newTemplate);
    expect(result.current.data).toEqual(createdTemplate);
  });
});

describe('useUpdateTaskTemplate', () => {
  it('updates an existing task template', async () => {
    const templateId = 'template-1';
    const updateData: TaskTemplateUpdate = {
      id: templateId,
      name: 'Updated Bug Template',
      description: 'Updated description'
    };
    
    const updatedTemplate: TaskTemplate = {
      ...mockTemplates.find(t => t.id === templateId)!,
      ...updateData,
      updatedAt: '2025-06-27T00:00:00Z'
    };
    
    (api.patch as jest.Mock).mockResolvedValueOnce({ data: updatedTemplate });
    
    const { result, waitFor } = renderHook(() => useUpdateTaskTemplate(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.mutate(updateData);
    });
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.patch).toHaveBeenCalledWith(`/task-templates/${templateId}`, {
      name: updateData.name,
      description: updateData.description
    });
    expect(result.current.data).toEqual(updatedTemplate);
  });
});

describe('useDeleteTaskTemplate', () => {
  it('deletes a task template', async () => {
    const templateId = 'template-1';
    
    (api.delete as jest.Mock).mockResolvedValueOnce({});
    
    const { result, waitFor } = renderHook(() => useDeleteTaskTemplate(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.mutate(templateId);
    });
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.delete).toHaveBeenCalledWith(`/task-templates/${templateId}`);
  });
});

describe('useCreateTaskFromTemplate', () => {
  it('creates a task from a template', async () => {
    const templateId = 'template-1';
    const projectId = 'project-1';
    const customFields = { field1: 'value1' };
    
    const createdTask = {
      id: 'task-1',
      title: 'Bug Report',
      description: 'From template',
      status: 'todo',
      priority: 'high',
      projectId,
      createdAt: '2025-06-27T00:00:00Z',
      updatedAt: '2025-06-27T00:00:00Z'
    };
    
    (api.post as jest.Mock).mockResolvedValueOnce({ data: createdTask });
    
    const { result, waitFor } = renderHook(() => useCreateTaskFromTemplate(), {
      wrapper: createWrapper(),
    });
    
    act(() => {
      result.current.mutate({ templateId, projectId, customFields });
    });
    
    await waitFor(() => result.current.isSuccess);
    
    expect(api.post).toHaveBeenCalledWith(`/task-templates/${templateId}/create`, {
      projectId,
      customFields
    });
    expect(result.current.data).toEqual(createdTask);
  });
});
