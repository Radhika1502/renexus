import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useSprintSuggestions } from '../src/hooks/useSprintSuggestions';
import { Button, Card, Dialog, Input, TextArea, Select } from '../src/components/ui';
import { PlusIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  goal: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

interface Project {
  id: string;
  name: string;
}

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    projectId: '',
    startDate: '',
    endDate: '',
    goal: ''
  });

  // AI suggestions hook
  const { suggestions, isLoading: isLoadingSuggestions, refreshSuggestions } = useSprintSuggestions(selectedProjectId);

  // Fetch projects and sprints
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSprints(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const fetchSprints = async (projectId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/sprints`);
      const data = await response.json();
      setSprints(data);
      setError(null);
    } catch (err) {
      setError('Failed to load sprints');
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    try {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSprint)
      });
      
      if (!response.ok) throw new Error('Failed to create sprint');
      
      const createdSprint = await response.json();
      setSprints([...sprints, createdSprint]);
      setIsCreateDialogOpen(false);
      setNewSprint({ name: '', projectId: '', startDate: '', endDate: '', goal: '' });
      refreshSuggestions();
    } catch (err) {
      setError('Failed to create sprint');
    }
  };

  const getSprintProgress = (sprint: Sprint) => {
    if (!sprint.tasks.length) return 0;
    const completedTasks = sprint.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / sprint.tasks.length) * 100);
  };

  return (
    <>
      <Head>
        <title>Sprints | Renexus</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Sprints</h1>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-64"
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
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
                disabled={!selectedProjectId}
              >
                <PlusIcon className="w-5 h-5" />
                New Sprint
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
              <h2 className="text-xl font-semibold mb-4">AI Sprint Planning Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4">
                    <h3 className="font-medium">{suggestion.title}</h3>
                    <p className="text-gray-600 mt-2">{suggestion.description}</p>
                    {suggestion.data.tasks && (
                      <div className="mt-2 text-sm text-gray-500">
                        Suggested Tasks: {suggestion.data.tasks.length}
                      </div>
                    )}
                    {suggestion.data.estimatedEffort && (
                      <div className="mt-1 text-sm text-gray-500">
                        Estimated Effort: {suggestion.data.estimatedEffort} hours
                      </div>
                    )}
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

          {/* Sprints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div>Loading sprints...</div>
            ) : (
              sprints.map((sprint) => (
                <Card key={sprint.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{sprint.name}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      sprint.status === 'active' ? 'bg-green-100 text-green-800' :
                      sprint.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{sprint.goal}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Start: {new Date(sprint.startDate).toLocaleDateString()}</span>
                      <span>End: {new Date(sprint.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{getSprintProgress(sprint)}%</span> Complete
                        </div>
                        <div className="text-sm text-gray-600">
                          {sprint.tasks.length} Tasks
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${getSprintProgress(sprint)}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {/* TODO: Implement sprint details view */}}
                      className="flex items-center gap-2"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create Sprint Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            title="Create New Sprint"
          >
            <div className="space-y-4">
              <Input
                label="Sprint Name"
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                placeholder="Enter sprint name"
                required
              />
              <Select
                label="Project"
                value={newSprint.projectId}
                onChange={(e) => setNewSprint({ ...newSprint, projectId: e.target.value })}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              <TextArea
                label="Sprint Goal"
                value={newSprint.goal}
                onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                placeholder="Enter sprint goal"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  required
                />
                <Input
                  type="date"
                  label="End Date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
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
                onClick={handleCreateSprint}
                disabled={!newSprint.name || !newSprint.projectId || !newSprint.startDate || !newSprint.endDate}
              >
                Create Sprint
              </Button>
            </div>
          </Dialog>
        </div>
      </Layout>
    </>
  );
} 
