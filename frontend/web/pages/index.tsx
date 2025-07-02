import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ConnectivityCheck } from '../src/components/ConnectivityCheck';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Add delay before redirect for connectivity check to complete
    const redirectTimer = setTimeout(() => {
      // Redirect to dashboard page
      router.push('/dashboard').catch(err => {
        console.error('Failed to navigate to dashboard:', err);
      });
    }, 1000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);

  const [loadingState, setLoadingState] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle router errors
  useEffect(() => {
    const handleRouteError = (err: Error) => {
      console.error('Navigation error:', err);
      setLoadingState('error');
      setErrorMessage(`Navigation error: ${err.message}`);
    };

    router.events.on('routeChangeError', handleRouteError);
    
    // Force timeout if loading takes too long
    const timeoutId = setTimeout(() => {
      if (loadingState === 'loading') {
        setLoadingState('error');
        setErrorMessage('Navigation timeout - dashboard failed to load');
        console.error('Navigation timeout');
      }
    }, 5000);
    
    return () => {
      router.events.off('routeChangeError', handleRouteError);
      clearTimeout(timeoutId);
    };
  }, [router.events, loadingState]);
  
  return (
    <>
      <Head>
        <title>Renexus - {loadingState === 'loading' ? 'Loading' : 'Error'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          {loadingState === 'loading' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Loading Renexus</h2>
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
            </>
          ) : (
            <>
              <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg mb-4">
                <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Navigation Error</h2>
                <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Troubleshooting:</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 text-left">
                  <li>Check if the backend API server is running</li>
                  <li>Verify API connection status below</li>
                  <li>Try visiting <a href="/debug" className="text-blue-600 hover:underline">the debug page</a></li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </>
          )}
        </div>
        
        {/* Add the connectivity check component */}
        <ConnectivityCheck />
      </div>
    </>
  );
}
