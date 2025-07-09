import React, { useEffect, useState } from 'react';

export function ConnectivityCheck() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [apiMessage, setApiMessage] = useState<string>('Checking API connection...');
  const [apiDetails, setApiDetails] = useState<string>('');
  const [attempted, setAttempted] = useState<boolean>(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setApiStatus('checking');
        setApiMessage('Checking API connection...');
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log(`Trying to connect to API at: ${apiUrl}/api/health`);
        
        // Try a simple fetch with no headers first
        const response = await fetch(`${apiUrl}/api/health`, {
          method: 'GET',
          cache: 'no-cache',
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API health check response:', data);
        
        setApiStatus('connected');
        setApiMessage('Connected to backend API successfully!');
        setApiDetails(JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('API connection error:', error);
        setApiStatus('failed');
        setApiMessage(`Failed to connect to API: ${error.message}`);
        
        // Try connecting directly to the root endpoint
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const rootResponse = await fetch(apiUrl, { 
            method: 'GET',
            cache: 'no-cache',
          });
          
          if (rootResponse.ok) {
            setApiDetails('Root API endpoint is accessible, but /api/health failed. Check API routes configuration.');
          }
        } catch (e) {
          setApiDetails('Cannot connect to API server at all. Make sure it is running.');
        }
      } finally {
        setAttempted(true);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-md z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {apiStatus === 'checking' && (
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          )}
          {apiStatus === 'connected' && (
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {apiStatus === 'failed' && (
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${
            apiStatus === 'connected' ? 'text-green-800 dark:text-green-400' : 
            apiStatus === 'failed' ? 'text-red-800 dark:text-red-400' : 
            'text-gray-800 dark:text-gray-400'
          }`}>
            API Connection Status
          </h3>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {apiMessage}
          </div>
          {apiDetails && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-32">
              {apiDetails}
            </div>
          )}
          
          {apiStatus === 'failed' && attempted && (
            <div className="mt-2">
              <button 
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
