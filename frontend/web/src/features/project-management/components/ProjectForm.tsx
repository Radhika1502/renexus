import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types';
import { useTeams } from '../hooks/useTeams';
import { useUsers } from '../hooks/useUsers';
import { FormWrapper, FormField, Button } from '@renexus/ui-components';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: CreateProjectInput | UpdateProjectInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100),
  key: z.string().min(2, 'Project key must be at least 2 characters').max(10)
    .regex(/^[A-Z0-9]+$/, 'Project key must contain only uppercase letters and numbers'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  leadId: z.string().min(1, 'Project lead is required'),
  teamId: z.string().min(1, 'Team is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { teams } = useTeams();
  const { users } = useUsers();
  const isEditing = !!project;

  const defaultValues = isEditing
    ? {
        name: project.name,
        key: project.key,
        description: project.description,
        leadId: project.lead.id,
        teamId: project.teamId,
        startDate: project.startDate,
        endDate: project.endDate || '',
      }
    : {
        name: '',
        key: '',
        description: '',
        leadId: '',
        teamId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      };

  return (
    <FormWrapper
      schema={projectSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        if (isEditing) {
          onSubmit({
            id: project.id,
            ...data,
          });
        } else {
          onSubmit(data as CreateProjectInput);
        }
      }}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="name"
            label="Project Name"
          >
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter project name"
            />
          </FormField>

          <FormField
            name="key"
            label="Project Key"
          >
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md uppercase"
              placeholder="E.g., PRJ"
              disabled={isEditing} // Cannot edit key after creation
            />
          </FormField>
        </div>

        <FormField
          name="description"
          label="Description"
        >
          <textarea
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
            placeholder="Enter project description"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="teamId"
            label="Team"
          >
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="">Select a team</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            name="leadId"
            label="Project Lead"
          >
            <select className="w-full px-3 py-2 border rounded-md">
              <option value="">Select a project lead</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="startDate"
            label="Start Date"
          >
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>

          <FormField
            name="endDate"
            label="End Date (Optional)"
          >
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>
        </div>

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
            {isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </div>
    </FormWrapper>
  );
};
