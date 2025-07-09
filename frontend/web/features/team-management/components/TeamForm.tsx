import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Input, Textarea } from '@renexus/ui-components';
import { Team } from '../types';

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  department: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  team?: Team;
  onSubmit: (data: TeamFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const TeamForm: React.FC<TeamFormProps> = ({
  team,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: team
      ? {
          name: team.name,
          description: team.description || '',
          department: team.department || '',
        }
      : {
          name: '',
          description: '',
          department: '',
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="Team Name"
        error={errors.name?.message}
      >
        <Input
          {...register('name')}
          placeholder="Enter team name"
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        label="Department"
        error={errors.department?.message}
      >
        <Input
          {...register('department')}
          placeholder="Enter department name (optional)"
          disabled={isSubmitting}
        />
      </FormField>

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <Textarea
          {...register('description')}
          placeholder="Enter team description (optional)"
          rows={4}
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
          {team ? 'Update Team' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
};
