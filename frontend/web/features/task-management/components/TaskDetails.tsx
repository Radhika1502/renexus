import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask } from '../hooks/useTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { useAITaskInsights } from '../hooks/useAITaskInsights';
import { Task, TaskStatus } from '../types';
import { CollaborativeTextArea } from '../../collaboration/components/CollaborativeTextArea';
import { PresenceIndicator } from '../../collaboration/components/PresenceIndicator';
import { useWebSocketContext } from '../../../contexts/WebSocketContext';
import { SharedTaskEditor } from './SharedTaskEditor';
import { formatDateTime } from '../utils';
import { TaskCommentsSection } from './TaskCommentsSection';
import { TaskAnalytics } from './TaskAnalytics'; // Import TaskAnalytics component

// UI components
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogTrigger,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Button,
  Skeleton
} from '@renexus/ui-components';

// Icons
import { 
  ArrowLeft, 
  Edit, 
  MessageSquare, 
  Paperclip, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

// Define types for WebSocket message payloads
interface TaskUpdateMessage {
  taskId: string;
  type: 'STATUS_CHANGE' | 'DESCRIPTION_CHANGE' | 'ASSIGNEE_CHANGE' | 'TITLE_CHANGE' | 'DUE_DATE_CHANGE' | 'PRIORITY_CHANGE';
  changes: Record<string, unknown>;
  updatedAt: string;
}

interface TaskDetailsProps {
  taskId: string;
  onEdit?: (task: Task) => void;
  onBack?: () => void;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId: propTaskId, onEdit, onBack }) => {
  const { taskId: urlTaskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const finalTaskId = propTaskId || urlTaskId || '';
  const { data: task, isLoading, error } = useTask(finalTaskId);
  const { updateTask } = useUpdateTask();
  const { data: aiInsightsData, isLoading: aiLoadingData, error: aiErrorData } = useAITaskInsights(task?.id || '', task?.description || '');
  const [activeTab, setActiveTab] = useState('details');
  const [localTask, setLocalTask] = useState<Task | null>(null);
  const { sendMessage, subscribe } = useWebSocketContext();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSimilarTasks, setAiSimilarTasks] = useState([]);
  const [aiPotentialRisks, setAiPotentialRisks] = useState([]);
  
  // Current user info (replace with actual auth context)
  const currentUser = {
    id: task?.assigneeId || 'current-user-1', // Use assignee ID if available
    name: task?.assignee?.name || 'Current User', // Use assignee name if available
    avatarUrl: task?.assignee?.avatar, // Use assignee avatar if available
  };

  // Update local task when task data is loaded
  useEffect(() => {
    if (task) {
      setLocalTask(task);
    }
  }, [task]);

  const handleStatusChange = async (status: string) => {
    if (!task || !localTask) return;

    // Optimistically update the UI
    const previousStatus = localTask.status;
    setLocalTask({ ...localTask, status: status as TaskStatus });

    try {
      await updateTask({
        id: localTask.id,
        status: status as TaskStatus,
      });
      
      // Notify other users of the status change
      sendMessage('TASK_UPDATE', {
        taskId: localTask.id,
        type: 'STATUS_CHANGE',
        changes: { status },
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Revert on error
      setLocalTask({ ...localTask, status: previousStatus as TaskStatus });
      console.error('Failed to update task status:', error);
    }
  };
  
  const handleDescriptionChange = async (newDescription: string) => {
    if (!task || !localTask) return;
    
    try {
      await updateTask({
        id: localTask.id,
        description: newDescription,
      });
      
      // Update local state
      setLocalTask({ ...localTask, description: newDescription });
      
      // Notify other users of the change
      sendMessage('TASK_UPDATE', {
        taskId: localTask.id,
        type: 'DESCRIPTION_CHANGE',
        changes: { description: newDescription },
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update task description:', error);
    }
  };

  useEffect(() => {
    if (!finalTaskId) return;

    const unsubscribe = subscribe('TASK_UPDATE', (update: TaskUpdateMessage) => {
      if (update.taskId === finalTaskId) {
        // Update local task data with the changes
        if (task && update.changes) {
          // Handle different types of updates
          if (update.type === 'STATUS_CHANGE') {
            setLocalTask({ ...task, status: update.changes.status as TaskStatus });
          } else if (update.type === 'ASSIGNEE_CHANGE') {
            setLocalTask({ ...task, assigneeId: update.changes.assigneeId as string });
          } else if (update.type === 'DESCRIPTION_CHANGE') {
            setLocalTask({ ...task, description: update.changes.description as string });
          } else if (update.type === 'TITLE_CHANGE') {
            setLocalTask({ ...task, title: update.changes.title as string });
          } else if (update.type === 'DUE_DATE_CHANGE') {
            setLocalTask({ ...task, dueDate: update.changes.dueDate as string });
          } else if (update.type === 'PRIORITY_CHANGE') {
            setLocalTask({ ...task, priority: update.changes.priority as string });
          }
        }
      }
    });

    // Join the task room
    sendMessage('JOIN_ROOM', { roomId: `task:${finalTaskId}` });

    return () => {
      // Leave the task room and clean up subscription
      sendMessage('LEAVE_ROOM', { roomId: `task:${finalTaskId}` });
      unsubscribe();
    };
  }, [finalTaskId, task, sendMessage, subscribe]);

  useEffect(() => {
    setAiLoading(aiLoadingData);
    setAiError(aiErrorData);
    setAiInsights(aiInsightsData);
    if (aiInsightsData) {
      setAiSuggestions(aiInsightsData.suggestions || []);
      setAiSimilarTasks(aiInsightsData.similarTasks || []);
      setAiPotentialRisks(aiInsightsData.potentialRisks || []);
    }
  }, [aiLoadingData, aiErrorData, aiInsightsData]);

  if (isLoading || !localTask || !finalTaskId) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <AlertDialog>
          <AlertDialogTrigger>
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
              <p>There was an error loading the task details. Please try again.</p>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogDescription>
              There was an error loading the task details. Please try again.
            </AlertDialogDescription>
            <div className="flex gap-2 mt-4">
              <AlertDialogAction onClick={() => window.location.reload()}>
                Retry
              </AlertDialogAction>
              <AlertDialogAction onClick={() => onBack ? onBack() : navigate(-1)}>
                Go Back
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <span className="mr-1">←</span> Back to tasks
        </button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
        <div className="flex items-center">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {task.projectKey}-{task.id.substring(0, 4)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                ${task.priority === 'highest' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : ''}
                ${task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : ''}
                ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                ${task.priority === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
                ${task.priority === 'lowest' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
              `}>
                {task.priority}
              </span>
            </div>
            <h1 className="text-xl font-bold mt-1">{task.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
            ${task.status === 'todo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : ''}
            ${task.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : ''}
            ${task.status === 'review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : ''}
            ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}
            ${task.status === 'backlog' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
          `}>
            {task.status === 'inProgress' ? 'In Progress' : task.status}
          </span>
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(task)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="mt-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-medium mb-4">Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-800 font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant={task.status === 'todo' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('todo')}
                  >
                    To Do
                  </Button>
                  <Button 
                    size="sm" 
                    variant={task.status === 'inProgress' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('inProgress')}
                  >
                    In Progress
                  </Button>
                  <Button 
                    size="sm" 
                    variant={task.status === 'review' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('review')}
                  >
                    In Review
                  </Button>
                  <Button 
                    size="sm" 
                    variant={task.status === 'done' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('done')}
                  >
                    Done
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assignee</p>
                {task.assignee ? (
                  <div className="flex items-center">
                    {task.assignee.avatar ? (
                      <img 
                        src={task.assignee.avatar} 
                        alt={task.assignee.name} 
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{task.assignee.name}</span>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Unassigned</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reporter</p>
                {task.reporter && (
                  <div className="flex items-center">
                    {task.reporter.avatar ? (
                      <img 
                        src={task.reporter.avatar} 
                        alt={task.reporter.name} 
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                        {task.reporter.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{task.reporter.name}</span>
                  </div>
                )}
              </div>
              {task.dueDate && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              {(task.estimatedHours !== undefined || task.loggedHours !== undefined) && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time Tracking</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {task.loggedHours || 0}h logged
                      {task.estimatedHours !== undefined && ` / ${task.estimatedHours}h estimated`}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p>{formatDateTime(task.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated</p>
                <p>{formatDateTime(task.updatedAt)}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <TaskCommentsSection 
              taskId={finalTaskId} 
              projectId={task?.projectId || ''} 
              currentUserId={currentUser.id} 
            />
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Attachments</h3>
              <Button size="sm" variant="outline">
                <Paperclip className="h-4 w-4 mr-1" />
                Add Attachment
              </Button>
            </div>
            
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No attachments yet</p>
              <p className="text-sm">Drag and drop files here or use the Add Attachment button</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">AI Insights</h3>
            
            {aiLoading && <p>Loading AI insights...</p>}
            {aiError && <p className="text-red-500">Failed to load AI insights</p>}
            {aiInsights && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium mb-2">Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiSuggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-2">Similar Tasks</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiSimilarTasks.map((taskRef: string, index: number) => (
                      <li key={index}>{taskRef}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-2">Potential Risks</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiPotentialRisks.map((risk: string, index: number) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
            <TaskAnalytics taskId={finalTaskId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
