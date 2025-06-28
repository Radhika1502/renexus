import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@renexus/ui-components';
import { useTask } from '../hooks/useTask';
import { useProjectTasks } from '../../project-management/hooks/useProjectTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { Loader, Plus, X, ArrowRight, ArrowLeft, Link, LinkOff } from 'lucide-react';
import { Task } from '../types';

interface TaskDependenciesProps {
  taskId: string;
}

export const TaskDependencies: React.FC<TaskDependenciesProps> = ({ taskId }) => {
  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const [activeTab, setActiveTab] = useState('dependencies');
  
  // We need to fetch all tasks from the project to select dependencies
  const { data: projectTasks, isLoading: tasksLoading } = useProjectTasks(task?.projectId || '');
  
  // State for selected tasks
  const [selectedDependencyId, setSelectedDependencyId] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedRelatedId, setSelectedRelatedId] = useState<string>('');
  
  // Derived state for different relationship types
  const [dependencies, setDependencies] = useState<Task[]>([]);
  const [blockedBy, setBlockedBy] = useState<Task[]>([]);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [childTasks, setChildTasks] = useState<Task[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<Task[]>([]);
  
  // Effect to populate relationship data when task loads
  useEffect(() => {
    if (task && projectTasks) {
      // Set dependencies (tasks that this task depends on)
      if (task.dependencies) {
        const deps = projectTasks.filter(t => task.dependencies?.includes(t.id));
        setDependencies(deps);
      }
      
      // Set blocked by (tasks that depend on this task)
      const blockers = projectTasks.filter(t => t.dependencies?.includes(taskId));
      setBlockedBy(blockers);
      
      // Set parent task
      if (task.parentId) {
        const parent = projectTasks.find(t => t.id === task.parentId);
        if (parent) setParentTask(parent);
      }
      
      // Set child tasks
      const children = projectTasks.filter(t => t.parentId === taskId);
      setChildTasks(children);
      
      // Set related tasks
      if (task.relatedTasks) {
        const related = projectTasks.filter(t => task.relatedTasks?.includes(t.id));
        setRelatedTasks(related);
      }
    }
  }, [task, projectTasks, taskId]);
  
  if (taskLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader className="animate-spin h-6 w-6 text-primary" />
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="text-red-500 p-4">
        Task not found
      </div>
    );
  }
  
  // Filter out tasks that can't be dependencies (to avoid circular dependencies)
  const availableDependencies = projectTasks?.filter(t => 
    t.id !== taskId && 
    !dependencies.some(dep => dep.id === t.id) &&
    !childTasks.some(child => child.id === t.id)
  ) || [];
  
  // Filter out tasks that can't be parents (to avoid circular hierarchies)
  const availableParents = projectTasks?.filter(t => 
    t.id !== taskId && 
    t.id !== parentTask?.id &&
    !childTasks.some(child => child.id === t.id) &&
    !dependencies.some(dep => dep.id === t.id)
  ) || [];
  
  // Filter out tasks that are already related
  const availableRelated = projectTasks?.filter(t => 
    t.id !== taskId && 
    !relatedTasks.some(rel => rel.id === t.id)
  ) || [];
  
  // Handlers for adding relationships
  const addDependency = () => {
    if (!selectedDependencyId) return;
    
    const newDependencies = [...dependencies, projectTasks!.find(t => t.id === selectedDependencyId)!];
    setDependencies(newDependencies);
    
    // Update task in the backend
    updateTask({
      taskId,
      data: {
        dependencies: newDependencies.map(d => d.id)
      }
    });
    
    setSelectedDependencyId('');
  };
  
  const removeDependency = (depId: string) => {
    const newDependencies = dependencies.filter(d => d.id !== depId);
    setDependencies(newDependencies);
    
    // Update task in the backend
    updateTask({
      taskId,
      data: {
        dependencies: newDependencies.map(d => d.id)
      }
    });
  };
  
  const setParent = () => {
    if (!selectedParentId) return;
    
    const parent = projectTasks!.find(t => t.id === selectedParentId)!;
    setParentTask(parent);
    
    // Update task in the backend
    updateTask({
      taskId,
      data: {
        parentId: selectedParentId
      }
    });
    
    setSelectedParentId('');
  };
  
  const removeParent = () => {
    setParentTask(null);
    
    // Update task in the backend
    updateTask({
      taskId,
      data: {
        parentId: null
      }
    });
  };
  
  const addRelatedTask = () => {
    if (!selectedRelatedId) return;
    
    const newRelated = [...relatedTasks, projectTasks!.find(t => t.id === selectedRelatedId)!];
    setRelatedTasks(newRelated);
    
    // Update task in the backend
    updateTask({
      taskId,
      data: {
        relatedTasks: newRelated.map(r => r.id)
      }
    });
    
    setSelectedRelatedId('');
  };
  
  const removeRelatedTask = (relId: string) => {
    const newRelated = relatedTasks.filter(r => r.id !== relId);
    setRelatedTasks(newRelated);
    
    // Update task in the backend
    updateTask({
      taskId,
      data: {
        relatedTasks: newRelated.map(r => r.id)
      }
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Relationships</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
            <TabsTrigger value="related">Related Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dependencies" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">This task depends on:</h3>
              <div className="flex flex-wrap gap-2">
                {dependencies.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No dependencies</p>
                ) : (
                  dependencies.map(dep => (
                    <Badge key={dep.id} variant="outline" className="flex items-center gap-1 py-1">
                      {dep.title}
                      <button 
                        onClick={() => removeDependency(dep.id)}
                        className="ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedDependencyId} onValueChange={setSelectedDependencyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDependencies.length === 0 ? (
                        <SelectItem value="" disabled>
                          No available tasks
                        </SelectItem>
                      ) : (
                        availableDependencies.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  size="sm" 
                  onClick={addDependency}
                  disabled={!selectedDependencyId || isUpdating}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="text-sm font-medium">Tasks that depend on this task:</h3>
              <div className="flex flex-wrap gap-2">
                {blockedBy.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tasks depend on this task</p>
                ) : (
                  blockedBy.map(blocker => (
                    <Badge key={blocker.id} variant="secondary" className="py-1">
                      {blocker.title}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="hierarchy" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Parent Task:</h3>
              {parentTask ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1 py-1">
                    {parentTask.title}
                    <button 
                      onClick={removeParent}
                      className="ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent task" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParents.length === 0 ? (
                          <SelectItem value="" disabled>
                            No available tasks
                          </SelectItem>
                        ) : (
                          availableParents.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={setParent}
                    disabled={!selectedParentId || isUpdating}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Set Parent
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Child Tasks:</h3>
              <div className="flex flex-wrap gap-2">
                {childTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No child tasks</p>
                ) : (
                  childTasks.map(child => (
                    <Badge key={child.id} variant="secondary" className="py-1">
                      {child.title}
                    </Badge>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Note: To add a child task, set this task as the parent when creating or editing another task.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="related" className="space-y-4">
            <h3 className="text-sm font-medium">Related Tasks:</h3>
            <div className="flex flex-wrap gap-2">
              {relatedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No related tasks</p>
              ) : (
                relatedTasks.map(rel => (
                  <Badge key={rel.id} variant="outline" className="flex items-center gap-1 py-1">
                    <Link className="h-3 w-3 mr-1" />
                    {rel.title}
                    <button 
                      onClick={() => removeRelatedTask(rel.id)}
                      className="ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedRelatedId} onValueChange={setSelectedRelatedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRelated.length === 0 ? (
                      <SelectItem value="" disabled>
                        No available tasks
                      </SelectItem>
                    ) : (
                      availableRelated.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                size="sm" 
                onClick={addRelatedTask}
                disabled={!selectedRelatedId || isUpdating}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
