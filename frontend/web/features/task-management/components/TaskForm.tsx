import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '../types';
import { useUsers } from '../../project-management/hooks/useUsers';
import { useProjects } from '../../project-management/hooks/useProjects';
import { FormWrapper, FormField, Button } from '@renexus/ui-components';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['backlog', 'todo', 'inProgress', 'review', 'done']),
  priority: z.enum(['lowest', 'low', 'medium', 'high', 'highest']),
  assigneeId: z.string().optional(),
  reporterId: z.string().min(1, 'Reporter is required'),
  projectId: z.string().min(1, 'Project is required'),
  epicId: z.string().optional(),
  sprintId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  labels: z.array(z.string()).optional(),
});

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { users } = useUsers();
  const { projects } = useProjects();
  const isEditing = !!task;

  const defaultValues = isEditing
    ? {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId || '',
        reporterId: task.reporterId,
        projectId: task.projectId,
        epicId: task.epicId || '',
        sprintId: task.sprintId || '',
        dueDate: task.dueDate || '',
        estimatedHours: task.estimatedHours || 0,
        labels: task.labels || [],
      }
    : {
        title: '',
        description: '',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        assigneeId: '',
        reporterId: '', // Will be set to current user
        projectId: projectId || '',
        epicId: '',
        sprintId: '',
        dueDate: '',
        estimatedHours: 0,
        labels: [],
      };

  const statusOptions: TaskStatus[] = ['backlog', 'todo', 'inProgress', 'review', 'done'];
  const priorityOptions: TaskPriority[] = ['highest', 'high', 'medium', 'low', 'lowest'];

  return (
    <FormWrapper
      schema={taskSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        if (isEditing) {
          onSubmit({
            id: task.id,
            ...data,
          });
        } else {
          onSubmit(data as CreateTaskInput);
        }
      }}
    >
      <div className="space-y-4">
        <FormField
          name="title"
          label="Task Title"
        >
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter task title"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="projectId"
            label="Project"
          >
            <select 
              className="w-full px-3 py-2 border rounded-md"
              disabled={!!projectId} // Disable if projectId is provided as prop
            >
              <option value="">Select a project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            name="status"
            label="Status"
          >
            <select className="w-full px-3 py-2 border rounded-md">
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'inProgress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="assigneeId"
            label="Assignee"
          >
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="">Unassigned</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            name="priority"
            label="Priority"
          >
            <select className="w-full px-3 py-2 border rounded-md">
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          name="description"
          label="Description"
        >
          <textarea
            className="w-full px-3 py-2 border rounded-md min-h-[150px]"
            placeholder="Enter task description"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="dueDate"
            label="Due Date (Optional)"
          >
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>

          <FormField
            name="estimatedHours"
            label="Estimated Hours (Optional)"
          >
            <input
              type="number"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>
        </div>

        <FormField
          name="labels"
          label="Labels (Optional)"
        >
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter labels separated by commas"
          />
        </FormField>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </div>
    </FormWrapper>
  );
};
