import { useEffect, useState } from 'react'

export default function Debug() {
  const [apiStatus, setApiStatus] = useState('Checking...')
  const [errorDetails, setErrorDetails] = useState(null)
  const [envVars, setEnvVars] = useState({})
  
  useEffect(() => {
    // Make raw fetch call to backend to test connection
    fetch('http://localhost:3001/api/health')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        setApiStatus(`Connected successfully: ${JSON.stringify(data)}`)
      })
      .catch(error => {
        console.error('API Error:', error)
        setApiStatus(`Failed: ${error.message}`)
        setErrorDetails(error.toString())
      })
    
    // Capture environment variables
    setEnvVars({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    })
    
    // Test if window is defined (client-side rendering)
    if (typeof window !== 'undefined') {
      console.log('Debug page loaded - client side rendering works')
    }
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333' }}>Renexus Debug Page</h1>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Rendering Test</h2>
        <p>If you can see this, basic React rendering is working!</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Environment Variables</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>API Connection Status</h2>
        <p style={{ 
          padding: '10px', 
          borderRadius: '4px',
          background: apiStatus.includes('Connected') ? '#e6ffe6' : '#ffe6e6'
        }}>
          {apiStatus}
        </p>
        
        {errorDetails && (
          <div style={{ marginTop: '10px' }}>
            <h3>Error Details:</h3>
            <pre style={{ background: '#ffe6e6', padding: '10px', overflow: 'auto' }}>
              {errorDetails}
            </pre>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Navigation</h2>
        <ul>
          <li><a href="/" style={{ color: 'blue' }}>Go to Home</a></li>
          <li><a href="/dashboard" style={{ color: 'blue' }}>Go to Dashboard</a></li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', background: '#f9f9f9' }}>
        <h2>Troubleshooting Steps</h2>
        <ol>
          <li>Verify API status above is "Connected successfully"</li>
          <li>Check that the NEXT_PUBLIC_API_URL is set correctly</li>
          <li>Ensure backend server is running on port 3001</li>
          <li>If API connection fails, try opening the browser console (F12) and check for CORS or other errors</li>
        </ol>
      </div>
    </div>
  )
}
