import React, { useState, useRef, useEffect } from 'react';

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
  refreshInterval?: number; // in seconds
}

interface DashboardWidgetProps {
  config: WidgetConfig;
  isEditing: boolean;
  onConfigChange?: (updatedConfig: WidgetConfig) => void;
  onDelete?: () => void;
  onResize?: (width: number, height: number) => void;
  onMove?: (x: number, y: number) => void;
}

/**
 * Configurable dashboard widget component that can display various visualizations
 */
const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  config,
  isEditing,
  onConfigChange,
  onDelete,
  onResize,
  onMove
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState<WidgetConfig>({ ...config });
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean, startX: number, startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0
  });
  const resizeRef = useRef<{ isResizing: boolean, startWidth: number, startHeight: number }>({
    isResizing: false,
    startWidth: 0,
    startHeight: 0
  });
  
  // Setup refresh interval if configured
  useEffect(() => {
    if (!config.refreshInterval) return;
    
    const intervalId = setInterval(() => {
      refreshData();
    }, config.refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [config.refreshInterval]);
  
  // Refresh widget data
  const refreshData = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch data from the dataSource
      // For now we'll just simulate a data load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load widget data');
      setIsLoading(false);
    }
  };
  
  // Handle drag start
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      
      const deltaX = event.clientX - dragRef.current.startX;
      const deltaY = event.clientY - dragRef.current.startY;
      
      // Update position
      if (onMove) {
        onMove(config.x + deltaX, config.y + deltaY);
      }
      
      dragRef.current.startX = event.clientX;
      dragRef.current.startY = event.clientY;
    };
    
    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isEditing) return;
    
    resizeRef.current = {
      isResizing: true,
      startWidth: config.width,
      startHeight: config.height
    };
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current.isResizing) return;
      
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      
      const newWidth = Math.max(200, resizeRef.current.startWidth + deltaX);
      const newHeight = Math.max(150, resizeRef.current.startHeight + deltaY);
      
      // Update size
      if (onResize) {
        onResize(newWidth, newHeight);
      }
    };
    
    const handleMouseUp = () => {
      resizeRef.current.isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Save configuration changes
  const handleSaveConfig = () => {
    if (onConfigChange) {
      onConfigChange(localConfig);
    }
    setShowConfig(false);
  };
  
  // Handle input change in configuration panel
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setLocalConfig(prev => ({
      ...prev,
      [name]: name === 'refreshInterval' ? Number(value) : value
    }));
  };
  
  // Render the appropriate visualization based on widget type
  const renderWidgetContent = () => {
    if (isLoading) {
      return (
        <div className="widget-loading">
          <div className="spinner"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="widget-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={refreshData} className="retry-btn">Retry</button>
        </div>
      );
    }
    
    // Render different content based on widget type
    switch (config.type) {
      case 'chart':
        return (
          <div className="widget-chart">
            <div className="chart-placeholder">
              [Chart visualization would render here]
            </div>
          </div>
        );
      
      case 'metric':
        return (
          <div className="widget-metric">
            <div className="metric-value">85%</div>
            <div className="metric-label">Completion Rate</div>
          </div>
        );
      
      case 'table':
        return (
          <div className="widget-table">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Tasks</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Project Alpha</td>
                  <td>24</td>
                  <td>75%</td>
                </tr>
                <tr>
                  <td>Project Beta</td>
                  <td>18</td>
                  <td>92%</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      default:
        return (
          <div className="widget-placeholder">
            <p>No content available for this widget type</p>
          </div>
        );
    }
  };
  
  // Render configuration panel
  const renderConfigPanel = () => {
    if (!showConfig) return null;
    
    return (
      <div className="widget-config-panel">
        <h4>Widget Configuration</h4>
        
        <div className="config-form">
          <div className="form-group">
            <label htmlFor="widgetTitle">Title</label>
            <input
              type="text"
              id="widgetTitle"
              name="title"
              value={localConfig.title}
              onChange={handleConfigChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="widgetType">Type</label>
            <select
              id="widgetType"
              name="type"
              value={localConfig.type}
              onChange={handleConfigChange}
            >
              <option value="chart">Chart</option>
              <option value="metric">Metric</option>
              <option value="table">Table</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dataSource">Data Source</label>
            <select
              id="dataSource"
              name="dataSource"
              value={localConfig.dataSource}
              onChange={handleConfigChange}
            >
              <option value="tasks">Tasks</option>
              <option value="projects">Projects</option>
              <option value="users">Users</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="refreshInterval">Refresh Interval (seconds)</label>
            <input
              type="number"
              id="refreshInterval"
              name="refreshInterval"
              value={localConfig.refreshInterval || 0}
              min="0"
              step="30"
              onChange={handleConfigChange}
            />
            <span className="form-hint">0 = no auto refresh</span>
          </div>
          
          <div className="config-actions">
            <button 
              className="btn btn-cancel"
              onClick={() => setShowConfig(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-save"
              onClick={handleSaveConfig}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div
      ref={widgetRef}
      className={`dashboard-widget ${isEditing ? 'editing' : ''}`}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        transform: `translate(${config.x}px, ${config.y}px)`,
        zIndex: showControls || showConfig ? 10 : 1
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isEditing && (
        <div 
          className="widget-drag-handle" 
          onMouseDown={handleDragStart}
        />
      )}
      
      <div className="widget-header">
        <h3>{config.title}</h3>
        
        {showControls && (
          <div className="widget-controls">
            <button 
              className="widget-control-btn refresh-btn"
              onClick={refreshData}
              title="Refresh"
            >
              🔄
            </button>
            
            {isEditing && (
              <>
                <button 
                  className="widget-control-btn config-btn"
                  onClick={() => setShowConfig(!showConfig)}
                  title="Configure"
                >
                  ⚙️
                </button>
                <button 
                  className="widget-control-btn delete-btn"
                  onClick={onDelete}
                  title="Delete"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="widget-content">
        {renderWidgetContent()}
      </div>
      
      {renderConfigPanel()}
      
      {isEditing && (
        <div 
          className="widget-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
      
      <style jsx>{`
        .dashboard-widget {
          position: absolute;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }
        
        .dashboard-widget.editing {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        }
        
        .widget-drag-handle {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 10px;
          cursor: move;
          background: repeating-linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.05),
            rgba(0, 0, 0, 0.05) 4px,
            transparent 4px,
            transparent 8px
          );
          z-index: 1;
        }
        
        .widget-header {
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        
        .widget-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
        }
        
        .widget-controls {
          display: flex;
          gap: 5px;
        }
        
        .widget-control-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 2px;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        
        .widget-control-btn:hover {
          opacity: 1;
        }
        
        .widget-content {
          flex: 1;
          padding: 15px;
          overflow: auto;
        }
        
        .widget-resize-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 15px;
          height: 15px;
          cursor: nwse-resize;
          background: linear-gradient(
            135deg,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.2) 100%
          );
        }
        
        .widget-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #4a6cf7;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .widget-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #d32f2f;
          text-align: center;
        }
        
        .error-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .retry-btn {
          margin-top: 10px;
          padding: 5px 12px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .widget-chart, .widget-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #666;
        }
        
        .widget-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .metric-value {
          font-size: 36px;
          font-weight: bold;
          color: #4a6cf7;
        }
        
        .metric-label {
          margin-top: 5px;
          color: #666;
        }
        
        .widget-table {
          height: 100%;
          overflow: auto;
        }
        
        .widget-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .widget-table th, .widget-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .widget-table th {
          background-color: #f9f9f9;
          font-weight: 500;
        }
        
        .widget-config-panel {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.95);
          z-index: 10;
          padding: 15px;
          overflow: auto;
        }
        
        .widget-config-panel h4 {
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }
        
        .config-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 13px;
        }
        
        .form-group input, .form-group select {
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-hint {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }
        
        .config-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        
        .btn {
          padding: 8px 15px;
          border-radius: 4px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .btn-save {
          background-color: #4a6cf7;
          color: white;
        }
        
        .btn-save:hover {
          background-color: #3a5ce5;
        }
        
        .btn-cancel {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .btn-cancel:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default DashboardWidget;
