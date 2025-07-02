import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@renexus/ui-components';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { useUpdateTaskStatus } from '../../task-management/hooks/useUpdateTaskStatus';
import { Loader } from 'lucide-react';
import { TaskStatus } from '../../task-management/types';

interface ProjectBoardViewProps {
  projectId: string;
}

const statusColumns = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'IN_REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' }
];

export const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({ projectId }) => {
  const { data: tasks, isLoading, error } = useProjectTasks(projectId);
  const { mutate: updateTaskStatus } = useUpdateTaskStatus();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (result: any) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const { draggableId, source, destination } = result;
    
    if (source.droppableId === destination.droppableId) return;
    
    // Update task status in the backend
    updateTaskStatus({
      taskId: draggableId,
      status: destination.droppableId as TaskStatus
    });
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400">
        Error loading tasks: {(error as Error).message}
      </div>
    );
  }

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map(column => (
          <div key={column.id} className="flex flex-col h-full">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{column.title}</span>
                  <span className="text-sm font-normal bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {getTasksByStatus(column.id).length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2 min-h-[50px]"
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm ${
                                snapshot.isDragging ? 'shadow-md' : ''
                              }`}
                            >
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                                  {task.priority}
                                </span>
                                {task.assignee && (
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                                      {task.assignee.name.charAt(0)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
