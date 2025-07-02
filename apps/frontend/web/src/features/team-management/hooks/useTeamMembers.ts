import { useMutation, useQuery, useQueryClient } from 'react-query';
import { teamService } from '../api/teamService';
import { AddTeamMemberDto, TeamMember, UpdateTeamMemberDto } from '../types';

export const useTeamMembers = (teamId: string) => {
  return useQuery<TeamMember[], Error>(
    ['teamMembers', teamId],
    () => teamService.getTeamMembers(teamId),
    {
      enabled: !!teamId
    }
  );
};

export const useAddTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<TeamMember, Error, AddTeamMemberDto>(
    (newMember) => teamService.addTeamMember(teamId, newMember),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['teamMembers', teamId]);
        queryClient.invalidateQueries(['team', teamId]);
      }
    }
  );
};

export const useUpdateTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<TeamMember, Error, { userId: string; update: UpdateTeamMemberDto }>(
    ({ userId, update }) => teamService.updateTeamMember(teamId, userId, update),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['teamMembers', teamId]);
        queryClient.invalidateQueries(['team', teamId]);
      }
    }
  );
};

export const useRemoveTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    (userId) => teamService.removeTeamMember(teamId, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['teamMembers', teamId]);
        queryClient.invalidateQueries(['team', teamId]);
      }
    }
  );
};
