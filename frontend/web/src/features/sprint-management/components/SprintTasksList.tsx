import React from 'react';
import { SprintTask } from '../types';
import { useRemoveTaskFromSprint } from '../hooks/useSprintTasks';
import { Button, Badge } from '@renexus/ui-components';
import { Trash2Icon, ExternalLinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SprintTasksListProps {
  sprintId: string;
  tasks: SprintTask[];
  isSprintActive: boolean;
}

export const SprintTasksList: React.FC<SprintTasksListProps> = ({ 
  sprintId, 
  tasks, 
  isSprintActive 
}) => {
  const removeTaskMutation = useRemoveTaskFromSprint(sprintId);

  const handleRemoveTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to remove this task from the sprint?')) {
      try {
        await removeTaskMutation.mutateAsync(taskId);
      } catch (error) {
        console.error('Failed to remove task from sprint:', error);
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in progress':
      case 'inprogress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'todo':
      case 'to do':
      case 'to-do':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No tasks in this sprint yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Task
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
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((sprintTask) => (
            <tr key={sprintTask.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    <Link 
                      to={`/tasks/${sprintTask.task.id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {sprintTask.task.title}
                      <ExternalLinkIcon size={14} className="inline-block" />
                    </Link>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant="outline"
                  className={getStatusBadgeClass(sprintTask.task.status)}
                >
                  {sprintTask.task.status}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant="outline"
                  className={getPriorityBadgeClass(sprintTask.task.priority)}
                >
                  {sprintTask.task.priority}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {sprintTask.task.assignee ? (
                  <div className="flex items-center">
                    {sprintTask.task.assignee.avatar ? (
                      <img 
                        src={sprintTask.task.assignee.avatar} 
                        alt={sprintTask.task.assignee.name} 
                        className="h-6 w-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 mr-2"></div>
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      {sprintTask.task.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Unassigned
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {!isSprintActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTask(sprintTask.taskId)}
                    disabled={removeTaskMutation.isLoading}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2Icon size={16} />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
