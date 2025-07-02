/**
 * Project Detail Page
 * 
 * Next.js page for viewing a specific project with offline support
 */

import React from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../src/components/layout/AppLayout';
import ProjectManagementPage from '../../../src/features/project-management/pages/ProjectManagementPage';

interface ProjectDetailPageProps {
  projectId: string;
}

const ProjectDetailPage: NextPage<ProjectDetailPageProps> = ({ projectId }) => {
  const router = useRouter();
  
  // If the page is still generating via SSR and doesn't have the query parameters yet
  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Project Details | Renexus</title>
        <meta name="description" content="View project details with offline support" />
      </Head>
      <AppLayout>
        <ProjectManagementPage projectId={projectId} />
      </AppLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { projectId } = context.params || {};
  
  if (!projectId || typeof projectId !== 'string') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      projectId,
    },
  };
};

export default ProjectDetailPage;
