import React from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Settings | Renexus</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <p>Application settings page coming soon...</p>
        </div>
      </Layout>
    </>
  );
} 
