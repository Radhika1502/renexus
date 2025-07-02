import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export const useUsers = () => {
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    users,
    isLoading,
    error
  };
};
