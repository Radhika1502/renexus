import React from 'react';
import { QueryClient, QueryClientProvider as RQProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export const QueryClientProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <RQProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </RQProvider>
  );
}; 