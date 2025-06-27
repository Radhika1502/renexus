import React from 'react';
import { Task, TaskPriority } from '../types';
import { Badge, Tooltip } from '@renexus/ui-components';
import { formatDate } from '../utils';
import { AlertCircle, ArrowUp, ArrowDown, Clock, MessageSquare, Paperclip } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const getPriorityIcon = (priority: TaskPriority) => {
  switch (priority) {
    case 'highest':
      return <ArrowUp className="h-3 w-3 text-red-600" />;
    case 'high':
      return <ArrowUp className="h-3 w-3 text-orange-500" />;
    case 'medium':
      return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    case 'low':
      return <ArrowDown className="h-3 w-3 text-blue-500" />;
    case 'lowest':
      return <ArrowDown className="h-3 w-3 text-gray-500" />;
    default:
      return null;
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View ${task.title} task details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <Tooltip content={`Priority: ${task.priority}`}>
            <span className="mr-1.5">{getPriorityIcon(task.priority)}</span>
          </Tooltip>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {task.projectKey}-{task.id.substring(0, 4)}
          </span>
        </div>
        
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {task.labels.slice(0, 2).map((label, index) => (
              <Badge 
                key={index}
                className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              >
                {label}
              </Badge>
            ))}
            {task.labels.length > 2 && (
              <Badge className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                +{task.labels.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <h4 className="font-medium mb-2 line-clamp-2" title={task.title}>
        {task.title}
      </h4>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <Tooltip content={`Assignee: ${task.assignee.name}`}>
              <div className="flex items-center">
                {task.assignee.avatar ? (
                  <img 
                    src={task.assignee.avatar} 
                    alt={task.assignee.name} 
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Tooltip>
          )}
          
          {task.dueDate && (
            <Tooltip content={`Due: ${formatDate(task.dueDate)}`}>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            </Tooltip>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              <span>{task.comments.length}</span>
            </div>
          )}
          
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
