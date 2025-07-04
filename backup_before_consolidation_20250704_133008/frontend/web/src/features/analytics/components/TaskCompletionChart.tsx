import React from 'react';

interface TaskCompletionChartProps {
  completed: number;
  total: number;
}

export const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({
  completed,
  total,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const strokeWidth = 10;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold">{percentage}%</span>
          <span className="text-sm text-gray-500">Completed</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {completed} of {total} tasks completed
        </p>
      </div>
    </div>
  );
};

export default TaskCompletionChart;
