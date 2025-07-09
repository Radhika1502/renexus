import { useState, useEffect, useCallback } from 'react';

interface SprintSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'PLANNING' | 'CAPACITY' | 'TASK_DISTRIBUTION';
  data: {
    tasks?: string[];
    teamMembers?: string[];
    estimatedEffort?: number;
  };
  apply: () => Promise<void>;
}

export function useSprintSuggestions(projectId?: string, sprintId?: string) {
  const [suggestions, setSuggestions] = useState<SprintSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      let endpoint = '/api/sprints/suggestions';
      
      if (sprintId) {
        endpoint = `/api/sprints/${sprintId}/suggestions`;
      } else if (projectId) {
        endpoint = `/api/projects/${projectId}/sprint-suggestions`;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch sprint suggestions');
      
      const data = await response.json();
      
      // Transform the raw suggestions data into SprintSuggestion objects
      const transformedSuggestions: SprintSuggestion[] = data.map((suggestion: any) => ({
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        type: suggestion.type,
        data: suggestion.data || {},
        apply: async () => {
          try {
            const applyResponse = await fetch(`/api/sprints/suggestions/${suggestion.id}/apply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accept: true })
            });
            
            if (!applyResponse.ok) throw new Error('Failed to apply sprint suggestion');
            
            // Remove the applied suggestion from the list
            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
            
            // Optionally refresh suggestions after applying one
            await fetchSuggestions();
          } catch (err) {
            console.error('Error applying sprint suggestion:', err);
            throw err;
          }
        }
      }));
      
      setSuggestions(transformedSuggestions);
      setError(null);
    } catch (err) {
      console.error('Error fetching sprint suggestions:', err);
      setError('Failed to load AI suggestions for sprint planning');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sprintId]);

  // Fetch suggestions on mount and when dependencies change
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refreshSuggestions: fetchSuggestions
  };
} 