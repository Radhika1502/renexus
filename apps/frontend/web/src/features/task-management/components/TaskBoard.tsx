import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { Button, Skeleton, Select } from '@renexus/ui-components';
import { Plus, Settings } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  renderMode: 'standard' | 'virtual';
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
    renderMode: 'standard',
    enableOfflineCache: true
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState<Record<TaskStatus, number>>({} as Record<TaskStatus, number>);
  
  // Define columns for the board
  const columns: TaskColumn[] = [
    { id: 'backlog', title: 'Backlog', tasks: [] },
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'inProgress', title: 'In Progress', tasks: [] },
    { id: 'review', title: 'Review', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
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
  
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Dropped outside a valid droppable area
    if (!destination) return;
    
    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    // Update the task status
    await updateTask({
      id: task.id,
      status: destination.droppableId as TaskStatus,
    });
  };
  
  // Create virtualizers for each column
  const columnVirtualizers = useMemo(() => {
    if (settings.renderMode !== 'virtual') return {};
    
    const virtualizers: Record<string, any> = {};
    columns.forEach(column => {
      virtualizers[column.id] = useVirtualizer({
        count: column.tasks.length,
        getScrollElement: () => document.getElementById(`column-${column.id}`),
        estimateSize: () => 120, // Estimated height of a task card
        overscan: 5
      });
    });
    return virtualizers;
  }, [columns, tasks, settings.renderMode]);
  
  // Function to get paginated tasks
  const getPaginatedTasks = (columnId: TaskStatus, tasks: Task[]) => {
    if (settings.renderMode === 'virtual') return tasks;
    
    const page = currentPage[columnId] || 0;
    return tasks.slice(page * settings.pageSize, (page + 1) * settings.pageSize);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs mb-1 block">Render Mode</label>
              <Select
                value={settings.renderMode}
                onValueChange={(value) => setSettings({...settings, renderMode: value as 'standard' | 'virtual'})}
              >
                <option value="standard">Standard</option>
                <option value="virtual">Virtual (for 1000+ tasks)</option>
              </Select>
            </div>
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
      
      <DragDropContext onDragEnd={handleDragEnd}>
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
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="p-2 min-h-[400px]"
                  >
                    {isLoading ? (
                      // Show skeleton cards while loading
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="mb-2">
                          <Skeleton className="h-24 w-full rounded-md" />
                        </div>
                      ))
                    ) : column.tasks.length > 0 ? (
                      settings.renderMode === 'virtual' ? (
                        <div 
                          style={{
                            height: `${columnVirtualizers[column.id]?.getTotalSize() || 0}px`,
                            position: 'relative'
                          }}
                        >
                          {columnVirtualizers[column.id]?.getVirtualItems().map((virtualRow) => (
                            <Draggable 
                              key={column.tasks[virtualRow.index].id} 
                              draggableId={column.tasks[virtualRow.index].id} 
                              index={virtualRow.index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="mb-2 absolute w-full"
                                  style={{
                                    top: 0,
                                    left: 0,
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                  }}
                                >
                                  <TaskCard 
                                    task={column.tasks[virtualRow.index]} 
                                    onClick={() => onSelectTask && onSelectTask(column.tasks[virtualRow.index])} 
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      ) : (
                        getPaginatedTasks(column.id, column.tasks).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-2"
                              >
                                <TaskCard 
                                  task={task} 
                                  onClick={() => onSelectTask && onSelectTask(task)} 
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )
                    ) : (
                      <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-500 text-sm">
                        No tasks
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
