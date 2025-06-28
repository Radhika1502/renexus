import React, { useState } from 'react';
import { Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import { TaskFilters as FilterOptions } from '../types';
import { Alert, Button, Skeleton, Checkbox } from '@renexus/ui-components';
import { Plus, CheckSquare, Filter } from 'lucide-react';
import { useTaskSelection } from '../context/TaskSelectionContext';
import { BulkOperationsBar } from './BulkOperationsBar';
import { FilterBar } from './FilterBar';
import { AdvancedFiltersDialog } from './AdvancedFiltersDialog';
import { SavedViewDialog } from './SavedViewDialog';
import { SavedViewProvider, useSavedViewContext } from '../context/SavedViewContext';
import { AdvancedFilterOptions } from '../types/savedViews';

interface TaskListProps {
  projectId?: string;
  onCreateTask?: () => void;
  onSelectTask?: (task: Task) => void;
}

const TaskListContent: React.FC<TaskListProps> = ({
  projectId,
  onCreateTask,
  onSelectTask,
}) => {
  const { 
    isSelectMode, 
    toggleSelectMode, 
    selectAll, 
    clearSelection, 
    selectedTaskIds,
    selectionCount,
    toggleTaskSelection
  } = useTaskSelection();

  const {
    getCurrentFilters,
    setCurrentFilters,
    saveCurrentFilters
  } = useSavedViewContext();

  const filters = getCurrentFilters();
  
  const { 
    tasks, 
    isLoading, 
    isError, 
    refetch 
  } = useTasks(filters);

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isSaveViewDialogOpen, setIsSaveViewDialogOpen] = useState(false);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setCurrentFilters({ ...filters, ...newFilters });
  };
  
  const handleTaskSelection = (taskId: string) => {
    if (isSelectMode) {
      toggleTaskSelection(taskId);
    }
  };

  const handleAdvancedFiltersChange = (advancedFilters: AdvancedFilterOptions) => {
    setCurrentFilters({ ...filters, ...advancedFilters });
  };

  const handleSaveView = (name: string, description: string, isGlobal: boolean) => {
    saveCurrentFilters(name, description, isGlobal);
  };

  if (isError) {
    return (
      <Alert 
        open={true} 
        title="Error loading tasks" 
        description="There was an error loading tasks. Please try again."
        onConfirm={() => refetch()}
        onCancel={() => {}}
        onOpenChange={() => {}}
      />
    );
  }

  const handleSelectAll = () => {
    if (tasks && tasks.length > 0) {
      if (selectedTaskIds.length === tasks.length) {
        clearSelection();
      } else {
        selectAll(tasks.map(task => task.id));
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={toggleSelectMode}
            className={isSelectMode ? 'bg-primary/10' : ''}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            {isSelectMode ? 'Cancel Selection' : 'Select Tasks'}
          </Button>
          {onCreateTask && (
            <Button onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-1" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        projectId={projectId}
        onOpenAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isSelectMode ? (
                  <div className="flex items-center">
                    <Checkbox
                      checked={tasks && tasks.length > 0 && selectedTaskIds.length === tasks.length}
                      onClick={handleSelectAll}
                      className="mr-2"
                      aria-label="Select all tasks"
                    />
                    <span>Task {selectionCount > 0 && `(${selectionCount} selected)`}</span>
                  </div>
                ) : (
                  'Task'
                )}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Assignee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              // Show skeleton rows while loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-48" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-24" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-24" />
                  </td>
                </tr>
              ))
            ) : tasks && tasks.length > 0 ? (
              tasks.map((task) => (
                <tr 
                  key={task.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${selectedTaskIds.includes(task.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => isSelectMode ? null : onSelectTask?.(task)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isSelectMode && (
                        <Checkbox
                          checked={selectedTaskIds.includes(task.id)}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleTaskSelection(task.id);
                          }}
                          className="mr-2"
                          aria-label={`Select ${task.title}`}
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${task.status === 'todo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
                      ${task.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                      ${task.status === 'review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : ''}
                      ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
                      ${task.status === 'backlog' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                    `}>
                      {task.status === 'inProgress' ? 'In Progress' : 
                        task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${task.priority === 'highest' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
                      ${task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : ''}
                      ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                      ${task.priority === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
                      ${task.priority === 'lowest' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                    `}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {task.assignee ? (
                        <>
                          {task.assignee.avatar ? (
                            <img 
                              src={task.assignee.avatar} 
                              alt={task.assignee.name} 
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="text-sm text-gray-900 dark:text-white">
                            {task.assignee.name}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {task.dueDate ? (
                      new Date(task.dueDate).toLocaleDateString()
                    ) : (
                      <span>No due date</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
                  {onCreateTask && (
                    <Button 
                      onClick={onCreateTask}
                      className="mt-4"
                      variant="outline"
                    >
                      Create your first task
                    </Button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isSelectMode && selectedTaskIds.length > 0 && (
        <BulkOperationsBar 
          selectedTaskIds={selectedTaskIds}
          onClearSelection={clearSelection}
          onExitSelectMode={toggleSelectMode}
        />
      )}

      <AdvancedFiltersDialog
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        initialFilters={filters}
        onApplyFilters={handleAdvancedFiltersChange}
        onSaveView={() => setIsSaveViewDialogOpen(true)}
      />

      <SavedViewDialog
        isOpen={isSaveViewDialogOpen}
        onClose={() => setIsSaveViewDialogOpen(false)}
        onSave={handleSaveView}
      />
    </div>
  );
};

export const TaskList: React.FC<TaskListProps> = (props) => {
  const initialFilters: FilterOptions = {
    projectId: props.projectId,
    status: ['todo', 'inProgress', 'review'],
  };

  return (
    <SavedViewProvider
      projectId={props.projectId}
      initialFilters={initialFilters}
      onFiltersChange={() => {}}
    >
      <TaskListContent {...props} />
    </SavedViewProvider>
  );
};
