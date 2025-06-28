import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ProjectMetricsPage } from '../features/dashboard/pages/ProjectMetricsPage';
import { TeamManagementPage } from '../features/team-management/pages/TeamManagementPage';
import { SprintManagementPage } from '../features/sprint-management/pages/SprintManagementPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects/:projectId/metrics" element={<ProjectMetricsPage />} />
          <Route path="teams/*" element={<TeamManagementPage />} />
          <Route path="sprints/*" element={<SprintManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
