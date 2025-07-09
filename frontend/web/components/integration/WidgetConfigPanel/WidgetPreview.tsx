import React from 'react';
import { WidgetConfig, WidgetPreviewProps } from './types';

/**
 * Widget Preview Component
 * Renders a preview of the widget based on current configuration
 */
const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  config,
  className
}) => {
  // Render preview based on widget and visualization type
  const renderPreview = () => {
    switch (config.visualization.type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'area':
        return renderAreaChart();
      case 'table':
        return renderTable();
      case 'number':
        return renderMetric();
      default:
        return renderPlaceholder();
    }
  };
  
  // Render a bar chart preview
  const renderBarChart = () => {
    return (
      <div className="chart-preview bar-chart">
        <div className="chart-container">
          <div className="chart-y-axis">
            <div className="axis-label">100</div>
            <div className="axis-label">75</div>
            <div className="axis-label">50</div>
            <div className="axis-label">25</div>
            <div className="axis-label">0</div>
          </div>
          <div className="chart-content">
            <div className="bar-container">
              <div className="bar" style={{ height: '65%', backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="bar-label">A</div>
            </div>
            <div className="bar-container">
              <div className="bar" style={{ height: '80%', backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="bar-label">B</div>
            </div>
            <div className="bar-container">
              <div className="bar" style={{ height: '45%', backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="bar-label">C</div>
            </div>
            <div className="bar-container">
              <div className="bar" style={{ height: '90%', backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="bar-label">D</div>
            </div>
            <div className="bar-container">
              <div className="bar" style={{ height: '55%', backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="bar-label">E</div>
            </div>
          </div>
        </div>
        {config.visualization.options?.showLegend !== false && (
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="legend-label">Series 1</div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render a line chart preview
  const renderLineChart = () => {
    return (
      <div className="chart-preview line-chart">
        <div className="chart-container">
          <div className="chart-y-axis">
            <div className="axis-label">100</div>
            <div className="axis-label">75</div>
            <div className="axis-label">50</div>
            <div className="axis-label">25</div>
            <div className="axis-label">0</div>
          </div>
          <div className="chart-content">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points="0,35 20,20 40,55 60,10 80,45 100,30"
                fill="none"
                stroke={config.visualization.colors?.[0] || '#4a6cf7'}
                strokeWidth="2"
              />
              {config.visualization.options?.showDataLabels && (
                <>
                  <circle cx="0" cy="35" r="2" fill={config.visualization.colors?.[0] || '#4a6cf7'} />
                  <circle cx="20" cy="20" r="2" fill={config.visualization.colors?.[0] || '#4a6cf7'} />
                  <circle cx="40" cy="55" r="2" fill={config.visualization.colors?.[0] || '#4a6cf7'} />
                  <circle cx="60" cy="10" r="2" fill={config.visualization.colors?.[0] || '#4a6cf7'} />
                  <circle cx="80" cy="45" r="2" fill={config.visualization.colors?.[0] || '#4a6cf7'} />
                  <circle cx="100" cy="30" r="2" fill={config.visualization.colors?.[0] || '#4a6cf7'} />
                </>
              )}
            </svg>
            <div className="x-axis-labels">
              <div className="x-label">Jan</div>
              <div className="x-label">Feb</div>
              <div className="x-label">Mar</div>
              <div className="x-label">Apr</div>
              <div className="x-label">May</div>
              <div className="x-label">Jun</div>
            </div>
          </div>
        </div>
        {config.visualization.options?.showLegend !== false && (
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="legend-label">Series 1</div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render a pie chart preview
  const renderPieChart = () => {
    const colors = config.visualization.colors || ['#4a6cf7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
    
    return (
      <div className="chart-preview pie-chart">
        <div className="chart-container">
          <div className="pie-container">
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[0]}
                strokeWidth="20"
                strokeDasharray="75 100"
                strokeDashoffset="25"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[1]}
                strokeWidth="20"
                strokeDasharray="55 100"
                strokeDashoffset="-50"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[2]}
                strokeWidth="20"
                strokeDasharray="35 100"
                strokeDashoffset="-105"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[3]}
                strokeWidth="20"
                strokeDasharray="15 100"
                strokeDashoffset="-140"
              />
              
              {config.visualization.subtype === 'donut' && (
                <circle
                  cx="50"
                  cy="50"
                  r={40 - 20 * (config.visualization.options?.innerRadius || 0) / 100}
                  fill="white"
                />
              )}
            </svg>
          </div>
        </div>
        {config.visualization.options?.showLegend !== false && (
          <div className="chart-legend">
            {colors.slice(0, 4).map((color, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: color }}></div>
                <div className="legend-label">{`Category ${index + 1}`}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Render an area chart preview
  const renderAreaChart = () => {
    return (
      <div className="chart-preview area-chart">
        <div className="chart-container">
          <div className="chart-y-axis">
            <div className="axis-label">100</div>
            <div className="axis-label">75</div>
            <div className="axis-label">50</div>
            <div className="axis-label">25</div>
            <div className="axis-label">0</div>
          </div>
          <div className="chart-content">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={config.visualization.colors?.[0] || '#4a6cf7'} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={config.visualization.colors?.[0] || '#4a6cf7'} stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M0,35 L20,20 L40,55 L60,10 L80,45 L100,30 V100 H0 Z"
                fill="url(#areaGradient)"
              />
              <polyline
                points="0,35 20,20 40,55 60,10 80,45 100,30"
                fill="none"
                stroke={config.visualization.colors?.[0] || '#4a6cf7'}
                strokeWidth="2"
              />
            </svg>
            <div className="x-axis-labels">
              <div className="x-label">Jan</div>
              <div className="x-label">Feb</div>
              <div className="x-label">Mar</div>
              <div className="x-label">Apr</div>
              <div className="x-label">May</div>
              <div className="x-label">Jun</div>
            </div>
          </div>
        </div>
        {config.visualization.options?.showLegend !== false && (
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: config.visualization.colors?.[0] || '#4a6cf7' }}></div>
              <div className="legend-label">Series 1</div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render a table preview
  const renderTable = () => {
    return (
      <div className="chart-preview table-preview">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Item 1</td>
              <td>84</td>
              <td><span className="status-badge success">Active</span></td>
            </tr>
            <tr>
              <td>2</td>
              <td>Item 2</td>
              <td>56</td>
              <td><span className="status-badge warning">Pending</span></td>
            </tr>
            <tr>
              <td>3</td>
              <td>Item 3</td>
              <td>92</td>
              <td><span className="status-badge success">Active</span></td>
            </tr>
            <tr>
              <td>4</td>
              <td>Item 4</td>
              <td>35</td>
              <td><span className="status-badge info">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render a metric preview
  const renderMetric = () => {
    return (
      <div className="chart-preview metric-preview">
        <div className="metric-container">
          <div className="metric-value">84.7%</div>
          <div className="metric-label">Completion Rate</div>
          <div className="metric-comparison">
            <span className="trend-indicator positive">▲</span>
            <span className="trend-value">12.3%</span>
            <span className="trend-period">vs last period</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render a placeholder for unsupported visualization types
  const renderPlaceholder = () => {
    return (
      <div className="chart-preview placeholder">
        <div className="placeholder-icon">📊</div>
        <div className="placeholder-text">
          Preview not available for this visualization type
        </div>
      </div>
    );
  };
  
  return (
    <div className={`widget-preview ${className || ''}`}>
      <div className={`widget-preview-container size-${config.size}`}>
        {config.settings?.showTitle !== false && (
          <div className="widget-preview-header">
            <h3 className="widget-preview-title">{config.title}</h3>
          </div>
        )}
        <div className="widget-preview-content">
          {renderPreview()}
        </div>
      </div>
      
      <style jsx>{`
        .widget-preview {
          margin-top: 24px;
        }
        
        .widget-preview-container {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          background-color: white;
        }
        
        .size-small {
          width: 240px;
          height: 240px;
        }
        
        .size-medium {
          width: 480px;
          height: 240px;
        }
        
        .size-large {
          width: 480px;
          height: 480px;
        }
        
        .size-wide {
          width: 720px;
          height: 240px;
        }
        
        .size-tall {
          width: 240px;
          height: 480px;
        }
        
        .size-full {
          width: 720px;
          height: 480px;
        }
        
        .widget-preview-header {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .widget-preview-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .widget-preview-content {
          padding: 16px;
          height: calc(100% - 45px);
          display: flex;
          flex-direction: column;
        }
        
        .chart-preview {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .chart-container {
          flex: 1;
          display: flex;
          position: relative;
        }
        
        .chart-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-right: 8px;
          font-size: 10px;
          color: #999;
          width: 30px;
        }
        
        .chart-content {
          flex: 1;
          position: relative;
          display: flex;
          align-items: flex-end;
          height: 100%;
          border-left: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }
        
        .bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          padding: 0 4px;
        }
        
        .bar {
          width: 60%;
          margin-bottom: 4px;
        }
        
        .bar-label {
          font-size: 10px;
          color: #999;
        }
        
        .x-axis-labels {
          display: flex;
          justify-content: space-between;
          width: 100%;
          padding-top: 4px;
        }
        
        .x-label {
          font-size: 10px;
          color: #999;
          text-align: center;
          flex: 1;
        }
        
        .chart-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          margin-top: 16px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          margin-right: 4px;
        }
        
        .legend-label {
          font-size: 12px;
          color: #666;
        }
        
        .pie-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .pie-container svg {
          max-width: 200px;
          max-height: 200px;
        }
        
        .table-preview {
          overflow: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        
        th {
          font-weight: 500;
          color: #333;
          background-color: #f9f9f9;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }
        
        .status-badge.success {
          background-color: #e6f7ed;
          color: #10b981;
        }
        
        .status-badge.warning {
          background-color: #fef5e7;
          color: #f59e0b;
        }
        
        .status-badge.info {
          background-color: #e7f3fe;
          color: #3b82f6;
        }
        
        .metric-preview {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .metric-container {
          text-align: center;
        }
        
        .metric-value {
          font-size: 36px;
          font-weight: 600;
          color: #333;
        }
        
        .metric-label {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }
        
        .metric-comparison {
          margin-top: 12px;
          font-size: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }
        
        .trend-indicator {
          font-size: 12px;
        }
        
        .trend-indicator.positive {
          color: #10b981;
        }
        
        .trend-value {
          font-weight: 500;
          color: #10b981;
        }
        
        .trend-period {
          color: #999;
        }
        
        .placeholder {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: #999;
        }
        
        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        
        .placeholder-text {
          font-size: 14px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default WidgetPreview;
