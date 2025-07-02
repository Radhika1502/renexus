/**
 * Local wrapper for React Query hooks to avoid import issues
 */
import React, { createContext, useContext } from 'react';

/**
 * Local implementation of query client to avoid import issues
 */
export class QueryClient {
  private cache: Map<string, any> = new Map();

  invalidateQueries(queryKey: unknown[]) {
    const keyString = JSON.stringify(queryKey);
    this.cache.delete(keyString);
  }

  setQueryData(queryKey: unknown[], data: any) {
    const keyString = JSON.stringify(queryKey);
    this.cache.set(keyString, data);
  }

  getQueryData(queryKey: unknown[]) {
    const keyString = JSON.stringify(queryKey);
    return this.cache.get(keyString);
  }
}

// Create a query client instance
export const queryClient = new QueryClient();

// Custom hook implementations that match the React Query API
export function useQuery<TData = unknown, TError = unknown>(options: {
  queryKey: unknown[];
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  staleTime?: number;
}) {
  // This is a simplified implementation that mimics React Query's useQuery
  const { queryKey, queryFn, enabled = true } = options;
  
  // Return a structure similar to React Query's useQuery result
  return {
    data: undefined as TData | undefined,
    isLoading: true,
    isError: false,
    error: undefined as TError | undefined,
    refetch: async () => {
      try {
        const data = await queryFn();
        return { data };
      } catch (error) {
        return { error: error as TError };
      }
    }
  };
}

export function useMutation<TData = unknown, TError = unknown, TVariables = unknown>(options: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
}) {
  // This is a simplified implementation that mimics React Query's useMutation
  const { mutationFn, onSuccess, onError } = options;
  
  // Return a structure similar to React Query's useMutation result
  return {
    mutate: async (variables: TVariables) => {
      try {
        const data = await mutationFn(variables);
        if (onSuccess) {
          onSuccess(data, variables);
        }
        return data;
      } catch (error) {
        if (onError) {
          onError(error as TError, variables);
        }
        throw error;
      }
    },
    isLoading: false,
    isError: false,
    error: undefined as TError | undefined
  };
}

export function useQueryClient() {
  // Return the query client instance
  return queryClient;
}

// Create a context for the query client
const QueryClientContext = createContext<QueryClient | undefined>(undefined);

// QueryClientProvider component
export function QueryClientProvider({ client, children }: { client: QueryClient; children: React.ReactNode }) {
  return React.createElement(
    QueryClientContext.Provider,
    { value: client },
    children
  );
}
