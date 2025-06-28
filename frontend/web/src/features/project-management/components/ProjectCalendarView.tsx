import React, { useState } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { useProject } from '../hooks/useProject';
import { Loader } from 'lucide-react';
import { Task } from '../../task-management/types';
import { Card, CardContent, CardHeader, CardTitle } from '@renexus/ui-components';

interface ProjectCalendarViewProps {
  projectId: string;
}

// Setup the localizer for the calendar
const localizer = momentLocalizer(moment);

export const ProjectCalendarView: React.FC<ProjectCalendarViewProps> = ({ projectId }) => {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // Convert tasks to calendar events
  const events = tasks?.map(task => ({
    id: task.id,
    title: task.title,
    start: new Date(task.startDate || task.createdAt),
    end: new Date(task.dueDate || moment(task.createdAt).add(1, 'days').toDate()),
    allDay: !task.startDate || !task.dueDate,
    resource: task,
  })) || [];

  // Add project start and end as events if available
  if (project?.startDate) {
    events.push({
      id: 'project-start',
      title: `${project.name} Start`,
      start: new Date(project.startDate),
      end: new Date(project.startDate),
      allDay: true,
      resource: { 
        id: 'project-start',
        title: `${project.name} Start`,
        isProjectEvent: true,
        status: 'PROJECT_EVENT'
      } as unknown as Task,
    });
  }

  if (project?.endDate) {
    events.push({
      id: 'project-end',
      title: `${project.name} Deadline`,
      start: new Date(project.endDate),
      end: new Date(project.endDate),
      allDay: true,
      resource: { 
        id: 'project-end',
        title: `${project.name} Deadline`,
        isProjectEvent: true,
        status: 'PROJECT_EVENT'
      } as unknown as Task,
    });
  }

  // Custom event styling based on task status
  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    let style: React.CSSProperties = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block',
    };

    if (task.isProjectEvent) {
      style.backgroundColor = '#6366f1'; // Indigo for project events
      return { style };
    }

    switch (task.status) {
      case 'TODO':
        style.backgroundColor = '#f97316'; // Orange for todo
        break;
      case 'IN_PROGRESS':
        style.backgroundColor = '#3b82f6'; // Blue for in progress
        break;
      case 'IN_REVIEW':
        style.backgroundColor = '#a855f7'; // Purple for in review
        break;
      case 'DONE':
        style.backgroundColor = '#22c55e'; // Green for done
        break;
      default:
        style.backgroundColor = '#6b7280'; // Gray for other statuses
    }

    // If task is overdue and not done, highlight it
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE') {
      style.backgroundColor = '#ef4444'; // Red for overdue
      style.fontWeight = 'bold';
    }

    return { style };
  };

  const handleSelectEvent = (event: any) => {
    // Handle event selection - could open task details modal
    console.log('Selected event:', event);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{project?.name} Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-220px)]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            view={view as any}
            date={date}
            onView={(newView) => setView(newView)}
            onNavigate={(newDate) => setDate(newDate)}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            popup
            selectable
          />
        </div>
      </CardContent>
    </Card>
  );
};
