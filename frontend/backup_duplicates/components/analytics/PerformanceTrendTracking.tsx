import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart,
  Scatter, Cell, ReferenceLine
} from 'recharts';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target?: number;
  previousValue?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

interface PerformanceTrendData {
  date: string;
  [key: string]: any; // For dynamic metrics
}

interface PerformanceTrendTrackingProps {
  metrics: PerformanceMetric[];
  trendData: PerformanceTrendData[];
  title?: string;
  showTargets?: boolean;
  showComparison?: boolean;
  comparisonPeriod?: string;
  onMetricClick?: (metric: PerformanceMetric) => void;
  height?: number;
  width?: number;
  colorScheme?: {
    positive: string;
    negative: string;
    neutral: string;
    target: string;
    comparison: string;
  };
}

/**
 * Performance Trend Tracking component for visualizing team and individual performance metrics
 * Supports multiple visualization modes, targets, and period-over-period comparisons
 */
const PerformanceTrendTracking: React.FC<PerformanceTrendTrackingProps> = ({
  metrics,
  trendData,
  title = 'Performance Trends',
  showTargets = true,
  showComparison = true,
  comparisonPeriod = 'Previous Period',
  onMetricClick,
  height = 500,
  width = 800,
  colorScheme = {
    positive: '#4caf50',
    negative: '#f44336',
    neutral: '#2196f3',
    target: '#ff9800',
    comparison: '#9c27b0'
  }
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'trend' | 'comparison' | 'target'>('trend');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'composed'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  
  // Initialize with first metric selected
  useEffect(() => {
    if (metrics.length > 0 && selectedMetrics.length === 0) {
      setSelectedMetrics([metrics[0].id]);
    }
  }, [metrics]);
  
  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (timeRange === 'all') {
      return trendData;
    }
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
    }
    
    return trendData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }, [trendData, timeRange]);
  
  // Get selected metrics data
  const selectedMetricsData = useMemo(() => {
    return metrics.filter(metric => selectedMetrics.includes(metric.id));
  }, [metrics, selectedMetrics]);
  
  // Toggle metric selection
  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      // Don't allow deselecting the last metric
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(id => id !== metricId));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };
  
  // Format percentage change
  const formatChange = (value?: number) => {
    if (value === undefined) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };
  
  // Get color for trend
  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return colorScheme.neutral;
    switch (trend) {
      case 'up':
        return colorScheme.positive;
      case 'down':
        return colorScheme.negative;
      case 'stable':
        return colorScheme.neutral;
    }
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="performance-tooltip">
          <p className="date">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => {
            const metric = metrics.find(m => m.id === entry.dataKey);
            return (
              <div key={`tooltip-${index}`} className="metric-value">
                <span className="metric-name" style={{ color: entry.color }}>
                  {metric?.name || entry.dataKey}:
                </span>
                <span className="value">{entry.value.toFixed(2)}</span>
                
                {showTargets && metric?.target !== undefined && (
                  <span className="target">
                    Target: {metric.target.toFixed(2)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };
  
  // Render metrics summary cards
  const renderMetricCards = () => {
    return (
      <div className="metrics-summary">
        {metrics.map(metric => (
          <div 
            key={metric.id} 
            className={`metric-card ${selectedMetrics.includes(metric.id) ? 'selected' : ''}`}
            onClick={() => toggleMetric(metric.id)}
          >
            <div className="metric-header">
              <h4>{metric.name}</h4>
              {metric.trend && (
                <span className={`trend-indicator ${metric.trend}`}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
            
            <div className="metric-value-container">
              <div className="current-value">
                <span className="value">{metric.value.toFixed(2)}</span>
                {showTargets && metric.target !== undefined && (
                  <span className="target">
                    Target: {metric.target.toFixed(2)}
                  </span>
                )}
              </div>
              
              {showComparison && metric.changePercentage !== undefined && (
                <div 
                  className={`change-percentage ${
                    metric.changePercentage > 0 ? 'positive' : 
                    metric.changePercentage < 0 ? 'negative' : 'neutral'
                  }`}
                >
                  {formatChange(metric.changePercentage)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render trend chart based on selected view mode and chart type
  const renderChart = () => {
    if (selectedMetrics.length === 0) {
      return <div className="no-data">No metrics selected</div>;
    }
    
    // Determine which chart component to use
    const ChartComponent = 
      chartType === 'line' ? LineChart : 
      chartType === 'bar' ? BarChart : 
      ComposedChart;
    
    return (
      <div className="chart-container" style={{ height, width: '100%' }}>
        <ResponsiveContainer>
          <ChartComponent
            data={filteredData}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedMetrics.map((metricId, index) => {
              const metric = metrics.find(m => m.id === metricId);
              const color = metric?.color || `hsl(${(index * 137) % 360}, 70%, 50%)`;
              
              if (chartType === 'line' || chartType === 'composed') {
                return (
                  <Line
                    key={metricId}
                    type="monotone"
                    dataKey={metricId}
                    name={metric?.name || metricId}
                    stroke={color}
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                  />
                );
              } else {
                return (
                  <Bar
                    key={metricId}
                    dataKey={metricId}
                    name={metric?.name || metricId}
                    fill={color}
                    isAnimationActive={true}
                  />
                );
              }
            })}
            
            {/* Show targets as reference lines if in target view mode */}
            {viewMode === 'target' && showTargets && selectedMetrics.map(metricId => {
              const metric = metrics.find(m => m.id === metricId);
              if (metric?.target !== undefined) {
                return (
                  <ReferenceLine
                    key={`target-${metricId}`}
                    y={metric.target}
                    stroke={colorScheme.target}
                    strokeDasharray="3 3"
                    label={{ 
                      value: `${metric.name} Target`, 
                      position: 'insideBottomRight',
                      fill: colorScheme.target
                    }}
                  />
                );
              }
              return null;
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render comparison chart (current vs previous)
  const renderComparisonChart = () => {
    if (selectedMetrics.length === 0) {
      return <div className="no-data">No metrics selected</div>;
    }
    
    // Create comparison data for selected metrics
    const comparisonData = selectedMetricsData.map(metric => ({
      name: metric.name,
      current: metric.value,
      previous: metric.previousValue || 0,
      change: metric.changePercentage || 0
    }));
    
    return (
      <div className="chart-container" style={{ height, width: '100%' }}>
        <ResponsiveContainer>
          <BarChart
            data={comparisonData}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" name="Current Period" fill={colorScheme.neutral} />
            <Bar dataKey="previous" name={comparisonPeriod} fill={colorScheme.comparison} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  return (
    <div className="performance-trend-tracking">
      <div className="header">
        <h3>{title}</h3>
        
        <div className="controls">
          <div className="view-mode-selector">
            <button 
              className={viewMode === 'trend' ? 'active' : ''}
              onClick={() => setViewMode('trend')}
            >
              Trend
            </button>
            {showComparison && (
              <button 
                className={viewMode === 'comparison' ? 'active' : ''}
                onClick={() => setViewMode('comparison')}
              >
                Comparison
              </button>
            )}
            {showTargets && (
              <button 
                className={viewMode === 'target' ? 'active' : ''}
                onClick={() => setViewMode('target')}
              >
                Targets
              </button>
            )}
          </div>
          
          {viewMode !== 'comparison' && (
            <div className="chart-type-selector">
              <button 
                className={chartType === 'line' ? 'active' : ''}
                onClick={() => setChartType('line')}
              >
                Line
              </button>
              <button 
                className={chartType === 'bar' ? 'active' : ''}
                onClick={() => setChartType('bar')}
              >
                Bar
              </button>
              <button 
                className={chartType === 'composed' ? 'active' : ''}
                onClick={() => setChartType('composed')}
              >
                Combined
              </button>
            </div>
          )}
          
          <div className="time-range-selector">
            <button 
              className={timeRange === '7d' ? 'active' : ''}
              onClick={() => setTimeRange('7d')}
            >
              7d
            </button>
            <button 
              className={timeRange === '30d' ? 'active' : ''}
              onClick={() => setTimeRange('30d')}
            >
              30d
            </button>
            <button 
              className={timeRange === '90d' ? 'active' : ''}
              onClick={() => setTimeRange('90d')}
            >
              90d
            </button>
            <button 
              className={timeRange === 'all' ? 'active' : ''}
              onClick={() => setTimeRange('all')}
            >
              All
            </button>
          </div>
        </div>
      </div>
      
      {renderMetricCards()}
      
      {viewMode === 'comparison' ? renderComparisonChart() : renderChart()}
      
      <style jsx>{`
        .performance-trend-tracking {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .controls {
          display: flex;
          gap: 15px;
        }
        
        .view-mode-selector,
        .chart-type-selector,
        .time-range-selector {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .view-mode-selector button,
        .chart-type-selector button,
        .time-range-selector button {
          background: none;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          border-right: 1px solid #ddd;
        }
        
        .view-mode-selector button:last-child,
        .chart-type-selector button:last-child,
        .time-range-selector button:last-child {
          border-right: none;
        }
        
        .view-mode-selector button.active,
        .chart-type-selector button.active,
        .time-range-selector button.active {
          background-color: #4a6cf7;
          color: white;
        }
        
        .metrics-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-card {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 15px;
          min-width: 180px;
          flex: 1;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .metric-card.selected {
          border-color: #4a6cf7;
          background-color: #f0f7ff;
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .metric-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .trend-indicator {
          font-size: 18px;
          font-weight: bold;
        }
        
        .trend-indicator.up {
          color: ${colorScheme.positive};
        }
        
        .trend-indicator.down {
          color: ${colorScheme.negative};
        }
        
        .trend-indicator.stable {
          color: ${colorScheme.neutral};
        }
        
        .metric-value-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .current-value {
          display: flex;
          flex-direction: column;
        }
        
        .current-value .value {
          font-size: 24px;
          font-weight: 600;
        }
        
        .current-value .target {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        
        .change-percentage {
          font-size: 14px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .change-percentage.positive {
          color: ${colorScheme.positive};
          background-color: ${colorScheme.positive}20;
        }
        
        .change-percentage.negative {
          color: ${colorScheme.negative};
          background-color: ${colorScheme.negative}20;
        }
        
        .change-percentage.neutral {
          color: ${colorScheme.neutral};
          background-color: ${colorScheme.neutral}20;
        }
        
        .chart-container {
          margin-top: 20px;
        }
        
        .no-data {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          background-color: #f8f9fa;
          border-radius: 6px;
          color: #666;
          font-size: 16px;
        }
        
        :global(.performance-tooltip) {
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        :global(.performance-tooltip .date) {
          font-weight: bold;
          margin-top: 0;
          margin-bottom: 5px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        :global(.performance-tooltip .metric-value) {
          margin: 5px 0;
        }
        
        :global(.performance-tooltip .metric-name) {
          font-weight: 500;
          margin-right: 5px;
        }
        
        :global(.performance-tooltip .value) {
          font-weight: 600;
        }
        
        :global(.performance-tooltip .target) {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};

export default PerformanceTrendTracking;
