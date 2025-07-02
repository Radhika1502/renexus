import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renexus/ui-components';
import { useProject } from '../hooks/useProject';
import { useUpdateProject } from '../hooks/useUpdateProject';
import { Loader, Save, Plus, Trash2 } from 'lucide-react';
import { ProjectPermissionsTab } from './settings/ProjectPermissionsTab';
import { ProjectCustomFieldsTab } from './settings/ProjectCustomFieldsTab';
import { ProjectWorkflowTab } from './settings/ProjectWorkflowTab';
import { ProjectNotificationsTab } from './settings/ProjectNotificationsTab';

interface ProjectSettingsProps {
  projectId: string;
}

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ projectId }) => {
  const { data: project, isLoading, error } = useProject(projectId);
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const [activeTab, setActiveTab] = useState('general');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400">
        Error loading project settings: {(error as Error)?.message || 'Project not found'}
      </div>
    );
  }

  const handleGeneralSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    updateProject({
      projectId,
      data: {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as any,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : undefined,
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="customFields">Custom Fields</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <form onSubmit={handleGeneralSettingsSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={project.name} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description" 
                  defaultValue={project.description} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={project.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date" 
                    defaultValue={project.startDate?.split('T')[0]} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date" 
                    defaultValue={project.endDate?.split('T')[0]} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  defaultValue={project.tags?.join(', ')} 
                />
              </div>
              
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="permissions">
            <ProjectPermissionsTab projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="customFields">
            <ProjectCustomFieldsTab projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="workflow">
            <ProjectWorkflowTab projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="notifications">
            <ProjectNotificationsTab projectId={projectId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
