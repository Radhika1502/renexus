import React, { useState, useEffect } from 'react';
import { 
  fetchTaskTemplates, 
  createTaskFromTemplate, 
  createTemplate,
  deleteTemplate 
} from '../../../services/taskService';
import styles from './TaskTemplates.module.css';

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  category: string;
  fields: {
    title: boolean;
    description: boolean;
    assignee: boolean;
    dueDate: boolean;
    attachments: boolean;
    timeTracking: boolean;
    dependencies: boolean;
  };
  createdBy: string;
  createdAt: string;
}

interface TaskTemplatesProps {
  projectId?: string;
  onTemplateSelected?: (templateId: string) => void;
  onTaskCreated?: () => void;
}

const TaskTemplates: React.FC<TaskTemplatesProps> = ({ 
  projectId, 
  onTemplateSelected, 
  onTaskCreated 
}) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState<boolean>(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const templatesData = await fetchTaskTemplates(projectId);
        setTemplates(templatesData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setError('Failed to load task templates. Please try again.');
        setLoading(false);
      }
    };

    loadTemplates();
  }, [projectId]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (onTemplateSelected) {
      onTemplateSelected(templateId);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedTemplateId) return;
    
    try {
      setCreatingTask(true);
      await createTaskFromTemplate(selectedTemplateId, projectId);
      setCreatingTask(false);
      setSelectedTemplateId(null);
      
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      console.error('Failed to create task from template:', err);
      setError('Failed to create task from template. Please try again.');
      setCreatingTask(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const templateData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        priority: formData.get('priority') as 'low' | 'medium' | 'high',
        estimatedHours: parseFloat(formData.get('estimatedHours') as string) || 0,
        category: formData.get('category') as string,
        fields: {
          title: formData.get('field_title') === 'on',
          description: formData.get('field_description') === 'on',
          assignee: formData.get('field_assignee') === 'on',
          dueDate: formData.get('field_dueDate') === 'on',
          attachments: formData.get('field_attachments') === 'on',
          timeTracking: formData.get('field_timeTracking') === 'on',
          dependencies: formData.get('field_dependencies') === 'on',
        }
      };
      
      const newTemplate = await createTemplate(templateData, projectId);
      setTemplates([...templates, newTemplate]);
      setShowCreateForm(false);
      form.reset();
    } catch (err) {
      console.error('Failed to create template:', err);
      setError('Failed to create template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError('Failed to delete template. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading task templates...</div>;
  }

  return (
    <div className={styles.taskTemplates} data-testid="task-templates">
      <div className={styles.header}>
        <h3>Task Templates</h3>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Template'}
        </button>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {showCreateForm && (
        <form onSubmit={handleCreateTemplate} className={styles.createForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Template Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="priority">Default Priority</label>
              <select
                id="priority"
                name="priority"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="estimatedHours">Estimated Hours</label>
              <input
                type="number"
                id="estimatedHours"
                name="estimatedHours"
                min="0"
                step="0.5"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
            />
          </div>
          
          <div className={styles.fieldsSection}>
            <h4>Required Fields</h4>
            
            <div className={styles.fieldCheckboxes}>
              <label>
                <input type="checkbox" name="field_title" defaultChecked />
                Title
              </label>
              
              <label>
                <input type="checkbox" name="field_description" />
                Description
              </label>
              
              <label>
                <input type="checkbox" name="field_assignee" />
                Assignee
              </label>
              
              <label>
                <input type="checkbox" name="field_dueDate" />
                Due Date
              </label>
              
              <label>
                <input type="checkbox" name="field_attachments" />
                Attachments
              </label>
              
              <label>
                <input type="checkbox" name="field_timeTracking" />
                Time Tracking
              </label>
              
              <label>
                <input type="checkbox" name="field_dependencies" />
                Dependencies
              </label>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="reset" className={styles.cancelButton}>
              Reset
            </button>
            <button type="submit" className={styles.submitButton}>
              Create Template
            </button>
          </div>
        </form>
      )}
      
      {templates.length > 0 ? (
        <div className={styles.templatesList}>
          {templates.map(template => (
            <div 
              key={template.id} 
              className={`${styles.templateItem} ${selectedTemplateId === template.id ? styles.selected : ''}`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className={styles.templateHeader}>
                <h4>{template.name}</h4>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  aria-label="Delete template"
                >
                  ×
                </button>
              </div>
              
              <div className={styles.templateDescription}>{template.description}</div>
              
              <div className={styles.templateMeta}>
                <span className={styles.templatePriority}>{template.priority}</span>
                <span className={styles.templateTime}>{template.estimatedHours}h</span>
              </div>
              
              <div className={styles.templateCategory}>{template.category}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noTemplates}>No task templates available. Create one to get started.</p>
      )}
      
      {selectedTemplateId && (
        <div className={styles.templateActions}>
          <button
            className={styles.createTaskButton}
            onClick={handleCreateTask}
            disabled={creatingTask}
          >
            {creatingTask ? 'Creating...' : 'Create Task from Template'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;
