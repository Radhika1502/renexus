import React from 'react';
import { Progress } from '@renexus/ui-components';
import { CalendarClock, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export interface Phase {
  id: number;
  name: string;
  totalTasks: number;
  completedTasks: number;
  deadline: string;
  features: Feature[];
}

export interface Feature {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'not-started';
  percentage: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  subTasks: SubTask[];
}

export interface SubTask {
  id: number;
  name: string;
  completed: boolean;
}

interface PhaseProgressTrackerProps {
  phase: Phase;
  showDetails?: boolean;
}

export const PhaseProgressTracker: React.FC<PhaseProgressTrackerProps> = ({
  phase,
  showDetails = true,
}) => {
  const completionPercentage = Math.round((phase.completedTasks / phase.totalTasks) * 100);
  const remainingTasks = phase.totalTasks - phase.completedTasks;
  
  // Calculate if we're on track, ahead, or behind schedule
  const today = new Date();
  const deadline = new Date(phase.deadline);
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Simple heuristic: if more than 70% of time has passed, we should have completed at least 70% of tasks
  const totalDuration = 90; // Assuming 90 days for a phase
  const daysPassed = totalDuration - daysRemaining;
  const timePercentagePassed = (daysPassed / totalDuration) * 100;
  
  let scheduleStatus: 'on-track' | 'ahead' | 'behind' = 'on-track';
  if (completionPercentage >= timePercentagePassed + 10) {
    scheduleStatus = 'ahead';
  } else if (completionPercentage < timePercentagePassed - 10) {
    scheduleStatus = 'behind';
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{phase.name}</h2>
        <div className="flex items-center">
          <CalendarClock className="h-5 w-5 mr-2 text-blue-500" />
          <span className={`font-medium ${daysRemaining <= 14 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
            {daysRemaining} days remaining
          </span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress ({completionPercentage}%)</span>
          <span className="text-sm text-gray-500">{phase.completedTasks}/{phase.totalTasks} tasks</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {scheduleStatus === 'on-track' && (
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
          )}
          {scheduleStatus === 'ahead' && (
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
          )}
          {scheduleStatus === 'behind' && (
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
          )}
          <span className={`font-medium ${
            scheduleStatus === 'on-track' ? 'text-blue-500' : 
            scheduleStatus === 'ahead' ? 'text-green-500' : 'text-red-500'
          }`}>
            {scheduleStatus === 'on-track' ? 'On Track' : 
             scheduleStatus === 'ahead' ? 'Ahead of Schedule' : 'Behind Schedule'}
          </span>
        </div>
        <span className="text-sm text-gray-500">{remainingTasks} tasks remaining</span>
      </div>
      
      {showDetails && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Feature Breakdown</h3>
          <div className="space-y-4">
            {phase.features.map((feature) => (
              <div key={feature.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      feature.status === 'completed' ? 'bg-green-500' :
                      feature.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></span>
                    <h4 className="font-medium">{feature.name}</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    feature.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    feature.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {feature.priority}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">{feature.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        feature.status === 'completed' ? 'bg-green-500' :
                        feature.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${feature.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-300">
                      {feature.subTasks.filter(st => st.completed).length}/{feature.subTasks.length} subtasks
                    </summary>
                    <ul className="mt-2 space-y-1 pl-5">
                      {feature.subTasks.map((subtask) => (
                        <li key={subtask.id} className="flex items-center">
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            subtask.completed ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                            {subtask.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseProgressTracker;
