import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { SavedView, SavedViewInput, SavedViewUpdateInput  } from "../../../shared/types/savedViews";
import { useToast } from '../../../hooks/useToast';
import { useState } from 'react';

const SAVED_VIEWS_QUERY_KEY = 'savedViews';

export const useSavedViews = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: views = [], isLoading, error } = useQuery<SavedView[]>({
    queryKey: [SAVED_VIEWS_QUERY_KEY, { projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      const response = await api.get(`/saved-views?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [currentViewId, setCurrentViewId] = useState<string | undefined>(
    views.find(view => view.isDefault)?.id
  );

  const createSavedView = useMutation<SavedView, Error, SavedViewInput>({
    mutationFn: async (newView) => {
      const response = await api.post('/saved-views', newView);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SAVED_VIEWS_QUERY_KEY] });
      toast({
        title: 'View saved',
        description: `"${data.name}" has been saved successfully.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error saving view',
        description: error.message || 'There was an error saving your view.',
        variant: 'destructive',
      });
    },
  });

  const updateSavedView = useMutation<SavedView, Error, SavedViewUpdateInput>({
    mutationFn: async (updatedView) => {
      const response = await api.put(`/saved-views/${updatedView.id}`, updatedView);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SAVED_VIEWS_QUERY_KEY] });
      toast({
        title: 'View updated',
        description: `"${data.name}" has been updated successfully.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating view',
        description: error.message || 'There was an error updating your view.',
        variant: 'destructive',
      });
    },
  });

  const deleteSavedView = useMutation<void, Error, string>({
    mutationFn: async (viewId) => {
      await api.delete(`/saved-views/${viewId}`);
    },
    onSuccess: (_, viewId) => {
      queryClient.invalidateQueries({ queryKey: [SAVED_VIEWS_QUERY_KEY] });
      
      // If the deleted view was the current view, reset to default or null
      if (currentViewId === viewId) {
        const defaultView = views.find(view => view.isDefault && view.id !== viewId);
        setCurrentViewId(defaultView?.id);
      }
      
      toast({
        title: 'View deleted',
        description: 'The view has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting view',
        description: error.message || 'There was an error deleting the view.',
        variant: 'destructive',
      });
    },
  });

  const setDefaultView = useMutation<SavedView, Error, string>({
    mutationFn: async (viewId) => {
      const response = await api.put(`/saved-views/${viewId}/set-default`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SAVED_VIEWS_QUERY_KEY] });
      setCurrentViewId(data.id);
      toast({
        title: 'Default view set',
        description: `"${data.name}" is now your default view.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error setting default view',
        description: error.message || 'There was an error setting the default view.',
        variant: 'destructive',
      });
    },
  });

  const getCurrentView = () => {
    return views.find(view => view.id === currentViewId);
  };

  return {
    views,
    isLoading,
    error,
    currentViewId,
    setCurrentViewId,
    getCurrentView,
    createSavedView,
    updateSavedView,
    deleteSavedView,
    setDefaultView,
  };
};

