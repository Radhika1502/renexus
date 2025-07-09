import React, { useState, useEffect } from 'react';
import { 
  fetchTaskDependencies, 
  addTaskDependency, 
  removeTaskDependency,
  fetchAvailableTasks 
} from '../../../services/taskService';
import styles from './TaskDependencies.module.css';

interface Dependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTask: {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
  };
}

interface AvailableTask {
  id: string;
  title: string;
}

interface TaskDependenciesProps {
  taskId: string;
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({ taskId }) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingDependency, setAddingDependency] = useState<boolean>(false);

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setLoading(true);
        const deps = await fetchTaskDependencies(taskId);
        setDependencies(deps);
        
        // Also load available tasks for the dropdown
        const tasks = await fetchAvailableTasks(taskId);
        setAvailableTasks(tasks);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load dependencies:', err);
        setError('Failed to load dependencies. Please try again.');
        setLoading(false);
      }
    };

    loadDependencies();
  }, [taskId]);

  const handleAddDependency = async () => {
    if (!selectedTaskId) return;
    
    try {
      setAddingDependency(true);
      
      // Check for circular dependency first
      const isCircular = await checkCircularDependency(taskId, selectedTaskId);
      if (isCircular) {
        setError('Cannot add this dependency as it would create a circular dependency.');
        setAddingDependency(false);
        return;
      }
      
      const newDependency = await addTaskDependency(taskId, selectedTaskId);
      
      // Update UI with new dependency
      setDependencies([...dependencies, newDependency]);
      setSelectedTaskId('');
      setAddingDependency(false);
    } catch (err) {
      console.error('Failed to add dependency:', err);
      setError('Failed to add dependency. Please try again.');
      setAddingDependency(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      await removeTaskDependency(dependencyId);
      
      // Update UI by removing the dependency
      setDependencies(dependencies.filter(d => d.id !== dependencyId));
    } catch (err) {
      console.error('Failed to remove dependency:', err);
      setError('Failed to remove dependency. Please try again.');
    }
  };

  // This is a simplified check - in a real app, we'd want to do this server-side
  const checkCircularDependency = async (sourceTaskId: string, targetTaskId: string): Promise<boolean> => {
    // For now, just prevent direct circular dependencies
    if (sourceTaskId === targetTaskId) {
      return true;
    }
    
    // In a real implementation, we'd need to check the entire dependency graph
    // This would typically be done on the server side
    
    return false;
  };

  if (loading) {
    return <div className={styles.loading}>Loading dependencies...</div>;
  }

  return (
    <div className={styles.taskDependencies} data-testid="task-dependencies">
      <h3>Task Dependencies</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.addDependency}>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          disabled={addingDependency || availableTasks.length === 0}
          className={styles.taskSelect}
        >
          <option value="">Select a task...</option>
          {availableTasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        
        <button
          type="button"
          onClick={handleAddDependency}
          disabled={!selectedTaskId || addingDependency}
          className={styles.addButton}
        >
          {addingDependency ? 'Adding...' : 'Add Dependency'}
        </button>
      </div>
      
      {dependencies.length > 0 ? (
        <ul className={styles.dependenciesList}>
          {dependencies.map(dep => (
            <li key={dep.id} className={styles.dependencyItem}>
              <div className={styles.dependencyInfo}>
                <span className={`${styles.dependencyStatus} ${styles[dep.dependsOnTask.status]}`} />
                <span className={styles.dependencyTitle}>{dep.dependsOnTask.title}</span>
              </div>
              
              <button
                type="button"
                onClick={() => handleRemoveDependency(dep.id)}
                className={styles.removeButton}
                aria-label="Remove dependency"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noDependencies}>No dependencies for this task.</p>
      )}
      
      <div className={styles.dependencyVisualization}>
        {/* In a real implementation, we could add a dependency graph visualization here */}
      </div>
    </div>
  );
};

export default TaskDependencies;
