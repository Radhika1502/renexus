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
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Track container width for responsive adjustments
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('dashboard-container');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  
  // Adjust widget layout for different screen sizes
  const getResponsiveLayout = (widgets: WidgetConfig[]): WidgetConfig[] => {
    if (containerWidth === 0) return widgets;
    
    const columns = containerWidth >= 1280 ? 3 : containerWidth >= 768 ? 2 : 1;
    const gutterSize = 20;
    const columnWidth = (containerWidth - (gutterSize * (columns + 1))) / columns;
    
    return widgets.map((widget, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      
      // Calculate total height of widgets in previous rows
      const previousRowsHeight = row > 0 ? 
        Math.max(
          ...widgets
            .slice(0, row * columns)
            .filter((_, i) => i % columns === column)
            .map(w => w.y + w.height)
        ) : 0;
      
      return {
        ...widget,
        width: columnWidth,
        x: column * (columnWidth + gutterSize) + gutterSize,
        y: previousRowsHeight + (row > 0 ? gutterSize : 0)
      };
    });
  };
  
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
      widgets: getResponsiveLayout([...dashboard.widgets, newWidget]),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Delete a widget from the dashboard
  const deleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: getResponsiveLayout(dashboard.widgets.filter(widget => widget.id !== widgetId)),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Update widget configuration
  const updateWidgetConfig = (widgetId: string, config: Partial<WidgetConfig>) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: getResponsiveLayout(
        dashboard.widgets.map(widget => 
          widget.id === widgetId ? { ...widget, ...config } : widget
        )
      ),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Handle widget movement
  const handleWidgetMove = (widgetId: string, x: number, y: number) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(widget => 
        widget.id === widgetId ? { ...widget, x, y } : widget
      ),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Handle widget resize
  const handleWidgetResize = (widgetId: string, width: number, height: number) => {
    if (!dashboard) return;
    
    setDashboard({
      ...dashboard,
      widgets: getResponsiveLayout(
        dashboard.widgets.map(widget => 
          widget.id === widgetId ? { ...widget, width, height } : widget
        )
      ),
      updatedAt: new Date().toISOString()
    });
  };
  
  // Save dashboard changes
  const saveDashboard = async () => {
    if (!dashboard || !onSave) return;
    
    try {
      await onSave(dashboard);
    } catch (err) {
      console.error('Error saving dashboard:', err);
      setError('Failed to save dashboard changes');
    }
  };
  
  // Change selected dashboard
  const changeDashboard = (dashboardId: string) => {
    const selected = availableDashboards.find(d => d.id === dashboardId);
    if (selected) {
      setDashboard(selected);
    }
  };
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  
  if (!dashboard) {
    return <div className="p-4 text-center">No dashboard available</div>;
  }
  
  return (
    <div 
      id="dashboard-container"
      className="relative w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{dashboard.description}</p>
          )}
        </div>
        
        <div className="flex space-x-4">
          {isEditing && (
            <>
              <button
                onClick={addWidget}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Widget
              </button>
              <button
                onClick={saveDashboard}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="relative">
        {getResponsiveLayout(dashboard.widgets).map(widget => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            isEditing={isEditing}
            onMove={handleWidgetMove}
            onResize={handleWidgetResize}
            onDelete={deleteWidget}
            onConfigUpdate={updateWidgetConfig}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardLayout;
