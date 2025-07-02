/**
 * Projects Page
 * 
 * Next.js page for project management with offline support
 */

import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '../../src/components/layout/AppLayout';
import ProjectManagementPage from '../../src/features/project-management/pages/ProjectManagementPage';

const ProjectsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Projects | Renexus</title>
        <meta name="description" content="Manage your projects with offline support" />
      </Head>
      <AppLayout>
        <ProjectManagementPage />
      </AppLayout>
    </>
  );
};

export default ProjectsPage;
