import React from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';

export default function ProjectsPage() {
  return (
    <>
      <Head>
        <title>Projects | Renexus</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Projects</h1>
          <p>Project management page coming soon...</p>
        </div>
      </Layout>
    </>
  );
} 
