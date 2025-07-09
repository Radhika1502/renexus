import React from 'react';
import { useDrag } from 'react-dnd';
import { Task } from '../TaskBoard';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const priorityClass = {
    low: styles.priorityLow,
    medium: styles.priorityMedium,
    high: styles.priorityHigh,
  }[task.priority];

  return (
    <div
      ref={drag}
      className={`${styles.taskCard} ${isDragging ? styles.isDragging : ''} ${priorityClass}`}
      data-testid={`task-card-${task.id}`}
    >
      <div className={styles.taskHeader}>
        <span className={styles.taskId}>#{task.id.slice(-4)}</span>
        <span className={styles.taskPriority}>{task.priority}</span>
      </div>
      
      <h4 className={styles.taskTitle}>{task.title}</h4>
      
      <p className={styles.taskDescription}>
        {task.description.length > 100 
          ? `${task.description.substring(0, 100)}...` 
          : task.description}
      </p>
      
      {task.dueDate && (
        <div className={styles.taskDueDate}>
          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}
      
      {task.assignee && (
        <div className={styles.taskAssignee}>
          {task.assignee.avatar ? (
            <img 
              src={task.assignee.avatar} 
              alt={task.assignee.name} 
              className={styles.assigneeAvatar} 
            />
          ) : (
            <div className={styles.assigneeInitial}>
              {task.assignee.name.charAt(0)}
            </div>
          )}
          <span>{task.assignee.name}</span>
        </div>
      )}
      
      {task.attachments && task.attachments.length > 0 && (
        <div className={styles.taskAttachments}>
          <span>📎 {task.attachments.length}</span>
        </div>
      )}
      
      {task.dependencies && task.dependencies.length > 0 && (
        <div className={styles.taskDependencies}>
          <span>🔗 {task.dependencies.length}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
