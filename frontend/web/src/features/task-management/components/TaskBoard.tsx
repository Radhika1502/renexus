import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { Button, Skeleton } from '@renexus/ui-components';
import { Plus } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  isLoading: boolean;
  projectId?: string;
  onCreateTask?: () => void;
  onSelectTask?: (task: Task) => void;
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
  }
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Task Board</h2>
        {onCreateTask && (
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-1" />
            Create Task
          </Button>
        )}
      </div>
      
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
                      column.tasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2"
                            >
                              <TaskCard 
                                task={task} 
                                onClick={() => onSelectTask?.(task)} 
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
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
