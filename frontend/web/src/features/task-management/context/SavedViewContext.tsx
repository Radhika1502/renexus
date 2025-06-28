import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SavedView, SavedViewInput, SavedViewUpdateInput } from '../types/savedViews';
import { useSavedViews } from '../hooks/useSavedViews';
import { TaskFilters } from '../types';

interface SavedViewContextType {
  views: SavedView[];
  currentViewId?: string;
  currentView?: SavedView;
  isLoading: boolean;
  error?: string;
  setCurrentViewId: (id?: string) => void;
  createView: (viewInput: SavedViewInput) => Promise<SavedView | undefined>;
  updateView: (viewUpdateInput: SavedViewUpdateInput) => Promise<SavedView | undefined>;
  deleteView: (id: string) => Promise<void>;
  setDefaultView: (id: string) => Promise<void>;
  saveCurrentFilters: (name: string, description?: string, isGlobal?: boolean) => Promise<SavedView | undefined>;
  getCurrentFilters: () => TaskFilters;
  setCurrentFilters: (filters: TaskFilters) => void;
}

const SavedViewContext = createContext<SavedViewContextType | undefined>(undefined);

interface SavedViewProviderProps {
  children: ReactNode;
  projectId?: string;
  initialFilters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export const SavedViewProvider: React.FC<SavedViewProviderProps> = ({
  children,
  projectId,
  initialFilters,
  onFiltersChange
}) => {
  const [currentFilters, setCurrentFilters] = useState<TaskFilters>(initialFilters);
  
  const {
    views,
    isLoading,
    error,
    currentViewId,
    setCurrentViewId,
    getCurrentView,
    createSavedView,
    updateSavedView,
    deleteSavedView,
    setDefaultView: setDefaultViewMutation
  } = useSavedViews(projectId);

  const handleSetCurrentViewId = (id?: string) => {
    setCurrentViewId(id);
    if (id) {
      const view = views.find(v => v.id === id);
      if (view) {
        setCurrentFilters(view.filters);
        onFiltersChange(view.filters);
      }
    }
  };

  const handleCreateView = async (viewInput: SavedViewInput): Promise<SavedView | undefined> => {
    try {
      const result = await createSavedView.mutateAsync(viewInput);
      return result;
    } catch (error) {
      console.error('Error creating view:', error);
      return undefined;
    }
  };

  const handleUpdateView = async (viewUpdateInput: SavedViewUpdateInput): Promise<SavedView | undefined> => {
    try {
      const result = await updateSavedView.mutateAsync(viewUpdateInput);
      return result;
    } catch (error) {
      console.error('Error updating view:', error);
      return undefined;
    }
  };

  const handleDeleteView = async (id: string): Promise<void> => {
    try {
      await deleteSavedView.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting view:', error);
      throw error;
    }
  };

  const handleSetDefaultView = async (id: string): Promise<void> => {
    try {
      await setDefaultViewMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error setting default view:', error);
      throw error;
    }
  };

  const saveCurrentFilters = async (
    name: string, 
    description?: string, 
    isGlobal?: boolean
  ): Promise<SavedView | undefined> => {
    try {
      const viewInput: SavedViewInput = {
        name,
        description,
        filters: currentFilters,
        isGlobal,
        projectId
      };
      
      const result = await createSavedView.mutateAsync(viewInput);
      return result;
    } catch (error) {
      console.error('Error saving current filters as view:', error);
      return undefined;
    }
  };

  const handleSetCurrentFilters = (filters: TaskFilters) => {
    setCurrentFilters(filters);
    onFiltersChange(filters);
  };

  const value = {
    views,
    currentViewId,
    currentView: getCurrentView(),
    isLoading,
    error,
    setCurrentViewId: handleSetCurrentViewId,
    createView: handleCreateView,
    updateView: handleUpdateView,
    deleteView: handleDeleteView,
    setDefaultView: handleSetDefaultView,
    saveCurrentFilters,
    getCurrentFilters: () => currentFilters,
    setCurrentFilters: handleSetCurrentFilters
  };

  return (
    <SavedViewContext.Provider value={value}>
      {children}
    </SavedViewContext.Provider>
  );
};

export const useSavedViewContext = (): SavedViewContextType => {
  const context = useContext(SavedViewContext);
  if (context === undefined) {
    throw new Error('useSavedViewContext must be used within a SavedViewProvider');
  }
  return context;
};
