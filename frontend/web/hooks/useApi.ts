import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useFetchApi<T>(endpoint: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching data from: ${endpoint}`);
        const response = await api.get(endpoint);
        
        console.log(`API Response:`, response.data);
        setData(response.data);
      } catch (err: any) {
        console.error(`API Error: ${endpoint}`, err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, isLoading, error };
}

export function usePostApi<T, D>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const postData = async (payload: D) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Posting data to: ${endpoint}`, payload);
      const response = await api.post(endpoint, payload);
      
      console.log(`API Response:`, response.data);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      console.error(`API Error: ${endpoint}`, err);
      setError(err.message || 'An error occurred while sending data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { postData, data, isLoading, error };
}
