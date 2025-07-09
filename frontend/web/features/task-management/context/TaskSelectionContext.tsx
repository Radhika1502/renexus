import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BulkSelectionState  } from "../../../shared/types/bulkOperations";

interface TaskSelectionContextType extends BulkSelectionState {
  toggleSelectMode: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAll: (taskIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (taskId: string) => boolean;
  selectionCount: number;
}

const TaskSelectionContext = createContext<TaskSelectionContextType | undefined>(undefined);

interface TaskSelectionProviderProps {
  children: ReactNode;
}

export const TaskSelectionProvider: React.FC<TaskSelectionProviderProps> = ({ children }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    if (isSelectMode) {
      // Clear selection when exiting select mode
      setSelectedTaskIds([]);
    }
  };
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const selectAll = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };
  
  const clearSelection = () => {
    setSelectedTaskIds([]);
  };
  
  const isSelected = (taskId: string) => {
    return selectedTaskIds.includes(taskId);
  };
  
  return (
    <TaskSelectionContext.Provider
      value={{
        selectedTaskIds,
        isSelectMode,
        toggleSelectMode,
        toggleTaskSelection,
        selectAll,
        clearSelection,
        isSelected,
        selectionCount: selectedTaskIds.length,
      }}
    >
      {children}
    </TaskSelectionContext.Provider>
  );
};

export const useTaskSelection = (): TaskSelectionContextType => {
  const context = useContext(TaskSelectionContext);
  
  if (context === undefined) {
    throw new Error('useTaskSelection must be used within a TaskSelectionProvider');
  }
  
  return context;
};

