import React, { useState } from 'react';
import TaskListWithOfflineSupport from '../components/TaskListWithOfflineSupport';
import { useRouter } from 'next/router';

/**
 * Task Management Page with offline support
 * This page demonstrates the offline sync functionality in a real-world scenario
 */
const TaskManagementPage: React.FC = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const [activeTab, setActiveTab] = useState<'tasks' | 'analytics'>('tasks');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Task Management
        </h1>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/projects')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Back to Projects
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'tasks' ? (
          <TaskListWithOfflineSupport projectId={projectId as string} />
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Task Analytics
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Analytics features are only available when online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagementPage;
