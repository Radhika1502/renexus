import React from 'react';
import TaskManagementPage from '../../src/features/task-management/pages/TaskManagementPage';
import { AppLayout } from '../../src/components/layout/AppLayout';

/**
 * Tasks page with offline support
 */
const TasksPage: React.FC = () => {
  return (
    <AppLayout>
      <TaskManagementPage />
    </AppLayout>
  );
};

export default TasksPage;
