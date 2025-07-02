import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import * as offlineTaskService from '../../../services/tasks/offlineTaskService';
import { Task } from '../../../components/tasks/TaskBoard';

interface TaskListWithOfflineSupportProps {
  projectId?: string;
}

/**
 * Task list component with offline support
 * Demonstrates how to use the offline sync functionality with task management
 */
export const TaskListWithOfflineSupport: React.FC<TaskListWithOfflineSupportProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  
  // Use the offline sync hook
  const { 
    isOnline, 
    hasPendingChanges, 
    pendingChangesCount, 
    isSyncing, 
    lastSyncResult,
    storeData, 
    getData, 
    addChange, 
    syncChanges 
  } = useOfflineSync({
    entityType: 'tasks',
    autoSync: true
  });
  
  // Load tasks with offline support
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the offline-aware task service
      const fetchedTasks = await offlineTaskService.fetchTasks();
      
      // Store tasks for offline access
      storeData('tasks', fetchedTasks);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Using cached data if available.');
      
      // Try to get cached tasks
      const cachedTasks = getData<Task[]>('tasks');
      if (cachedTasks) {
        setTasks(cachedTasks);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new task with offline support
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Partial<Task> = {
      title: newTaskTitle,
      status: 'todo',
      projectId: projectId || '',
      createdAt: new Date().toISOString()
    };
    
    try {
      // Use the offline-aware task service
      const createdTask = await offlineTaskService.createTask(newTask);
      
      // Update local state
      setTasks(prev => [...prev, createdTask as Task]);
      setNewTaskTitle('');
      
      // Update cached tasks
      storeData('tasks', [...tasks, createdTask as Task]);
    } catch (err) {
      console.error('Error creating task:', err);
      
      // If we're offline, we'll still update the UI optimistically
      if (!isOnline) {
        const tempTask = {
          ...newTask,
          id: `temp-${Date.now()}`, // Temporary ID
          offlinePending: true
        } as Task;
        
        setTasks(prev => [...prev, tempTask]);
        setNewTaskTitle('');
        
        // Update cached tasks
        storeData('tasks', [...tasks, tempTask]);
      }
    }
  };
  
  // Update task status with offline support
  const handleUpdateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done') => {
    try {
      // Use the offline-aware task service
      const updatedTask = await offlineTaskService.updateTaskStatus(taskId, status);
      
      // Update local state
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      
      // Update cached tasks
      storeData('tasks', tasks.map(task => task.id === taskId ? updatedTask : task));
    } catch (err) {
      console.error('Error updating task status:', err);
      
      // If we're offline, we'll still update the UI optimistically
      if (!isOnline) {
        const updatedTasks = tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, status, offlinePending: true };
          }
          return task;
        });
        
        setTasks(updatedTasks);
        
        // Update cached tasks
        storeData('tasks', updatedTasks);
      }
    }
  };
  
  // Delete task with offline support
  const handleDeleteTask = async (taskId: string) => {
    try {
      // Use the offline-aware task service
      await offlineTaskService.deleteTask(taskId);
      
      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Update cached tasks
      storeData('tasks', tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      
      // If we're offline, we'll still update the UI optimistically
      if (!isOnline) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        
        // Update cached tasks
        storeData('tasks', tasks.filter(task => task.id !== taskId));
      }
    }
  };
  
  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);
  
  // Refresh tasks when sync completes
  useEffect(() => {
    if (lastSyncResult?.success && !isSyncing) {
      loadTasks();
    }
  }, [lastSyncResult, isSyncing]);
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tasks</h2>
        
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Offline
            </span>
          )}
          
          {hasPendingChanges && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {pendingChangesCount} pending
            </span>
          )}
          
          <button
            onClick={loadTasks}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          
          {hasPendingChanges && isOnline && (
            <button
              onClick={() => syncChanges()}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>
      
      {/* Add new task form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateTask();
        }}
        className="flex gap-2 mb-6"
      >
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Task
        </button>
      </form>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Task list */}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No tasks found. Add a new task to get started.
        </div>
      )}
      
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li 
            key={task.id} 
            className={`flex items-center justify-between p-4 border rounded-md ${
              task.offlinePending 
                ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700' 
                : 'border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center">
              <select
                value={task.status}
                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                className="mr-3 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              
              <span className="text-gray-800 dark:text-white">
                {task.title}
                {task.offlinePending && (
                  <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                    (pending sync)
                  </span>
                )}
              </span>
            </div>
            
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskListWithOfflineSupport;
