export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  department?: string;
  skills?: string[];
}

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  avatar?: string;
  department?: string;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  department?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  department?: string;
}

export interface AddTeamMemberDto {
  userId: string;
  role: TeamRole;
}

export interface UpdateTeamMemberDto {
  role?: TeamRole;
}
