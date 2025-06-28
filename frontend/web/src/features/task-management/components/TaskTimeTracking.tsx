import React, { useState } from 'react';
import { Task } from '../types';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@renexus/ui-components';
import { Clock, Play, Pause, Plus } from 'lucide-react';

interface TaskTimeTrackingProps {
  task: Task;
  onTimeLogged?: () => void;
}

export const TaskTimeTracking: React.FC<TaskTimeTrackingProps> = ({ task, onTimeLogged }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loggedHours, setLoggedHours] = useState(task.loggedHours || 0);
  const [timeToLog, setTimeToLog] = useState<number>(0);
  const [description, setDescription] = useState('');
  const { updateTask, isLoading } = useUpdateTask();

  // Start time tracking
  const startTracking = () => {
    setIsTracking(true);
    setStartTime(Date.now());
  };

  // Stop time tracking
  const stopTracking = () => {
    if (startTime) {
      const elapsed = (Date.now() - startTime) / (1000 * 60 * 60); // Convert to hours
      setElapsedTime(elapsed);
      setTimeToLog(parseFloat(elapsed.toFixed(2)));
      setIsTracking(false);
      setStartTime(null);
      setIsDialogOpen(true);
    }
  };

  // Handle manual time logging
  const openLogTimeDialog = () => {
    setTimeToLog(0);
    setDescription('');
    setIsDialogOpen(true);
  };

  // Log time to the task
  const handleLogTime = async () => {
    if (timeToLog <= 0) return;

    try {
      const newLoggedHours = (task.loggedHours || 0) + timeToLog;
      
      // Add time log entry
      const timeLog = {
        hours: timeToLog,
        description: description,
        date: new Date().toISOString(),
        userId: 'current-user-id', // Replace with actual user ID from auth context
      };
      
      // Update task with new logged hours and time log entry
      await updateTask({
        id: task.id,
        loggedHours: newLoggedHours,
        timeLog: [...(task.timeLog || []), timeLog],
      });
      
      // Update local state
      setLoggedHours(newLoggedHours);
      setIsDialogOpen(false);
      setTimeToLog(0);
      setDescription('');
      
      // Notify parent component
      if (onTimeLogged) {
        onTimeLogged();
      }
    } catch (error) {
      console.error('Failed to log time:', error);
    }
  };

  // Format time display (hours and minutes)
  const formatTime = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  // Calculate progress percentage
  const progressPercentage = task.estimatedHours 
    ? Math.min(Math.round((loggedHours / task.estimatedHours) * 100), 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Time Tracking
        </h3>
        <div className="flex space-x-2">
          {isTracking ? (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={stopTracking}
              className="flex items-center"
            >
              <Pause className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={startTracking}
              className="flex items-center"
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={openLogTimeDialog}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Log Time
          </Button>
        </div>
      </div>
      
      {/* Time tracking progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Logged: {formatTime(loggedHours)}</span>
          {task.estimatedHours && (
            <span>Estimated: {formatTime(task.estimatedHours)}</span>
          )}
        </div>
        
        {task.estimatedHours && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                progressPercentage > 100 
                  ? 'bg-red-600' 
                  : progressPercentage > 75 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        )}
        
        {isTracking && startTime && (
          <div className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
            Currently tracking time...
          </div>
        )}
      </div>
      
      {/* Time log entries */}
      {task.timeLog && task.timeLog.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Recent Time Logs</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {task.timeLog.slice().reverse().map((log, index) => (
              <div key={index} className="text-sm border-l-2 border-blue-500 pl-2">
                <div className="flex justify-between">
                  <span className="font-medium">{formatTime(log.hours)}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
                {log.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                    {log.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Log time dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="timeToLog" className="block text-sm font-medium mb-1">
                Time Spent (hours)
              </label>
              <input
                id="timeToLog"
                type="number"
                min="0"
                step="0.25"
                value={timeToLog}
                onChange={(e) => setTimeToLog(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                placeholder="What did you work on?"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogTime}
              disabled={timeToLog <= 0 || isLoading}
              loading={isLoading}
            >
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskTimeTracking;
