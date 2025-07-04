import React from 'react';
import Head from 'next/head';

export default function TestPage() {
  return (
    <>
      <Head>
        <title>Test Page | Renexus</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Renexus Diagnostic Page</h1>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Environment Variables:</h2>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><span className="font-mono">NEXT_PUBLIC_API_URL:</span> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
              <p><span className="font-mono">NODE_ENV:</span> {process.env.NODE_ENV || 'Not set'}</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <a 
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
            >
              Home Page
            </a>
            <a 
              href="/dashboard"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
            >
              Dashboard
            </a>
            <button
              onClick={() => {
                console.log('Testing browser console output');
                alert('Console log test - Check browser console');
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Console Output
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>If you can see this page, Next.js rendering is working correctly.</p>
          </div>
        </div>
      </div>
    </>
  );
}
