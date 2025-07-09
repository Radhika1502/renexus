import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
  Brush, Label
} from 'recharts';

interface DataPoint {
  date: string | Date;
  value: number;
  forecast?: boolean;
  upperBound?: number;
  lowerBound?: number;
  anomaly?: boolean;
  annotation?: string;
}

interface TimeSeriesForecastingProps {
  historicalData: DataPoint[];
  forecastData?: DataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  confidenceInterval?: boolean;
  showAnomalyDetection?: boolean;
  annotations?: boolean;
  forecastHorizon?: number;
  onDataPointClick?: (point: DataPoint) => void;
  height?: number;
  width?: number;
  colorScheme?: {
    historical: string;
    forecast: string;
    upperBound: string;
    lowerBound: string;
    anomaly: string;
  };
}

/**
 * Time Series Forecasting component with advanced visualization options
 * Supports historical data display, forecasting, confidence intervals, and anomaly detection
 */
const TimeSeriesForecasting: React.FC<TimeSeriesForecastingProps> = ({
  historicalData,
  forecastData = [],
  title = 'Time Series Forecast',
  xAxisLabel = 'Time',
  yAxisLabel = 'Value',
  confidenceInterval = true,
  showAnomalyDetection = false,
  annotations = true,
  forecastHorizon = 7,
  onDataPointClick,
  height = 400,
  width = 800,
  colorScheme = {
    historical: '#4a6cf7',
    forecast: '#82ca9d',
    upperBound: 'rgba(130, 202, 157, 0.2)',
    lowerBound: 'rgba(130, 202, 157, 0.2)',
    anomaly: '#ff6b6b'
  }
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '30d' | '90d' | '1y'>('all');
  const [brushActive, setBrushActive] = useState(false);
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [showForecast, setShowForecast] = useState(true);
  
  // Combine historical and forecast data
  const combinedData = useMemo(() => {
    if (!showForecast) return historicalData;
    return [...historicalData, ...forecastData];
  }, [historicalData, forecastData, showForecast]);
  
  // Filter data based on selected timeframe
  const filteredData = useMemo(() => {
    if (selectedTimeframe === 'all') {
      return combinedData;
    }
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedTimeframe) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return combinedData.filter(item => {
      const itemDate = typeof item.date === 'string' ? new Date(item.date) : item.date;
      return itemDate >= cutoffDate;
    });
  }, [combinedData, selectedTimeframe]);
  
  // Apply brush range if active
  const displayData = useMemo(() => {
    if (brushActive && brushRange) {
      return filteredData.slice(brushRange.startIndex, brushRange.endIndex + 1);
    }
    return filteredData;
  }, [filteredData, brushActive, brushRange]);
  
  // Find anomalies in the data
  const anomalies = useMemo(() => {
    if (!showAnomalyDetection) return [];
    
    return historicalData.filter(point => point.anomaly);
  }, [historicalData, showAnomalyDetection]);
  
  // Handle brush change
  const handleBrushChange = (data: any) => {
    if (data.startIndex === data.endIndex) {
      setBrushActive(false);
      setBrushRange(null);
      return;
    }
    
    setBrushActive(true);
    setBrushRange({
      startIndex: data.startIndex,
      endIndex: data.endIndex
    });
  };
  
  // Handle data point click
  const handlePointClick = (data: any, index: number) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
    setSelectedPoint(data);
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="forecast-tooltip">
          <p className="date">{formatDate(data.date)}</p>
          <p className="value">
            <span>Value: </span>
            <span className="value-number">{data.value.toFixed(2)}</span>
          </p>
          
          {data.forecast && (
            <p className="forecast-label">Forecast</p>
          )}
          
          {confidenceInterval && data.forecast && (
            <div className="confidence-interval">
              <p>Confidence Interval:</p>
              <p>Upper: {data.upperBound?.toFixed(2)}</p>
              <p>Lower: {data.lowerBound?.toFixed(2)}</p>
            </div>
          )}
          
          {data.anomaly && (
            <p className="anomaly-label">Anomaly Detected</p>
          )}
          
          {data.annotation && (
            <p className="annotation">{data.annotation}</p>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Determine domain for Y axis
  const yDomain = useMemo(() => {
    let min = Math.min(
      ...displayData.map(d => d.lowerBound !== undefined ? d.lowerBound : d.value)
    );
    let max = Math.max(
      ...displayData.map(d => d.upperBound !== undefined ? d.upperBound : d.value)
    );
    
    // Add some padding
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [displayData]);
  
  // Find the index where forecast starts
  const forecastStartIndex = useMemo(() => {
    if (!showForecast || forecastData.length === 0) return -1;
    return historicalData.length;
  }, [historicalData.length, forecastData.length, showForecast]);
  
  return (
    <div className="time-series-forecasting">
      <div className="forecast-header">
        <h3>{title}</h3>
        
        <div className="forecast-controls">
          <div className="timeframe-selector">
            <button 
              className={selectedTimeframe === 'all' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('all')}
            >
              All
            </button>
            <button 
              className={selectedTimeframe === '30d' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('30d')}
            >
              30d
            </button>
            <button 
              className={selectedTimeframe === '90d' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('90d')}
            >
              90d
            </button>
            <button 
              className={selectedTimeframe === '1y' ? 'active' : ''}
              onClick={() => setSelectedTimeframe('1y')}
            >
              1y
            </button>
          </div>
          
          <div className="forecast-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={showForecast} 
                onChange={() => setShowForecast(!showForecast)}
              />
              Show Forecast
            </label>
          </div>
        </div>
      </div>
      
      <div className="chart-container" style={{ height, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            onClick={handlePointClick}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              padding={{ left: 10, right: 10 }}
            >
              <Label value={xAxisLabel} position="bottom" offset={20} />
            </XAxis>
            <YAxis domain={yDomain}>
              <Label value={yAxisLabel} angle={-90} position="left" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Historical data line */}
            <Area
              type="monotone"
              dataKey="value"
              name="Historical Data"
              stroke={colorScheme.historical}
              fill={`${colorScheme.historical}20`}
              activeDot={{ r: 8, onClick: handlePointClick }}
              isAnimationActive={true}
            />
            
            {/* Forecast data line */}
            {showForecast && forecastData.length > 0 && (
              <Area
                type="monotone"
                dataKey="value"
                name="Forecast"
                stroke={colorScheme.forecast}
                fill={`${colorScheme.forecast}20`}
                strokeDasharray="5 5"
                activeDot={{ r: 8, onClick: handlePointClick }}
                isAnimationActive={true}
              />
            )}
            
            {/* Confidence interval area */}
            {showForecast && confidenceInterval && forecastData.length > 0 && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill={colorScheme.upperBound}
                name="Confidence Interval"
              />
            )}
            
            {showForecast && confidenceInterval && forecastData.length > 0 && (
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill={colorScheme.lowerBound}
                name="Confidence Interval"
              />
            )}
            
            {/* Reference line for forecast start */}
            {showForecast && forecastStartIndex >= 0 && forecastStartIndex < displayData.length && (
              <ReferenceLine
                x={displayData[forecastStartIndex].date}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: "Forecast Start", position: "top" }}
              />
            )}
            
            {/* Anomaly markers */}
            {showAnomalyDetection && anomalies.map((anomaly, index) => (
              <ReferenceDot
                key={`anomaly-${index}`}
                x={anomaly.date}
                y={anomaly.value}
                r={6}
                fill={colorScheme.anomaly}
                stroke="none"
              />
            ))}
            
            {/* Brush for custom time range selection */}
            <Brush
              dataKey="date"
              height={30}
              stroke="#8884d8"
              onChange={handleBrushChange}
              tickFormatter={formatDate}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {selectedPoint && (
        <div className="selected-point-details">
          <h4>Selected Point Details</h4>
          <p><strong>Date:</strong> {formatDate(selectedPoint.date)}</p>
          <p><strong>Value:</strong> {selectedPoint.value.toFixed(2)}</p>
          
          {selectedPoint.forecast && (
            <p><strong>Type:</strong> Forecast</p>
          )}
          
          {selectedPoint.anomaly && (
            <p className="anomaly-detail"><strong>Anomaly Detected</strong></p>
          )}
          
          {selectedPoint.annotation && (
            <div className="annotation-detail">
              <strong>Annotation:</strong>
              <p>{selectedPoint.annotation}</p>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .time-series-forecasting {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .forecast-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .forecast-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .forecast-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .timeframe-selector {
          display: flex;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .timeframe-selector button {
          background: none;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          border-right: 1px solid #ddd;
        }
        
        .timeframe-selector button:last-child {
          border-right: none;
        }
        
        .timeframe-selector button.active {
          background-color: #4a6cf7;
          color: white;
        }
        
        .forecast-toggle {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        
        .forecast-toggle input {
          margin-right: 5px;
        }
        
        .chart-container {
          margin-bottom: 20px;
        }
        
        .selected-point-details {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 15px;
          margin-top: 20px;
        }
        
        .selected-point-details h4 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .anomaly-detail {
          color: ${colorScheme.anomaly};
        }
        
        .annotation-detail {
          margin-top: 10px;
          padding: 10px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
        
        :global(.forecast-tooltip) {
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        :global(.forecast-tooltip .date) {
          font-weight: bold;
          margin-top: 0;
          margin-bottom: 5px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        :global(.forecast-tooltip .value-number) {
          font-weight: bold;
        }
        
        :global(.forecast-tooltip .forecast-label) {
          color: ${colorScheme.forecast};
          font-weight: bold;
        }
        
        :global(.forecast-tooltip .anomaly-label) {
          color: ${colorScheme.anomaly};
          font-weight: bold;
        }
        
        :global(.forecast-tooltip .confidence-interval) {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }
        
        :global(.forecast-tooltip .confidence-interval p) {
          margin: 2px 0;
        }
      `}</style>
    </div>
  );
};

// Missing component definition for ReferenceDot
const ReferenceDot = ({ x, y, r, fill, stroke }: any) => {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} />
    </g>
  );
};

export default TimeSeriesForecasting;
