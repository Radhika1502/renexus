import React from 'react';
import Head from 'next/head';

export default function TestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <Head>
        <title>Renexus Test Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-6 text-blue-600">Renexus Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md w-full mb-6">
          <h2 className="text-2xl font-semibold mb-4">Next.js is working!</h2>
          <p className="mb-4">
            This page confirms that your Next.js frontend is operational.
          </p>
          <p>
            Environment variable test: API URL is{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_API_URL || 'undefined'}
            </code>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <a 
            href="/"
            className="group bg-white rounded-lg border p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
          >
            <h2 className="text-xl font-semibold">
              Home <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </h2>
            <p className="text-gray-500">
              Return to home page
            </p>
          </a>
          
          <a 
            href="/debug"
            className="group bg-white rounded-lg border p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
          >
            <h2 className="text-xl font-semibold">
              Debug <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </h2>
            <p className="text-gray-500">
              View the debug page
            </p>
          </a>
        </div>
      </main>
      
      <footer className="w-full border-t p-6 text-center text-gray-500">
        Renexus Application - {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}
