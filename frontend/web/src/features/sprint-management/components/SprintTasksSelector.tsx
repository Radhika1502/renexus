import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../../../services/api';
import { useAddTaskToSprint } from '../hooks/useSprintTasks';
import { Button, Input, Checkbox } from '@renexus/ui-components';
import { SearchIcon } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface SprintTasksSelectorProps {
  sprintId: string;
  projectId: string;
  onCancel: () => void;
}

export const SprintTasksSelector: React.FC<SprintTasksSelectorProps> = ({
  sprintId,
  projectId,
  onCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addTaskToSprint = useAddTaskToSprint(sprintId);

  // Fetch available tasks for the project that are not already in the sprint
  const { data: availableTasks, isLoading } = useQuery<Task[]>(
    ['availableTasks', projectId, sprintId],
    async () => {
      const response = await api.get(`/projects/${projectId}/tasks/available?sprintId=${sprintId}`);
      return response.data;
    },
    {
      staleTime: 60000, // 1 minute
    }
  );

  const filteredTasks = availableTasks?.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (filteredTasks && filteredTasks.length > 0) {
      if (selectedTasks.length === filteredTasks.length) {
        // If all are selected, deselect all
        setSelectedTasks([]);
      } else {
        // Otherwise select all
        setSelectedTasks(filteredTasks.map(task => task.id));
      }
    }
  };

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Add each selected task to the sprint
      await Promise.all(
        selectedTasks.map(taskId => 
          addTaskToSprint.mutateAsync({ taskId })
        )
      );
      onCancel();
    } catch (error) {
      console.error('Failed to add tasks to sprint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'text-green-600 dark:text-green-400';
      case 'in progress':
      case 'inprogress':
      case 'in-progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'blocked':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-4">Loading available tasks...</div>
      ) : filteredTasks && filteredTasks.length > 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                      onChange={handleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="ml-2 cursor-pointer">
                      Select All
                    </label>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assignee
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleToggleTask(task.id)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => handleToggleTask(task.id)}
                        id={`task-${task.id}`}
                      />
                      <label htmlFor={`task-${task.id}`} className="ml-2 text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                        {task.title}
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.assignee ? (
                      <div className="flex items-center">
                        {task.assignee.avatar ? (
                          <img 
                            src={task.assignee.avatar} 
                            alt={task.assignee.name} 
                            className="h-6 w-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 mr-2"></div>
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Unassigned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {searchTerm ? 'No tasks match your search.' : 'No available tasks found for this project.'}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleAddTasks}
          disabled={selectedTasks.length === 0 || isSubmitting}
          isLoading={isSubmitting}
        >
          Add {selectedTasks.length} {selectedTasks.length === 1 ? 'Task' : 'Tasks'} to Sprint
        </Button>
      </div>
    </div>
  );
};
