import React from 'react';

interface TimeTrackingReportProps {
  estimated: number;
  actual: number;
}

export const TimeTrackingReport: React.FC<TimeTrackingReportProps> = ({
  estimated,
  actual,
}) => {
  const difference = estimated - actual;
  const isOverBudget = difference < 0;
  const diffPercentage = estimated > 0 
    ? Math.abs(Math.round((difference / estimated) * 100)) 
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-2">
        <div>
          <p className="text-sm text-gray-500">Estimated</p>
          <p className="text-xl font-semibold">{estimated}h</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Actual</p>
          <p className="text-xl font-semibold">{actual}h</p>
        </div>
      </div>
      
      <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full mt-2">
        <div 
          className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(Math.max((actual / estimated) * 100, 0), 100)}%` }}
        ></div>
        {estimated > 0 && (
          <div 
            className="absolute top-0 h-full border-l-2 border-gray-800 dark:border-gray-200"
            style={{ left: `${Math.min(100, 100)}%` }}
          ></div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
          {isOverBudget 
            ? `${diffPercentage}% over budget (${Math.abs(difference)}h)`
            : `${diffPercentage}% under budget (${difference}h)`
          }
        </p>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-xs text-gray-500">Avg. hours per task</p>
          <p className="text-lg font-medium">{(actual / (estimated || 1)).toFixed(1)}h</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <p className="text-xs text-gray-500">Efficiency</p>
          <p className="text-lg font-medium">
            {isOverBudget 
              ? `${Math.min(100, Math.round((estimated / actual) * 100))}%` 
              : '100%'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingReport;
