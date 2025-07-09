import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Input, Textarea, DatePicker, Select } from '@renexus/ui-components';
import { Sprint, CreateSprintDto, UpdateSprintDto } from '../types';
import { useQuery } from 'react-query';
import { api } from '../../../services/api';

interface Project {
  id: string;
  name: string;
}

// Schema for form validation
const createSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required'),
  projectId: z.string().min(1, 'Project is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  goal: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type SprintFormValues = z.infer<typeof createSprintSchema>;

interface SprintFormProps {
  sprint?: Sprint;
  onSubmit: (data: CreateSprintDto | UpdateSprintDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  projectId?: string; // Optional: pre-select project
}

export const SprintForm: React.FC<SprintFormProps> = ({
  sprint,
  onSubmit,
  onCancel,
  isSubmitting,
  projectId,
}) => {
  // Fetch projects for dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>(
    ['projects'],
    async () => {
      const response = await api.get('/projects');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SprintFormValues>({
    resolver: zodResolver(createSprintSchema),
    defaultValues: sprint
      ? {
          name: sprint.name,
          projectId: sprint.projectId,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal || '',
        }
      : {
          name: '',
          projectId: projectId || '',
          startDate: '',
          endDate: '',
          goal: '',
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="Sprint Name"
        error={errors.name?.message}
      >
        <Input
          {...register('name')}
          placeholder="Enter sprint name"
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        label="Project"
        error={errors.projectId?.message}
      >
        <Select
          {...register('projectId')}
          disabled={isSubmitting || Boolean(projectId) || Boolean(sprint)}
        >
          <option value="">Select a project</option>
          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        {isLoadingProjects && (
          <p className="text-sm text-gray-500 mt-1">Loading projects...</p>
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Start Date"
          error={errors.startDate?.message}
        >
          <DatePicker
            name="startDate"
            control={control}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="End Date"
          error={errors.endDate?.message}
        >
          <DatePicker
            name="endDate"
            control={control}
            disabled={isSubmitting}
          />
        </FormField>
      </div>

      <FormField
        label="Sprint Goal (optional)"
        error={errors.goal?.message}
      >
        <Textarea
          {...register('goal')}
          placeholder="What do you want to achieve in this sprint?"
          rows={3}
          disabled={isSubmitting}
        />
      </FormField>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {sprint ? 'Update Sprint' : 'Create Sprint'}
        </Button>
      </div>
    </form>
  );
};
