import { useState, useEffect, useCallback } from 'react';

interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'ASSIGNMENT' | 'PRIORITIZATION' | 'WORKLOAD';
  apply: () => Promise<void>;
}

export function useWorkflowSuggestions(projectId?: string) {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoadingSuggestions(true);
      const endpoint = projectId 
        ? `/api/projects/${projectId}/suggestions`
        : '/api/projects/suggestions';
        
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await response.json();
      
      // Transform the raw suggestions data into WorkflowSuggestion objects
      const transformedSuggestions: WorkflowSuggestion[] = data.map((suggestion: any) => ({
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        type: suggestion.type,
        apply: async () => {
          try {
            const applyResponse = await fetch(`/api/projects/suggestions/${suggestion.id}/apply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accept: true })
            });
            
            if (!applyResponse.ok) throw new Error('Failed to apply suggestion');
            
            // Remove the applied suggestion from the list
            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
            
            // Optionally refresh suggestions after applying one
            await fetchSuggestions();
          } catch (err) {
            console.error('Error applying suggestion:', err);
            throw err;
          }
        }
      }));
      
      setSuggestions(transformedSuggestions);
      setError(null);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load AI suggestions');
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [projectId]);

  // Fetch suggestions on mount and when projectId changes
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoadingSuggestions,
    error,
    refreshSuggestions: fetchSuggestions
  };
} 