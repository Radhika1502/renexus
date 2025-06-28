import React from 'react';
import { Card } from '@renexus/ui-components';
import { TimelineEvent } from '../types';
import { 
  CalendarIcon, 
  FlagIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  PlayIcon,
  StopIcon
} from 'lucide-react';

interface TimelineComponentProps {
  events: TimelineEvent[];
  isLoading: boolean;
}

export const TimelineComponent: React.FC<TimelineComponentProps> = ({ 
  events, 
  isLoading 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventIcon = (type: string, completed: boolean) => {
    switch (type) {
      case 'MILESTONE':
        return completed ? 
          <FlagIcon className="h-5 w-5 text-green-500" /> : 
          <FlagIcon className="h-5 w-5 text-blue-500" />;
      case 'DEADLINE':
        return completed ? 
          <CheckCircleIcon className="h-5 w-5 text-green-500" /> : 
          <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case 'SPRINT_START':
        return <PlayIcon className="h-5 w-5 text-purple-500" />;
      case 'SPRINT_END':
        return <StopIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <CalendarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'MILESTONE':
        return 'Milestone';
      case 'DEADLINE':
        return 'Deadline';
      case 'SPRINT_START':
        return 'Sprint Start';
      case 'SPRINT_END':
        return 'Sprint End';
      default:
        return 'Event';
    }
  };

  const sortedEvents = events ? [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) : [];

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <h2 className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></h2>
        <div className="space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
      {sortedEvents.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          
          <div className="space-y-6">
            {sortedEvents.map((event) => (
              <div key={event.id} className="flex">
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  event.completed 
                    ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-400' 
                    : 'bg-white border-blue-500 dark:bg-gray-800 dark:border-blue-400'
                } mr-4`}>
                  {getEventIcon(event.type, event.completed)}
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                      {event.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.completed
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="mr-3">
                      <CalendarIcon className="inline h-3 w-3 mr-1" />
                      {formatDate(event.date)}
                    </span>
                    <span>
                      Project: {event.projectName}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No timeline events found.</p>
      )}
    </Card>
  );
};
