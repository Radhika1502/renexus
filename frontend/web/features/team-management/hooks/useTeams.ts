import { useMutation, useQuery, useQueryClient } from 'react-query';
import { teamService } from '../api/teamService';
import { CreateTeamDto, Team, UpdateTeamDto } from '../types';

export const useTeams = () => {
  return useQuery<Team[], Error>('teams', teamService.getAllTeams);
};

export const useTeam = (id: string) => {
  return useQuery<Team, Error>(['team', id], () => teamService.getTeamById(id), {
    enabled: !!id
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Team, Error, CreateTeamDto>(
    (newTeam) => teamService.createTeam(newTeam),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
      }
    }
  );
};

export const useUpdateTeam = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<Team, Error, UpdateTeamDto>(
    (updatedTeam) => teamService.updateTeam(id, updatedTeam),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries(['team', id]);
      }
    }
  );
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>(
    (id) => teamService.deleteTeam(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
      }
    }
  );
};
