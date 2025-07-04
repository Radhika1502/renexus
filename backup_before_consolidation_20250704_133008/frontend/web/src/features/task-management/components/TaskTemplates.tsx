import React, { useState } from 'react';
import { 
  useTaskTemplates, 
  useCreateTaskFromTemplate, 
  useDeleteTaskTemplate 
} from '../hooks/useTaskTemplates';
import { TaskTemplate  } from "../../../shared/types/templates";
import { 
  Card, 
  Button, 
  Dialog, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Skeleton,
  Alert
} from '../../../components/ui';
import { 
  Plus, 
  Template, 
  Trash2, 
  Edit, 
  Copy, 
  Star, 
  StarOff,
  Loader2
} from 'lucide-react';
import { TaskTemplateForm } from './TaskTemplateForm';

interface TaskTemplatesProps {
  projectId: string;
  onCreateTask?: (taskId: string) => void;
}

export const TaskTemplates: React.FC<TaskTemplatesProps> = ({ 
  projectId,
  onCreateTask
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'project' | 'global'>('project');
  
  const { 
    data: templates, 
    isLoading, 
    isError, 
    error 
  } = useTaskTemplates();
  
  const { 
    mutate: createTaskFromTemplate, 
    isPending: isCreatingTask 
  } = useCreateTaskFromTemplate();
  
  const { 
    mutate: deleteTemplate, 
    isPending: isDeletingTemplate 
  } = useDeleteTaskTemplate();

  // Filter templates based on active tab
  const filteredTemplates = templates?.filter(template => {
    if (activeTab === 'project') {
      return template.projectId === projectId;
    } else {
      return template.isGlobal;
    }
  });

  const handleCreateFromTemplate = (template: TaskTemplate) => {
    createTaskFromTemplate(
      { 
        templateId: template.id, 
        projectId 
      },
      {
        onSuccess: (data) => {
          onCreateTask?.(data.id);
        }
      }
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  const handleEditTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert 
        title="Error loading templates" 
        variant="destructive"
      >
        {error instanceof Error ? error.message : 'Failed to load task templates'}
      </Alert>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Template className="mr-2 h-5 w-5" />
          Task Templates
        </h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'project' | 'global')}>
        <TabsList className="mb-4">
          <TabsTrigger value="project">Project Templates</TabsTrigger>
          <TabsTrigger value="global">Global Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="project">
          {filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleCreateFromTemplate}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  isCreatingTask={isCreatingTask}
                  isDeletingTemplate={isDeletingTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Template className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>No project templates found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create your first template
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="global">
          {filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleCreateFromTemplate}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  isCreatingTask={isCreatingTask}
                  isDeletingTemplate={isDeletingTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Template className="mx-auto h-12 w-12 mb-2 opacity-30" />
              <p>No global templates found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create a global template
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create Task Template"
      >
        <TaskTemplateForm
          projectId={projectId}
          onSuccess={() => setIsCreateDialogOpen(false)}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Task Template"
      >
        {selectedTemplate && (
          <TaskTemplateForm
            template={selectedTemplate}
            projectId={projectId}
            onSuccess={() => setIsEditDialogOpen(false)}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        )}
      </Dialog>
    </Card>
  );
};

interface TemplateCardProps {
  template: TaskTemplate;
  onUse: (template: TaskTemplate) => void;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (templateId: string) => void;
  isCreatingTask: boolean;
  isDeletingTemplate: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onUse,
  onEdit,
  onDelete,
  isCreatingTask,
  isDeletingTemplate
}) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-lg truncate" title={template.name}>
          {template.name}
        </h3>
        {template.isGlobal ? (
          <Star className="h-4 w-4 text-amber-400" />
        ) : (
          <StarOff className="h-4 w-4 text-gray-400" />
        )}
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title={template.description}>
        {template.description}
      </p>
      
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
          {template.priority}
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
          {template.status}
        </div>
        {template.estimatedHours && (
          <div className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
            {template.estimatedHours}h
          </div>
        )}
      </div>
      
      {template.subtasks && template.subtasks.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Includes {template.subtasks.length} subtask{template.subtasks.length !== 1 ? 's' : ''}
        </div>
      )}
      
      <div className="mt-4 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(template)}
          className="flex-1 mr-2"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDelete(template.id)}
          disabled={isDeletingTemplate}
          className="flex-1 mr-2"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
        <Button 
          size="sm"
          onClick={() => onUse(template)}
          disabled={isCreatingTask}
          className="flex-1"
        >
          {isCreatingTask ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          Use
        </Button>
      </div>
    </Card>
  );
};

