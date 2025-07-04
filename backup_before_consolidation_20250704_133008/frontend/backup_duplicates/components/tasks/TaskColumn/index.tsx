import React from 'react';
import { useDrop } from 'react-dnd';
import styles from './TaskColumn.module.css';

interface TaskColumnProps {
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  onTaskMove: (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => void;
  children: React.ReactNode;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ title, status, onTaskMove, children }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      onTaskMove(item.id, status);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div 
      ref={drop} 
      className={`${styles.column} ${isOver ? styles.isOver : ''}`}
      data-testid={`column-${status}`}
    >
      <div className={styles.columnHeader}>
        <h3>{title}</h3>
      </div>
      <div className={styles.taskList}>
        {children}
      </div>
    </div>
  );
};

export default TaskColumn;
