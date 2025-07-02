import React from 'react';

interface CardComponentProps {
  className?: string;
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardComponentProps> = ({ className = '', children }) => {
  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardComponentProps> = ({ className = '', children }) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardComponentProps> = ({ className = '', children }) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardComponentProps> = ({ className = '', children }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};
