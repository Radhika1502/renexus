import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Select } from '@renexus/ui-components';
import { useAddTeamMember } from '../hooks/useTeamMembers';
import { TeamRole } from '../types';
import { useQuery } from 'react-query';
import { api } from '../../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

const memberSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  role: z.nativeEnum(TeamRole),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface TeamMemberFormProps {
  teamId: string;
  onCancel: () => void;
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ teamId, onCancel }) => {
  const addTeamMember = useAddTeamMember(teamId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users who are not already in the team
  const { data: availableUsers, isLoading: isLoadingUsers } = useQuery<User[]>(
    ['availableUsers', teamId],
    async () => {
      const response = await api.get(`/users/available?teamId=${teamId}`);
      return response.data;
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      userId: '',
      role: TeamRole.MEMBER,
    },
  });

  const onSubmit = async (data: MemberFormValues) => {
    try {
      setIsSubmitting(true);
      await addTeamMember.mutateAsync(data);
      onCancel();
    } catch (error) {
      console.error('Failed to add team member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="User"
        error={errors.userId?.message}
      >
        <Select
          {...register('userId')}
          disabled={isSubmitting || isLoadingUsers}
        >
          <option value="">Select a user</option>
          {availableUsers?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Select>
        {isLoadingUsers && (
          <p className="text-sm text-gray-500 mt-1">Loading available users...</p>
        )}
        {availableUsers?.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No available users to add to this team.</p>
        )}
      </FormField>

      <FormField
        label="Role"
        error={errors.role?.message}
      >
        <Select
          {...register('role')}
          disabled={isSubmitting}
        >
          {Object.values(TeamRole).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
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
          Add Member
        </Button>
      </div>
    </form>
  );
};
