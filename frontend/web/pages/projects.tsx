import React, { useState, useEffect, ChangeEvent } from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useWorkflowSuggestions } from '../src/hooks/useWorkflowSuggestions';
import { Button, Card, Dialog, Input, Textarea } from '../src/components/ui';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  startDate: string;
  dueDate: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: '',
    dueDate: ''
  });

  // AI suggestions hook
  const { suggestions, isLoadingSuggestions, refreshSuggestions } = useWorkflowSuggestions();

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      
      const createdProject = await response.json();
      setProjects([...projects, createdProject]);
      setIsCreateDialogOpen(false);
      setNewProject({ name: '', description: '', startDate: '', dueDate: '' });
      refreshSuggestions(); // Refresh AI suggestions after creating a project
    } catch (err) {
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Projects | Renexus</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
            <div className="flex gap-4">
              <Button
                onClick={() => refreshSuggestions()}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Refresh AI Insights
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                New Project
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* AI Suggestions Section */}
          {suggestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4">
                    <h3 className="font-medium">{suggestion.title}</h3>
                    <p className="text-gray-600 mt-2">{suggestion.description}</p>
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => suggestion.apply()}
                      >
                        Apply Suggestion
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div>Loading projects...</div>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                    <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {/* TODO: Implement project details view */}}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create Project Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            title="Create New Project"
          >
            <div className="space-y-4">
              <Input
                label="Project Name"
                value={newProject.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
              <Textarea
                label="Description"
                value={newProject.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Enter project description"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={newProject.startDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, startDate: e.target.value })}
                  required
                />
                <Input
                  type="date"
                  label="Due Date"
                  value={newProject.dueDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateProject}
                disabled={!newProject.name || !newProject.startDate || !newProject.dueDate}
              >
                Create Project
              </Button>
            </div>
          </Dialog>
        </div>
      </Layout>
    </>
  );
} 
