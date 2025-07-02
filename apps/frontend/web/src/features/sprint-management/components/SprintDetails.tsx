import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSprint, 
  useUpdateSprint, 
  useDeleteSprint, 
  useStartSprint, 
  useCompleteSprint, 
  useCancelSprint 
} from '../hooks/useSprints';
import { useSprintTasks, useSprintStats } from '../hooks/useSprintTasks';
import { Sprint, SprintStatus } from '../types';
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@renexus/ui-components';
import { 
  EditIcon, 
  Trash2Icon, 
  PlayIcon, 
  CheckIcon, 
  XIcon, 
  CalendarIcon, 
  ListIcon 
} from 'lucide-react';
import { SprintForm } from './SprintForm';
import { SprintTasksList } from './SprintTasksList';
import { SprintBurndown } from './SprintBurndown';
import { SprintTasksSelector } from './SprintTasksSelector';

export const SprintDetails: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  const { data: sprint, isLoading: isLoadingSprint, error: sprintError } = useSprint(sprintId || '');
  const { data: tasks, isLoading: isLoadingTasks } = useSprintTasks(sprintId || '');
  const { data: stats, isLoading: isLoadingStats } = useSprintStats(sprintId || '');
  
  const updateSprint = useUpdateSprint(sprintId || '');
  const deleteSprint = useDeleteSprint();
  const startSprint = useStartSprint(sprintId || '');
  const completeSprint = useCompleteSprint(sprintId || '');
  const cancelSprint = useCancelSprint(sprintId || '');

  if (isLoadingSprint) {
    return <div className="flex justify-center p-8">Loading sprint details...</div>;
  }

  if (sprintError || !sprint) {
    return (
      <div className="text-red-500 p-4">
        Error loading sprint: {sprintError?.message || 'Sprint not found'}
      </div>
    );
  }

  const handleUpdateSprint = async (data: Partial<Sprint>) => {
    try {
      await updateSprint.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update sprint:', error);
    }
  };

  const handleDeleteSprint = async () => {
    if (window.confirm('Are you sure you want to delete this sprint? This action cannot be undone.')) {
      try {
        await deleteSprint.mutateAsync(sprintId || '');
        navigate('/sprints');
      } catch (error) {
        console.error('Failed to delete sprint:', error);
      }
    }
  };

  const handleStartSprint = async () => {
    if (window.confirm('Are you sure you want to start this sprint?')) {
      try {
        await startSprint.mutateAsync();
      } catch (error) {
        console.error('Failed to start sprint:', error);
      }
    }
  };

  const handleCompleteSprint = async () => {
    if (window.confirm('Are you sure you want to complete this sprint?')) {
      try {
        await completeSprint.mutateAsync();
      } catch (error) {
        console.error('Failed to complete sprint:', error);
      }
    }
  };

  const handleCancelSprint = async () => {
    if (window.confirm('Are you sure you want to cancel this sprint?')) {
      try {
        await cancelSprint.mutateAsync();
      } catch (error) {
        console.error('Failed to cancel sprint:', error);
      }
    }
  };

  const renderStatusActions = () => {
    switch (sprint.status) {
      case SprintStatus.PLANNING:
        return (
          <Button
            variant="success"
            size="sm"
            onClick={handleStartSprint}
            className="flex items-center gap-1"
            disabled={startSprint.isLoading}
          >
            <PlayIcon size={16} />
            <span>Start Sprint</span>
          </Button>
        );
      case SprintStatus.ACTIVE:
        return (
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={handleCompleteSprint}
              className="flex items-center gap-1"
              disabled={completeSprint.isLoading}
            >
              <CheckIcon size={16} />
              <span>Complete</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelSprint}
              className="flex items-center gap-1"
              disabled={cancelSprint.isLoading}
            >
              <XIcon size={16} />
              <span>Cancel</span>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sprint.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full 
              ${sprint.status === SprintStatus.PLANNING ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
              ${sprint.status === SprintStatus.ACTIVE ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
              ${sprint.status === SprintStatus.COMPLETED ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
              ${sprint.status === SprintStatus.CANCELLED ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
            `}>
              {sprint.status}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <CalendarIcon size={14} />
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {renderStatusActions()}
          {sprint.status === SprintStatus.PLANNING && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1"
            >
              <EditIcon size={16} />
              <span>Edit</span>
            </Button>
          )}
          {sprint.status === SprintStatus.PLANNING && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteSprint}
              className="flex items-center gap-1"
            >
              <Trash2Icon size={16} />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Sprint</h2>
            <SprintForm
              sprint={sprint}
              onSubmit={handleUpdateSprint}
              onCancel={() => setIsEditing(false)}
              isSubmitting={updateSprint.isLoading}
            />
          </div>
        </div>
      )}

      {/* Add Tasks Modal */}
      {isAddingTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full">
            <h2 className="text-xl font-semibold mb-4">Add Tasks to Sprint</h2>
            <SprintTasksSelector
              sprintId={sprintId || ''}
              projectId={sprint.projectId}
              onCancel={() => setIsAddingTasks(false)}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="burndown">Burndown Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sprint Information</h2>
            <div className="space-y-4">
              {sprint.goal && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Goal</h3>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {sprint.goal}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </p>
              </div>
              
              {!isLoadingStats && stats && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</h3>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${stats.completionPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm mt-1 text-gray-900 dark:text-white">
                        {stats.completedTasks} of {stats.totalTasks} tasks completed ({stats.completionPercentage}%)
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Task Status</h3>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                        <p className="text-lg font-semibold text-green-700 dark:text-green-300">{stats.completedTasks}</p>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                        <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{stats.inProgressTasks}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Not Started</p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{stats.notStartedTasks}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sprint Tasks</h2>
            {sprint.status === SprintStatus.PLANNING && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingTasks(true)}
                className="flex items-center gap-1"
              >
                <ListIcon size={16} />
                <span>Add Tasks</span>
              </Button>
            )}
          </div>
          
          {isLoadingTasks ? (
            <div className="text-center p-4">Loading tasks...</div>
          ) : (
            <SprintTasksList 
              sprintId={sprintId || ''} 
              tasks={tasks || []} 
              isSprintActive={sprint.status === SprintStatus.ACTIVE} 
            />
          )}
        </TabsContent>

        <TabsContent value="burndown" className="pt-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Burndown Chart</h2>
            {isLoadingStats ? (
              <div className="text-center p-4">Loading burndown data...</div>
            ) : stats?.burndownData && stats.burndownData.length > 0 ? (
              <SprintBurndown data={stats.burndownData} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No burndown data available. This could be because the sprint hasn't started yet or there are no tasks in the sprint.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
