import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskTemplateForm } from '../TaskTemplateForm';
import { useCreateTaskTemplate, useUpdateTaskTemplate } from '../../hooks/useTaskTemplates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
jest.mock('../../hooks/useTaskTemplates', () => ({
  useCreateTaskTemplate: jest.fn(),
  useUpdateTaskTemplate: jest.fn()
}));

const mockTemplate = {
  id: 'template-1',
  name: 'Bug Template',
  description: 'Template for bug reports',
  status: 'todo' as const,
  priority: 'high' as const,
  estimatedHours: 2,
  labels: ['bug', 'issue'],
  customFields: [
    {
      id: 'field-1',
      name: 'Severity',
      type: 'select' as const,
      options: ['Low', 'Medium', 'High', 'Critical'],
      required: true
    }
  ],
  subtasks: [
    {
      title: 'Reproduce issue',
      description: 'Steps to reproduce',
      status: 'todo' as const,
      priority: 'high' as const,
      estimatedHours: 0.5
    }
  ],
  createdBy: 'user-1',
  projectId: 'project-1',
  isGlobal: false,
  createdAt: '2025-06-01T00:00:00Z',
  updatedAt: '2025-06-01T00:00:00Z'
};

const createTemplateMock = jest.fn();
const updateTemplateMock = jest.fn();

const setupComponent = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const defaultProps = {
    projectId: 'project-1',
    onSuccess: jest.fn(),
    onCancel: jest.fn()
  };
  
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskTemplateForm {...defaultProps} {...props} />
    </QueryClientProvider>
  );
};

describe('TaskTemplateForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useCreateTaskTemplate as jest.Mock).mockReturnValue({
      mutate: createTemplateMock,
      isPending: false
    });
    
    (useUpdateTaskTemplate as jest.Mock).mockReturnValue({
      mutate: updateTemplateMock,
      isPending: false
    });
  });

  it('renders create form with empty fields by default', () => {
    setupComponent();
    
    expect(screen.getByLabelText(/Template Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    expect(screen.getByText(/Create Template/i)).toBeInTheDocument();
  });

  it('renders edit form with template data when template is provided', () => {
    setupComponent({ template: mockTemplate });
    
    expect(screen.getByLabelText(/Template Name/i)).toHaveValue('Bug Template');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Template for bug reports');
    expect(screen.getByText(/Update Template/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    setupComponent({ onCancel });
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('submits form with correct data when creating a template', async () => {
    const onSuccess = jest.fn();
    setupComponent({ onSuccess });
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Template Name/i), {
      target: { value: 'New Template' }
    });
    
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'A new template description' }
    });
    
    fireEvent.change(screen.getByLabelText(/Estimated Hours/i), {
      target: { value: '4' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText(/Create Template/i));
    
    expect(createTemplateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Template',
        description: 'A new template description',
        estimatedHours: 4,
        status: 'todo',
        priority: 'medium',
        isGlobal: false,
        projectId: 'project-1'
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function)
      })
    );
  });

  it('submits form with correct data when updating a template', async () => {
    const onSuccess = jest.fn();
    setupComponent({ template: mockTemplate, onSuccess });
    
    // Modify form
    fireEvent.change(screen.getByLabelText(/Template Name/i), {
      target: { value: 'Updated Template' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText(/Update Template/i));
    
    expect(updateTemplateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'template-1',
        name: 'Updated Template',
        description: 'Template for bug reports',
        status: 'todo',
        priority: 'high',
        estimatedHours: 2,
        isGlobal: false
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function)
      })
    );
  });

  it('adds and removes labels', () => {
    setupComponent();
    
    // Add a label
    fireEvent.change(screen.getByPlaceholderText('Add a label'), {
      target: { value: 'new-label' }
    });
    
    fireEvent.click(screen.getByText('Add'));
    
    expect(screen.getByText('new-label')).toBeInTheDocument();
    
    // Remove the label
    fireEvent.click(screen.getByText('new-label').nextSibling as Element);
    
    expect(screen.queryByText('new-label')).not.toBeInTheDocument();
  });

  it('adds and removes subtasks', () => {
    setupComponent();
    
    // Initially no subtasks
    expect(screen.getByText('No subtasks defined')).toBeInTheDocument();
    
    // Add a subtask
    fireEvent.click(screen.getByText('Add Subtask'));
    
    // Should now have a subtask form
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    
    // Fill out subtask
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Test subtask' }
    });
    
    // Remove the subtask
    const removeButtons = screen.getAllByRole('button', { name: '' });
    const removeSubtaskButton = removeButtons.find(button => 
      button.querySelector('svg[data-testid="trash2-icon"]')
    );
    
    fireEvent.click(removeSubtaskButton as Element);
    
    // Should be back to no subtasks
    expect(screen.getByText('No subtasks defined')).toBeInTheDocument();
  });

  it('adds and removes custom fields', () => {
    setupComponent();
    
    // Initially no custom fields
    expect(screen.getByText('No custom fields defined')).toBeInTheDocument();
    
    // Add a custom field
    fireEvent.click(screen.getByText('Add Field'));
    
    // Should now have a custom field form
    expect(screen.getByText('Field 1')).toBeInTheDocument();
    
    // Fill out custom field
    fireEvent.change(screen.getAllByLabelText(/Name/i)[0], {
      target: { value: 'Test field' }
    });
    
    // Remove the custom field
    const removeButtons = screen.getAllByRole('button', { name: '' });
    const removeFieldButton = removeButtons.find(button => 
      button.querySelector('svg[data-testid="trash2-icon"]')
    );
    
    fireEvent.click(removeFieldButton as Element);
    
    // Should be back to no custom fields
    expect(screen.getByText('No custom fields defined')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    (useCreateTaskTemplate as jest.Mock).mockReturnValue({
      mutate: createTemplateMock,
      isPending: true
    });
    
    setupComponent();
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creating.../i })).toBeDisabled();
  });

  it('toggles global template switch', () => {
    setupComponent();
    
    // Initially false
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
    
    // Toggle to true
    fireEvent.click(switchElement);
    
    expect(switchElement).toBeChecked();
  });
});
