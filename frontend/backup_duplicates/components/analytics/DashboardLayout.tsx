import React, { useState, useEffect } from 'react';
import DashboardWidget from './DashboardWidget';

interface WidgetConfig {
  id: string;
  title: string;
  type: string;
  dataSource: string;
  options?: Record<string, any>;
  width: number;
  height: number;
  x: number;
  y: number;
  refreshInterval?: number;
}

interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

interface DashboardLayoutProps {
  dashboardId?: string;
  userId: string;
  isEditing?: boolean;
  onSave?: (dashboard: DashboardConfig) => void;
}

/**
 * Component for managing and displaying a configurable analytics dashboard layout
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  dashboardId,
  userId,
  isEditing = false,
  onSave
}) => {
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [availableDashboards, setAvailableDashboards] = useState<DashboardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a real implementation, these would be API calls
        // For now, we'll use mock data
        
        const mockDashboards: DashboardConfig[] = [
          {
            id: 'dash1',
            name: 'Project Overview',
            description: 'Key metrics and insights for project management',
            widgets: [
              {
                id: 'widget1',
                title: 'Task Completion Rate',
                type: 'chart',
                dataSource: 'tasks',
                width: 400,
                height: 300,
                x: 0,
                y: 0,
                refreshInterval: 300
              },
              {
                id: 'widget2',
                title: 'Team Performance',
                type: 'table',
                dataSource: 'teams',
                width: 600,
                height: 400,
                x: 420,
                y: 0
              },
              {
                id: 'widget3',
                title: 'Overall Progress',
                type: 'metric',
                dataSource: 'projects',
                width: 300,
                height: 200,
                x: 0,
                y: 320
              }
            ],
            createdBy: userId,
            createdAt: '2023-05-15T10:30:00Z',
            updatedAt: '2023-06-22T14:45:00Z',
            isDefault: true
          },
          {
            id: 'dash2',
            name: 'Team Analytics',
            description: 'Team performance and collaboration metrics',
            widgets: [
              {
                id: 'widget1',
                title: 'Collaboration Network',
                type: 'chart',
                dataSource: 'collaboration',
                width: 800,
                height: 500,
                x: 0,
                y: 0
              },
              {
                id: 'widget2',
                title: 'Time Tracking',
                type: 'chart',
                dataSource: 'timeTracking',
                width: 400,
                height: 300,
                x: 0,
                y: 520
              }
            ],
            createdBy: userId,
            createdAt: '2023-07-10T08:15:00Z',
            updatedAt: '2023-07-10T08:15:00Z',
            isDefault: false
          }
        ];
        
        setAvailableDashboards(mockDashboards);
        
        // Select the specified dashboard or the default
        let selectedDashboard = mockDashboards.find(d => d.id === dashboardId);
        if (!selectedDashboard) {
          selectedDashboard = mockDashboards.find(d => d.isDefault) || mockDashboards[0];
        }
        
        setDashboard(selectedDashboard);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [dashboardId, userId]);
  
  // Add a new widget to the dashboard
  const addWidget = () => {
    if (!dashboard) return;
    
    // Find bottom-most position to place the new widget
    const maxY = dashboard.widgets.reduce((max, widget) => {
      return Math.max(max, widget.y + widget.height);
    }, 0);
    
    const newWidget: WidgetConfig = {
      id: `widget${Date.now()}`,
      title: 'New Widget',
      type: 'chart',
      dataSource: 'tasks',
      width: 400,
      height: 300,
      x: 20,
      y: maxY + 20
    };
    
    setDashboard({
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget],
      updatedAt: new Date().toISOString()
    });
  };
  
  // Delete a widget from the dashboard
  const deleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter(widget => widget.id !== widgetId),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Update widget configuration
  const updateWidgetConfig = (widgetId: string, config: Partial<WidgetConfig>) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, ...config };
        }
        return widget;
      }),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Handle widget move
  const handleWidgetMove = (widgetId: string, x: number, y: number) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, x, y };
        }
        return widget;
      }),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Handle widget resize
  const handleWidgetResize = (widgetId: string, width: number, height: number) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, width, height };
        }
        return widget;
      }),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Save the current dashboard
  const saveDashboard = async () => {
    if (!dashboard || !onSave) return;
    
    try {
      onSave(dashboard);
    } catch (err) {
      console.error('Error saving dashboard:', err);
      setError('Failed to save dashboard');
    }
  };
  
  // Change the selected dashboard
  const changeDashboard = (dashboardId: string) => {
    const selectedDashboard = availableDashboards.find(d => d.id === dashboardId);
    if (selectedDashboard) {
      setDashboard(selectedDashboard);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="dashboard-error">
        <p className="error-message">{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Render no dashboard state
  if (!dashboard) {
    return (
      <div className="dashboard-empty">
        <h3>No Dashboard Available</h3>
        <p>There are no dashboards configured for your account.</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div className="dashboard-info">
          <h2>{dashboard.name}</h2>
          {dashboard.description && <p className="dashboard-description">{dashboard.description}</p>}
        </div>
        
        <div className="dashboard-controls">
          {availableDashboards.length > 1 && (
            <select 
              value={dashboard.id}
              onChange={(e) => changeDashboard(e.target.value)}
              className="dashboard-select"
            >
              {availableDashboards.map(dash => (
                <option key={dash.id} value={dash.id}>
                  {dash.name}
                </option>
              ))}
            </select>
          )}
          
          {isEditing && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={addWidget}
              >
                Add Widget
              </button>
              <button 
                className="btn btn-primary"
                onClick={saveDashboard}
              >
                Save Dashboard
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        {dashboard.widgets.map(widget => (
          <DashboardWidget
            key={widget.id}
            config={widget}
            isEditing={isEditing}
            onConfigChange={(updatedConfig) => updateWidgetConfig(widget.id, updatedConfig)}
            onDelete={() => deleteWidget(widget.id)}
            onResize={(width, height) => handleWidgetResize(widget.id, width, height)}
            onMove={(x, y) => handleWidgetMove(widget.id, x, y)}
          />
        ))}
      </div>
      
      <style jsx>{`
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }
        
        .dashboard-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #eee;
        }
        
        .dashboard-info h2 {
          margin: 0 0 5px 0;
          font-size: 22px;
          font-weight: 600;
        }
        
        .dashboard-description {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .dashboard-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .dashboard-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          font-size: 14px;
          min-width: 150px;
        }
        
        .dashboard-content {
          flex: 1;
          position: relative;
          padding: 20px;
          background-color: #f8f9fa;
          overflow: auto;
          min-height: 600px;
        }
        
        .dashboard-loading, .dashboard-error, .dashboard-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 400px;
          padding: 40px;
          text-align: center;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #4a6cf7;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #dc3545;
          margin-bottom: 20px;
        }
        
        .btn {
          padding: 8px 15px;
          border-radius: 4px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .btn-primary {
          background-color: #4a6cf7;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #3a5ce5;
        }
        
        .btn-secondary {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .btn-secondary:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
