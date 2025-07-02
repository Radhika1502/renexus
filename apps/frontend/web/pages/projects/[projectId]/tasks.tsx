import React from 'react';
import { useRouter } from 'next/router';
import TaskManagementPage from '../../../src/features/task-management/pages/TaskManagementPage';
import { AppLayout } from '../../../src/components/layout/AppLayout';

/**
 * Project-specific tasks page with offline support
 */
const ProjectTasksPage: React.FC = () => {
  const router = useRouter();
  const { projectId } = router.query;

  return (
    <AppLayout>
      <TaskManagementPage />
    </AppLayout>
  );
};

export default ProjectTasksPage;
