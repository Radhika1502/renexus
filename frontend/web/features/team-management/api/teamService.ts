import { api } from '../../../services/api';
import { 
  Team, 
  TeamMember, 
  CreateTeamDto, 
  UpdateTeamDto, 
  AddTeamMemberDto, 
  UpdateTeamMemberDto 
} from '../types';

export const teamService = {
  // Team CRUD operations
  getAllTeams: async (): Promise<Team[]> => {
    const response = await api.get('/teams');
    return response.data;
  },

  getTeamById: async (id: string): Promise<Team> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (team: CreateTeamDto): Promise<Team> => {
    const response = await api.post('/teams', team);
    return response.data;
  },

  updateTeam: async (id: string, team: UpdateTeamDto): Promise<Team> => {
    const response = await api.put(`/teams/${id}`, team);
    return response.data;
  },

  deleteTeam: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  // Team members operations
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  addTeamMember: async (teamId: string, member: AddTeamMemberDto): Promise<TeamMember> => {
    const response = await api.post(`/teams/${teamId}/members`, member);
    return response.data;
  },

  updateTeamMember: async (teamId: string, userId: string, update: UpdateTeamMemberDto): Promise<TeamMember> => {
    const response = await api.put(`/teams/${teamId}/members/${userId}`, update);
    return response.data;
  },

  removeTeamMember: async (teamId: string, userId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${userId}`);
  }
};
