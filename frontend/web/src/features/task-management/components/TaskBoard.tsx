import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { Button, Skeleton, Select } from './ui/Dialog';
import { Plus, Settings } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface TaskBoardProps {
  tasks: Task[];
  isLoading: boolean;
  projectId?: string;
  onCreateTask?: () => void;
  onSelectTask?: (task: Task) => void;
}

interface TaskBoardSettings {
  pageSize: number;
  enableOfflineCache: boolean;
}

interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  isLoading,
  projectId,
  onCreateTask,
  onSelectTask,
}) => {
  const { updateTask } = useUpdateTask();
  const [settings, setSettings] = useLocalStorage<TaskBoardSettings>('taskboard-settings', {
    pageSize: 20,
    enableOfflineCache: true
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState<Record<TaskStatus, number>>({} as Record<TaskStatus, number>);
  
  // Define columns for the board
  const columns: TaskColumn[] = [
    { id: TaskStatus.BACKLOG, title: 'Backlog', tasks: [] },
    { id: TaskStatus.TODO, title: 'To Do', tasks: [] },
    { id: TaskStatus.IN_PROGRESS, title: 'In Progress', tasks: [] },
    { id: TaskStatus.IN_REVIEW, title: 'Review', tasks: [] },
    { id: TaskStatus.DONE, title: 'Done', tasks: [] },
  ];
  
  // Distribute tasks into columns
  if (tasks) {
    tasks.forEach(task => {
      const column = columns.find(col => col.id === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });
    
    // Sort tasks by priority and date for better performance
    columns.forEach(column => {
      column.tasks.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority > b.priority ? -1 : 1;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
  }
  
  // Initialize pagination state
  useEffect(() => {
    const initialPages: Record<TaskStatus, number> = {} as Record<TaskStatus, number>;
    columns.forEach(col => {
      initialPages[col.id] = 0;
    });
    setCurrentPage(initialPages);
  }, []);
  
  // Function to get paginated tasks
  const getPaginatedTasks = (columnId: TaskStatus, tasks: Task[]) => {
    const page = currentPage[columnId] || 0;
    return tasks.slice(page * settings.pageSize, (page + 1) * settings.pageSize);
  };
  
  // Handle task status change (simplified - without drag and drop)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask({
      id: taskId,
      status: newStatus,
    });
  };
  
  // Handle offline support
  useEffect(() => {
    if (settings.enableOfflineCache && tasks) {
      localStorage.setItem('cached-tasks', JSON.stringify(tasks));
    }
  }, [tasks, settings.enableOfflineCache]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Task Board</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {onCreateTask && (
            <Button onClick={onCreateTask} size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Task
            </Button>
          )}
        </div>
      </div>
      
      {showSettings && (
        <div className="bg-gray-50 p-4 rounded-md mb-4 border">
          <h3 className="text-sm font-medium mb-2">Board Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1 block">Page Size</label>
              <Select
                value={settings.pageSize.toString()}
                onValueChange={(value) => setSettings({...settings, pageSize: parseInt(value)})}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="offline-cache"
                checked={settings.enableOfflineCache}
                onChange={(e) => setSettings({...settings, enableOfflineCache: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="offline-cache" className="text-xs">Enable Offline Support</label>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map(column => (
          <div 
            key={column.id} 
            className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
          >
            <div className="p-3 border-b flex justify-between items-center">
              <h3 className="font-medium">{column.title}</h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {isLoading ? '...' : column.tasks.length}
              </span>
            </div>
            
            <div className="p-2 min-h-[400px]">
              {isLoading ? (
                // Show skeleton cards while loading
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="mb-2">
                    <Skeleton className="h-24 w-full rounded-md" />
                  </div>
                ))
              ) : column.tasks.length > 0 ? (
                getPaginatedTasks(column.id, column.tasks).map((task) => (
                  <div key={task.id} className="mb-2">
                    <TaskCard 
                      task={task} 
                      onClick={() => onSelectTask && onSelectTask(task)} 
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
              
              {/* Pagination controls */}
              {column.tasks.length > settings.pageSize && (
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => ({
                      ...prev,
                      [column.id]: Math.max(0, (prev[column.id] || 0) - 1)
                    }))}
                    disabled={(currentPage[column.id] || 0) === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-gray-500">
                    Page {(currentPage[column.id] || 0) + 1} of {Math.ceil(column.tasks.length / settings.pageSize)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => ({
                      ...prev,
                      [column.id]: Math.min(
                        Math.ceil(column.tasks.length / settings.pageSize) - 1,
                        (prev[column.id] || 0) + 1
                      )
                    }))}
                    disabled={(currentPage[column.id] || 0) >= Math.ceil(column.tasks.length / settings.pageSize) - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
