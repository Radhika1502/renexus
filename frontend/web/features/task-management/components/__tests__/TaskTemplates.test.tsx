import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskTemplates } from '../TaskTemplates';
import { useTaskTemplates, useCreateTaskFromTemplate, useDeleteTaskTemplate } from '../../hooks/useTaskTemplates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskTemplate } from '../../types';

// Mock hooks
jest.mock('../../hooks/useTaskTemplates', () => ({
  useTaskTemplates: jest.fn(),
  useCreateTaskFromTemplate: jest.fn(),
  useDeleteTaskTemplate: jest.fn()
}));

interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

// Mock Dialog component
jest.mock('../../../../components/ui', () => {
  const originalModule = jest.requireActual('../../../../components/ui');
  return {
    ...originalModule,
    Dialog: ({ children, open, onOpenChange, title }: DialogProps) => (
      open ? (
        <div data-testid="dialog" aria-label={title}>
          <button onClick={() => onOpenChange(false)}>Close</button>
          {children}
        </div>
      ) : null
    )
  };
});

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

const createTaskFromTemplateMock = jest.fn();
const deleteTemplateMock = jest.fn();

interface TaskTemplatesProps {
  projectId: string;
  onCreateTask: (taskId: string) => void;
}

const setupComponent = (props: Partial<TaskTemplatesProps> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const defaultProps: TaskTemplatesProps = {
    projectId: 'project-1',
    onCreateTask: jest.fn(),
    ...props
  };
  
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskTemplates {...defaultProps} />
    </QueryClientProvider>
  );
};

describe('TaskTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useTaskTemplates as jest.Mock).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false
    });
    
    (useCreateTaskFromTemplate as jest.Mock).mockReturnValue({
      mutate: createTaskFromTemplateMock,
      isPending: false
    });
    
    (useDeleteTaskTemplate as jest.Mock).mockReturnValue({
      mutate: deleteTemplateMock,
      isPending: false
    });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it('renders loading state correctly', () => {
    (useTaskTemplates as jest.Mock).mockReturnValue({
      isLoading: true,
      isError: false
    });
    
    setupComponent();
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    (useTaskTemplates as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('Failed to load templates')
    });
    
    setupComponent();
    
    expect(screen.getByText('Error loading templates')).toBeInTheDocument();
    expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
  });

  it('renders project templates tab by default', () => {
    setupComponent();
    
    expect(screen.getByText('Task Templates')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Project Templates' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Bug Template')).toBeInTheDocument();
    expect(screen.queryByText('Feature Template')).not.toBeInTheDocument(); // Global template not shown in project tab
  });

  it('switches between project and global templates tabs', () => {
    setupComponent();
    
    // Initially on project tab
    expect(screen.getByText('Bug Template')).toBeInTheDocument();
    expect(screen.queryByText('Feature Template')).not.toBeInTheDocument();
    
    // Switch to global tab
    fireEvent.click(screen.getByRole('tab', { name: 'Global Templates' }));
    
    // Now should show global templates
    expect(screen.queryByText('Bug Template')).not.toBeInTheDocument();
    expect(screen.getByText('Feature Template')).toBeInTheDocument();
  });

  it('opens create template dialog when New Template button is clicked', () => {
    setupComponent();
    
    fireEvent.click(screen.getByText('New Template'));
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog')).toHaveAttribute('aria-label', 'Create Task Template');
  });

  it('creates a task from template when Use button is clicked', () => {
    const onCreateTask = jest.fn();
    setupComponent({ onCreateTask });
    
    // Find the Use button for the Bug Template and click it
    const useButtons = screen.getAllByText('Use');
    fireEvent.click(useButtons[0]);
    
    expect(createTaskFromTemplateMock).toHaveBeenCalledWith(
      { templateId: 'template-1', projectId: 'project-1' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('deletes a template when Delete button is clicked and confirmed', () => {
    setupComponent();
    
    // Find the Delete button for the Bug Template and click it
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?');
    expect(deleteTemplateMock).toHaveBeenCalledWith('template-1');
  });

  it('opens edit template dialog when Edit button is clicked', () => {
    setupComponent();
    
    // Find the Edit button for the Bug Template and click it
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog')).toHaveAttribute('aria-label', 'Edit Task Template');
  });

  it('shows empty state when no templates are available', () => {
    (useTaskTemplates as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false
    });
    
    setupComponent();
    
    expect(screen.getByText('No project templates found')).toBeInTheDocument();
    expect(screen.getByText('Create your first template')).toBeInTheDocument();
  });
});
