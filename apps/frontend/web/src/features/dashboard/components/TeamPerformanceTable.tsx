import React from 'react';
import { Card } from './ui/Card';
import { TeamPerformance } from '../types';
import { Link } from './ui/Link';
import { Clock, CheckSquare, AlertTriangle } from './icons';
import { useTeamPerformance } from '../hooks/useTeamPerformance';

interface TeamPerformanceTableProps {
  dateRange?: { startDate: string; endDate: string };
}

export const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ 
  dateRange 
}) => {
  const { data: teams, isLoading } = useTeamPerformance(dateRange);
  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = hours / 24;
      return `${days.toFixed(1)} days`;
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600 dark:text-green-400';
    if (rate >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <h2 className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                {[...Array(5)].map((_, index) => (
                  <th key={index} className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(5)].map((_, colIndex) => (
                    <td key={colIndex} className="h-10 bg-gray-200 dark:bg-gray-700 rounded my-2"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Team Performance</h2>
      {teams && teams.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg. Completion Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  On-Time Delivery
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {teams?.map((team: TeamPerformance) => (
                <tr key={team.teamId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/teams/${team.teamId}`} 
                      className="text-sm font-medium text-gray-900 dark:text-white hover:underline"
                    >
                      {team.teamName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${getCompletionRateColor(team.completionRate)}`}>
                        {(team.completionRate * 100).toFixed(0)}%
                      </div>
                      <div className="ml-2">
                        {team.completionRate >= 0.8 ? (
                          <CheckSquare size={16} className="text-green-500" />
                        ) : team.completionRate >= 0.5 ? (
                          <AlertTriangle size={16} className="text-yellow-500" />
                        ) : (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {team.completedTasks}/{team.totalTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={16} className="mr-1" />
                      {formatTime(team.averageTaskCompletionTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getCompletionRateColor(team.onTimeDeliveryRate)}`}>
                      {(team.onTimeDeliveryRate * 100).toFixed(0)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No team performance data available.</p>
      )}
    </Card>
  );
};
