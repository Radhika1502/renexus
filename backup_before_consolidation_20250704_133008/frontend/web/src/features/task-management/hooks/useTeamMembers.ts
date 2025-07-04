import { useQuery } from '@tanstack/react-query';
import { User } from '../types';

// Mock data for development - will be replaced with API call
const mockTeamMembers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://i.pravatar.cc/150?u=jane' },
  { id: '3', name: 'Alex Johnson', email: 'alex@example.com', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '5', name: 'Michael Brown', email: 'michael@example.com', avatar: 'https://i.pravatar.cc/150?u=michael' },
];

// This will be replaced with an actual API call in production
const fetchTeamMembers = async (projectId: string): Promise<User[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTeamMembers);
    }, 500);
  });
};

export const useTeamMembers = (projectId: string) => {
  return useQuery({
    queryKey: ['teamMembers', projectId],
    queryFn: () => fetchTeamMembers(projectId),
    enabled: !!projectId,
  });
};
