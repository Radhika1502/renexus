import React, { useState, useEffect } from 'react';
import { Task } from '../TaskBoard';
import { getTaskById, updateTask, uploadAttachment } from '../../../services/taskService';
import styles from './TaskDetails.module.css';

interface TaskDetailsProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdated: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, onClose, onTaskUpdated }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [fileUploading, setFileUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaskDetails = async () => {
      try {
        setLoading(true);
        const taskData = await getTaskById(taskId);
        setTask(taskData);
        setFormData({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to load task details:', err);
        setError('Failed to load task details. Please try again.');
        setLoading(false);
      }
    };

    loadTaskDetails();
  }, [taskId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      await updateTask(taskId, formData);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    try {
      setFileUploading(true);
      setUploadError(null);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);
      
      const attachment = await uploadAttachment(formData);
      
      // Update the task with the new attachment
      if (task && task.attachments) {
        setTask({
          ...task,
          attachments: [...task.attachments, attachment]
        });
      } else if (task) {
        setTask({
          ...task,
          attachments: [attachment]
        });
      }
      
      setFileUploading(false);
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      setUploadError('Failed to upload attachment. Please try again.');
      setFileUploading(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      
      // Update the UI by removing the attachment
      if (task && task.attachments) {
        setTask({
          ...task,
          attachments: task.attachments.filter(a => a.id !== attachmentId)
        });
      }
    } catch (err) {
      console.error('Failed to remove attachment:', err);
      setError('Failed to remove attachment. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading task details...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!task) {
    return <div className={styles.error}>Task not found</div>;
  }

  return (
    <div className={styles.taskDetails} data-testid="task-details">
      <div className={styles.header}>
        <h2>Task Details</h2>
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            rows={5}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status || ''}
              onChange={handleInputChange}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority || ''}
              onChange={handleInputChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className={styles.attachmentsSection}>
          <h3>Attachments</h3>
          
          <div className={styles.fileUpload}>
            <input
              type="file"
              id="attachment"
              onChange={handleFileUpload}
              disabled={fileUploading}
            />
            {fileUploading && <span className={styles.uploading}>Uploading...</span>}
            {uploadError && <span className={styles.error}>{uploadError}</span>}
          </div>
          
          <ul className={styles.attachmentsList}>
            {task.attachments?.map(attachment => (
              <li key={attachment.id} className={styles.attachmentItem}>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  {attachment.filename}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className={styles.removeAttachment}
                  aria-label={`Remove attachment ${attachment.filename}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskDetails;
