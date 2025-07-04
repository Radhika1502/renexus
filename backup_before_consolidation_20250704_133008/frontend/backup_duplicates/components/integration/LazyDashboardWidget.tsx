import React, { useState, useEffect, Suspense, lazy } from 'react';

interface LazyDashboardWidgetProps {
  /**
   * Component path relative to components directory
   * e.g. 'analytics/TimeSeriesForecasting' for TimeSeriesForecasting component
   */
  componentPath: string;
  
  /**
   * Props to pass to the loaded component
   */
  componentProps?: Record<string, any>;
  
  /**
   * Whether to load the component immediately or wait for visibility
   * @default false
   */
  loadImmediately?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;
  
  /**
   * Callback when component is loaded
   */
  onLoad?: () => void;
  
  /**
   * Callback when component fails to load
   */
  onError?: (error: Error) => void;
  
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * LazyDashboardWidget component
 * Provides lazy loading capabilities for dashboard widgets with
 * IntersectionObserver for visibility-based loading
 */
const LazyDashboardWidget: React.FC<LazyDashboardWidgetProps> = ({
  componentPath,
  componentProps = {},
  loadImmediately = false,
  loadingComponent,
  errorComponent,
  onLoad,
  onError,
  className
}) => {
  const [shouldLoad, setShouldLoad] = useState(loadImmediately);
  const [error, setError] = useState<Error | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  
  // Reference for the container element
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Load component dynamically
  useEffect(() => {
    if (!shouldLoad) return;
    
    const loadComponent = async () => {
      try {
        // Dynamic import based on component path
        // This assumes all components are in the components directory
        const module = await import(`../../components/${componentPath}`);
        
        // Get the default export from the module
        const LoadedComponent = module.default;
        
        if (!LoadedComponent) {
          throw new Error(`Component at path ${componentPath} does not have a default export`);
        }
        
        setComponent(() => LoadedComponent);
        
        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        console.error(`Failed to load component: ${componentPath}`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };
    
    loadComponent();
  }, [shouldLoad, componentPath, onLoad, onError]);
  
  // Setup IntersectionObserver to detect when the component is visible
  useEffect(() => {
    if (loadImmediately || !containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // If the component is visible, load it
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null, // viewport
        rootMargin: '100px', // load when within 100px of viewport
        threshold: 0.1 // 10% visibility is enough to trigger
      }
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [loadImmediately]);
  
  // Default loading component
  const DefaultLoading = (
    <div className="lazy-widget-loading">
      <div className="loading-spinner"></div>
      <p>Loading widget...</p>
    </div>
  );
  
  // Default error component
  const DefaultError = (
    <div className="lazy-widget-error">
      <div className="error-icon">⚠️</div>
      <h4>Failed to load widget</h4>
      <p>{error?.message || 'Unknown error occurred'}</p>
      <button onClick={() => setShouldLoad(true)}>
        Retry
      </button>
    </div>
  );
  
  return (
    <div 
      ref={containerRef}
      className={`lazy-dashboard-widget ${className || ''}`}
    >
      {!shouldLoad ? (
        <div className="lazy-widget-placeholder">
          <div className="placeholder-icon">📊</div>
          <div className="placeholder-text">
            <div className="placeholder-line"></div>
            <div className="placeholder-line short"></div>
          </div>
        </div>
      ) : error ? (
        errorComponent || DefaultError
      ) : Component ? (
        <Component {...componentProps} />
      ) : (
        loadingComponent || DefaultLoading
      )}
      
      <style jsx>{`
        .lazy-dashboard-widget {
          position: relative;
          min-height: 200px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .lazy-widget-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 200px;
          padding: 20px;
          background-color: #f9f9f9;
          border: 1px dashed #ddd;
          border-radius: 8px;
        }
        
        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .placeholder-text {
          width: 80%;
        }
        
        .placeholder-line {
          height: 12px;
          background-color: #eee;
          border-radius: 4px;
          margin-bottom: 8px;
          animation: pulse 1.5s infinite;
        }
        
        .placeholder-line.short {
          width: 60%;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
        
        .lazy-widget-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 200px;
          padding: 20px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4a6cf7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .lazy-widget-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 200px;
          padding: 20px;
          text-align: center;
        }
        
        .error-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        
        .lazy-widget-error h4 {
          margin: 0 0 8px 0;
          color: #d32f2f;
        }
        
        .lazy-widget-error p {
          margin: 0 0 16px 0;
          color: #666;
          font-size: 14px;
        }
        
        .lazy-widget-error button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .lazy-widget-error button:hover {
          background-color: #3a5ce5;
        }
      `}</style>
    </div>
  );
};

export default LazyDashboardWidget;
