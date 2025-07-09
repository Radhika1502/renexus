import React, { useState, useEffect } from 'react';
import { 
  fetchTimeEntries, 
  startTimeTracking, 
  stopTimeTracking, 
  createTimeEntry 
} from '../../../services/taskService';
import styles from './TaskTimeTracking.module.css';

interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null; // in seconds
  notes: string | null;
  userId: string;
  userName: string;
}

interface ActiveTimer {
  taskId: string;
  startTime: Date;
  elapsedSeconds: number;
  intervalId: NodeJS.Timeout | null;
}

interface TaskTimeTrackingProps {
  taskId: string;
  userId: string;
  userName: string;
}

const TaskTimeTracking: React.FC<TaskTimeTrackingProps> = ({ taskId, userId, userName }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        setLoading(true);
        const entries = await fetchTimeEntries(taskId);
        setTimeEntries(entries);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load time entries:', err);
        setError('Failed to load time entries. Please try again.');
        setLoading(false);
      }
    };

    loadTimeEntries();

    // Check if there's an active timer in the backend
    checkForActiveTimer();

    // Clean up interval on unmount
    return () => {
      if (activeTimer?.intervalId) {
        clearInterval(activeTimer.intervalId);
      }
    };
  }, [taskId]);

  // Check if there's an active timer for this task
  const checkForActiveTimer = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/time/active`);
      const data = await response.json();
      
      if (data && data.isActive && data.startTime) {
        // There is an active timer, let's resume it
        const startTime = new Date(data.startTime);
        const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        
        // Start the timer UI
        startTimerUI(startTime, elapsedSeconds);
      }
    } catch (err) {
      console.error('Failed to check for active timer:', err);
    }
  };

  const startTimerUI = (startTime: Date, initialElapsedSeconds: number = 0) => {
    // Create an interval to update the timer every second
    const intervalId = setInterval(() => {
      setActiveTimer(prevTimer => {
        if (!prevTimer) return null;
        
        return {
          ...prevTimer,
          elapsedSeconds: prevTimer.elapsedSeconds + 1
        };
      });
    }, 1000);
    
    // Set the active timer state
    setActiveTimer({
      taskId,
      startTime,
      elapsedSeconds: initialElapsedSeconds,
      intervalId
    });
  };

  const handleStartTimer = async () => {
    try {
      const startTime = new Date();
      
      // Start the timer in the backend
      await startTimeTracking(taskId, startTime.toISOString());
      
      // Start the timer UI
      startTimerUI(startTime);
    } catch (err) {
      console.error('Failed to start timer:', err);
      setError('Failed to start timer. Please try again.');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      const endTime = new Date();
      
      // Stop the timer in the backend
      const newEntry = await stopTimeTracking(
        taskId, 
        endTime.toISOString(), 
        activeTimer.elapsedSeconds,
        notes
      );
      
      // Clear the interval
      if (activeTimer.intervalId) {
        clearInterval(activeTimer.intervalId);
      }
      
      // Reset the active timer
      setActiveTimer(null);
      
      // Clear notes
      setNotes('');
      
      // Add the new time entry to the list
      setTimeEntries([...timeEntries, newEntry]);
    } catch (err) {
      console.error('Failed to stop timer:', err);
      setError('Failed to stop timer. Please try again.');
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const hours = parseInt(formData.get('hours') as string) || 0;
    const minutes = parseInt(formData.get('minutes') as string) || 0;
    const entryNotes = formData.get('manualNotes') as string;
    
    if (hours === 0 && minutes === 0) {
      setError('Please enter a valid time.');
      return;
    }
    
    try {
      const totalSeconds = (hours * 3600) + (minutes * 60);
      const now = new Date();
      const startTime = new Date(now.getTime() - totalSeconds * 1000);
      
      const newEntry = await createTimeEntry({
        taskId,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        duration: totalSeconds,
        notes: entryNotes,
        userId,
        userName
      });
      
      // Add the new entry to the list
      setTimeEntries([...timeEntries, newEntry]);
      
      // Reset the form
      form.reset();
    } catch (err) {
      console.error('Failed to create manual entry:', err);
      setError('Failed to create manual entry. Please try again.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getTotalDuration = (): number => {
    return timeEntries.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0);
  };

  if (loading) {
    return <div className={styles.loading}>Loading time tracking data...</div>;
  }

  return (
    <div className={styles.taskTimeTracking} data-testid="task-time-tracking">
      <h3>Time Tracking</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.timerSection}>
        {activeTimer ? (
          <div className={styles.activeTimer}>
            <div className={styles.timerDisplay}>
              {formatDuration(activeTimer.elapsedSeconds)}
            </div>
            
            <div className={styles.timerControls}>
              <textarea
                className={styles.timerNotes}
                placeholder="Add notes about what you're working on..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              
              <button
                className={styles.stopButton}
                onClick={handleStopTimer}
              >
                Stop Timer
              </button>
            </div>
          </div>
        ) : (
          <button
            className={styles.startButton}
            onClick={handleStartTimer}
          >
            Start Timer
          </button>
        )}
      </div>
      
      <div className={styles.manualEntrySection}>
        <h4>Add Time Manually</h4>
        
        <form onSubmit={handleManualEntry} className={styles.manualEntryForm}>
          <div className={styles.timeInputs}>
            <div className={styles.inputGroup}>
              <label htmlFor="hours">Hours</label>
              <input
                type="number"
                id="hours"
                name="hours"
                min="0"
                max="24"
                step="1"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="minutes">Minutes</label>
              <input
                type="number"
                id="minutes"
                name="minutes"
                min="0"
                max="59"
                step="1"
              />
            </div>
          </div>
          
          <textarea
            className={styles.manualNotes}
            name="manualNotes"
            placeholder="Notes (optional)"
          />
          
          <button type="submit" className={styles.addButton}>
            Add Time
          </button>
        </form>
      </div>
      
      <div className={styles.timeEntriesSection}>
        <h4>Time Entries</h4>
        
        {timeEntries.length > 0 ? (
          <>
            <div className={styles.totalTime}>
              Total Time: {formatDuration(getTotalDuration())}
            </div>
            
            <ul className={styles.entriesList}>
              {timeEntries.map((entry) => (
                <li key={entry.id} className={styles.entryItem}>
                  <div className={styles.entryHeader}>
                    <span className={styles.entryDuration}>
                      {entry.duration ? formatDuration(entry.duration) : 'In progress'}
                    </span>
                    <span className={styles.entryUser}>
                      {entry.userName}
                    </span>
                  </div>
                  
                  <div className={styles.entryTime}>
                    {new Date(entry.startTime).toLocaleDateString()} {new Date(entry.startTime).toLocaleTimeString()} 
                    {entry.endTime && (
                      <> - {new Date(entry.endTime).toLocaleTimeString()}</>
                    )}
                  </div>
                  
                  {entry.notes && (
                    <div className={styles.entryNotes}>{entry.notes}</div>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.noEntries}>No time entries recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default TaskTimeTracking;
