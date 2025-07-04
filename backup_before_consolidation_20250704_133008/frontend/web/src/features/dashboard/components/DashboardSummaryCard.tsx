import React from 'react';
import { Card } from '@renexus/ui-components';
import { 
  BarChart2Icon, 
  CheckSquareIcon, 
  ClockIcon, 
  FolderIcon, 
  UsersIcon 
} from 'lucide-react';
import { DashboardSummary } from '../types';

interface DashboardSummaryCardProps {
  data: DashboardSummary;
  isLoading: boolean;
}

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({ 
  data, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex flex-col">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const summaryItems = [
    {
      icon: <FolderIcon className="h-8 w-8 text-blue-500" />,
      label: 'Active Projects',
      value: data.activeProjects,
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-800 dark:text-blue-200',
    },
    {
      icon: <CheckSquareIcon className="h-8 w-8 text-green-500" />,
      label: 'Completed Tasks',
      value: `${data.completedTasks}/${data.totalTasks}`,
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-800 dark:text-green-200',
    },
    {
      icon: <ClockIcon className="h-8 w-8 text-yellow-500" />,
      label: 'Upcoming Deadlines',
      value: data.upcomingDeadlines,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    {
      icon: <UsersIcon className="h-8 w-8 text-purple-500" />,
      label: 'Team Members',
      value: data.teamMembers,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-800 dark:text-purple-200',
    },
    {
      icon: <BarChart2Icon className="h-8 w-8 text-indigo-500" />,
      label: 'Completed Projects',
      value: data.completedProjects,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      textColor: 'text-indigo-800 dark:text-indigo-200',
    },
  ];

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryItems.map((item, index) => (
          <div 
            key={index} 
            className={`flex flex-col p-4 rounded-lg ${item.bgColor}`}
          >
            <div className="flex items-center mb-2">
              {item.icon}
              <span className="ml-2 font-medium text-gray-600 dark:text-gray-300">
                {item.label}
              </span>
            </div>
            <div className={`text-2xl font-bold ${item.textColor}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
