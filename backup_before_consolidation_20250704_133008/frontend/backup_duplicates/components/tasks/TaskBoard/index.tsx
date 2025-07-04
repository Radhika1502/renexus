import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TaskColumn from '../TaskColumn';
import TaskCard from '../TaskCard';
import { fetchTasks, updateTaskStatus } from '../../../services/taskService';
import styles from './TaskBoard.module.css';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
  }>;
  dependencies?: string[];
}

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const response = await fetchTasks();
        setTasks(response);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('Failed to load tasks. Please try again.');
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const handleTaskMove = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => {
    try {
      // Update UI optimistically
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      // Update in backend
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Rollback UI if API call fails
      const originalTasks = await fetchTasks();
      setTasks(originalTasks);
      setError('Failed to update task status. Please try again.');
    }
  };

  // Group tasks by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const reviewTasks = tasks.filter(task => task.status === 'review');
  const doneTasks = tasks.filter(task => task.status === 'done');

  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.taskBoard}>
        <TaskColumn 
          title="To Do" 
          status="todo" 
          onTaskMove={handleTaskMove}
        >
          {todoTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TaskColumn>

        <TaskColumn 
          title="In Progress" 
          status="in_progress" 
          onTaskMove={handleTaskMove}
        >
          {inProgressTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TaskColumn>

        <TaskColumn 
          title="In Review" 
          status="review" 
          onTaskMove={handleTaskMove}
        >
          {reviewTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TaskColumn>

        <TaskColumn 
          title="Done" 
          status="done" 
          onTaskMove={handleTaskMove}
        >
          {doneTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TaskColumn>
      </div>
    </DndProvider>
  );
};

export default TaskBoard;
