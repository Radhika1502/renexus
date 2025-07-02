import React, { useState } from 'react';
import WidgetConfigPanel from './index';
import { WidgetConfig, WidgetDataSourceOption } from './types';

/**
 * Example component demonstrating how to integrate the Widget Configuration Panel
 * into the dashboard system
 */
const WidgetConfigPanelExample: React.FC = () => {
  // State to track if the panel is open
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  
  // State to store the current widget being edited (if any)
  const [currentWidget, setCurrentWidget] = useState<WidgetConfig | null>(null);
  
  // State to store all widgets in the dashboard
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetConfig[]>([]);
  
  // Mock available data sources for the example
  const availableDataSources: WidgetDataSourceOption[] = [
    {
      id: 'sales-data',
      name: 'Sales Data',
      description: 'Monthly sales data for all products',
      type: 'api',
      endpoint: '/api/sales',
      parameters: [
        { name: 'startDate', type: 'date', required: true },
        { name: 'endDate', type: 'date', required: true },
        { name: 'product', type: 'string', required: false }
      ],
      sampleData: [
        { month: 'Jan', sales: 1200 },
        { month: 'Feb', sales: 1800 },
        { month: 'Mar', sales: 1600 }
      ]
    },
    {
      id: 'user-metrics',
      name: 'User Metrics',
      description: 'User engagement and activity metrics',
      type: 'api',
      endpoint: '/api/users/metrics',
      parameters: [
        { name: 'period', type: 'string', required: true },
        { name: 'segment', type: 'string', required: false }
      ],
      sampleData: [
        { segment: 'New Users', count: 450 },
        { segment: 'Active Users', count: 1200 },
        { segment: 'Churned Users', count: 120 }
      ]
    },
    {
      id: 'performance-kpis',
      name: 'Performance KPIs',
      description: 'Key performance indicators for the business',
      type: 'api',
      endpoint: '/api/kpis',
      parameters: [
        { name: 'timeframe', type: 'string', required: true }
      ],
      sampleData: [
        { kpi: 'Revenue', value: '$125,000', trend: 'up' },
        { kpi: 'Costs', value: '$78,000', trend: 'down' },
        { kpi: 'Profit Margin', value: '37.6%', trend: 'up' }
      ]
    }
  ];
  
  // Open panel to create a new widget
  const handleCreateWidget = () => {
    setCurrentWidget(null); // No existing widget to edit
    setIsConfigPanelOpen(true);
  };
  
  // Open panel to edit an existing widget
  const handleEditWidget = (widget: WidgetConfig) => {
    setCurrentWidget(widget);
    setIsConfigPanelOpen(true);
  };
  
  // Handle saving a widget configuration
  const handleSaveWidget = (widgetConfig: WidgetConfig) => {
    if (currentWidget) {
      // Update existing widget
      setDashboardWidgets(
        dashboardWidgets.map(w => 
          w.id === widgetConfig.id ? widgetConfig : w
        )
      );
    } else {
      // Add new widget
      setDashboardWidgets([...dashboardWidgets, widgetConfig]);
    }
    
    // Close the panel
    setIsConfigPanelOpen(false);
  };
  
  // Handle deleting a widget
  const handleDeleteWidget = (widgetId: string) => {
    setDashboardWidgets(dashboardWidgets.filter(w => w.id !== widgetId));
  };
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <button 
          className="create-widget-button"
          onClick={handleCreateWidget}
        >
          Add Widget
        </button>
      </div>
      
      <div className="widgets-grid">
        {dashboardWidgets.map(widget => (
          <div 
            key={widget.id} 
            className={`widget-container widget-${widget.size}`}
          >
            <div className="widget-header">
              <h3>{widget.title}</h3>
              <div className="widget-actions">
                <button 
                  className="edit-button"
                  onClick={() => handleEditWidget(widget)}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteWidget(widget.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="widget-content">
              {/* Widget content would be rendered here based on configuration */}
              <div className="widget-placeholder">
                {widget.visualization.type} visualization of {widget.dataSource.source}
              </div>
            </div>
          </div>
        ))}
        
        {dashboardWidgets.length === 0 && (
          <div className="empty-dashboard">
            <p>No widgets added yet. Click "Add Widget" to create your first dashboard widget.</p>
          </div>
        )}
      </div>
      
      {isConfigPanelOpen && (
        <WidgetConfigPanel
          widget={currentWidget || undefined}
          onSave={handleSaveWidget}
          onCancel={() => setIsConfigPanelOpen(false)}
          availableDataSources={availableDataSources}
          isNew={!currentWidget}
        />
      )}
      
      <style>{`
        .dashboard-container {
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .create-widget-button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .widgets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .widget-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .widget-small {
          grid-column: span 1;
        }
        
        .widget-medium {
          grid-column: span 2;
        }
        
        .widget-large {
          grid-column: span 3;
        }
        
        .widget-header {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .widget-header h3 {
          margin: 0;
          font-size: 16px;
        }
        
        .widget-actions {
          display: flex;
          gap: 8px;
        }
        
        .edit-button, .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .edit-button {
          color: #4a6cf7;
        }
        
        .edit-button:hover {
          background-color: #f0f4ff;
        }
        
        .delete-button {
          color: #f44336;
        }
        
        .delete-button:hover {
          background-color: #ffebee;
        }
        
        .widget-content {
          padding: 16px;
          min-height: 200px;
        }
        
        .widget-placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          text-align: center;
          font-style: italic;
        }
        
        .empty-dashboard {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default WidgetConfigPanelExample;
