import { useQuery } from 'react-query';
import { User } from '../types';
import { api } from "../../../shared/utils/api";

/**
 * Hook for fetching users data
 */
export const useUsers = () => {
  return useQuery<User[], Error>(
    'users',
    async () => {
      const response = await api.get('/users');
      return response.data;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

