import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@renexus/ui-components';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { useProject } from '../hooks/useProject';
import { Loader } from 'lucide-react';
import { Task } from '../../task-management/types';
import { Chart } from 'react-google-charts';

interface ProjectGanttViewProps {
  projectId: string;
}

export const ProjectGanttView: React.FC<ProjectGanttViewProps> = ({ projectId }) => {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (tasks && project) {
      // Prepare data for Gantt chart
      const data: any[] = [
        [
          { type: 'string', label: 'Task ID' },
          { type: 'string', label: 'Task Name' },
          { type: 'string', label: 'Resource' },
          { type: 'date', label: 'Start Date' },
          { type: 'date', label: 'End Date' },
          { type: 'number', label: 'Duration' },
          { type: 'number', label: 'Percent Complete' },
          { type: 'string', label: 'Dependencies' },
        ]
      ];

      // Add project as the main task
      data.push([
        'Project',
        project.name,
        'Project',
        project.startDate ? new Date(project.startDate) : new Date(),
        project.endDate ? new Date(project.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        null,
        100,
        null
      ]);

      // Process tasks with dependencies
      const taskMap = new Map<string, Task>();
      tasks.forEach(task => taskMap.set(task.id, task));

      tasks.forEach(task => {
        const startDate = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
        const endDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        
        // Calculate percent complete based on status
        let percentComplete = 0;
        switch (task.status) {
          case 'TODO': percentComplete = 0; break;
          case 'IN_PROGRESS': percentComplete = 50; break;
          case 'IN_REVIEW': percentComplete = 80; break;
          case 'DONE': percentComplete = 100; break;
          default: percentComplete = 0;
        }

        // Handle dependencies
        let dependencies = null;
        if (task.dependencies && task.dependencies.length > 0) {
          dependencies = task.dependencies.join(',');
        }

        data.push([
          task.id,
          task.title,
          task.assignee?.name || 'Unassigned',
          startDate,
          endDate,
          null,
          percentComplete,
          dependencies
        ]);
      });

      setChartData(data);
    }
  }, [tasks, project]);

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const options = {
    height: 600,
    gantt: {
      trackHeight: 30,
      criticalPathEnabled: true,
      criticalPathStyle: {
        stroke: '#e74c3c',
        strokeWidth: 2
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{project?.name} Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <Chart
            chartType="Gantt"
            width="100%"
            height="600px"
            data={chartData}
            options={options}
          />
        ) : (
          <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
            No tasks with dates available to display in Gantt chart
          </div>
        )}
      </CardContent>
    </Card>
  );
};
