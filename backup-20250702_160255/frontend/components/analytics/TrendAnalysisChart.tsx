import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';

interface TrendDataPoint {
  date: string;
  value: number;
  forecastValue?: number;
  upperBound?: number;
  lowerBound?: number;
  [key: string]: any; // For additional metrics
}

interface TrendAnalysisChartProps {
  data: TrendDataPoint[];
  title: string;
  xAxisKey?: string;
  yAxisKey?: string;
  showForecast?: boolean;
  showBounds?: boolean;
  comparativePeriod?: TrendDataPoint[];
  chartType?: 'line' | 'area';
  height?: number;
  onPeriodChange?: (start: Date, end: Date) => void;
  annotations?: Array<{date: string, label: string, type: 'event' | 'milestone' | 'anomaly'}>;
}

/**
 * Component for visualizing trend analysis over time with optional forecasting
 */
const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({
  data,
  title,
  xAxisKey = 'date',
  yAxisKey = 'value',
  showForecast = false,
  showBounds = false,
  comparativePeriod,
  chartType = 'line',
  height = 400,
  onPeriodChange,
  annotations = []
}) => {
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [brushActive, setBrushActive] = useState(false);
  
  // Colors for chart elements
  const mainColor = '#8884d8';
  const forecastColor = '#82ca9d';
  const boundsColor = 'rgba(128, 128, 128, 0.3)';
  const comparativeColor = '#ffc658';
  
  useEffect(() => {
    // Process data and add forecast indicators where available
    setChartData(data);
  }, [data]);
  
  // Handle timeframe selection
  const handleTimeframeChange = (newTimeframe: '7d' | '30d' | '90d' | '1y') => {
    setTimeframe(newTimeframe);
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (newTimeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    if (onPeriodChange) {
      onPeriodChange(startDate, endDate);
    }
  };
  
  // Custom tooltip to show multiple values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}>
          <p><strong>Date:</strong> {label}</p>
          <p style={{ color: mainColor }}>
            <strong>Actual:</strong> {dataPoint[yAxisKey]}
          </p>
          
          {showForecast && dataPoint.forecastValue !== undefined && (
            <p style={{ color: forecastColor }}>
              <strong>Forecast:</strong> {dataPoint.forecastValue}
            </p>
          )}
          
          {showBounds && (
            <>
              {dataPoint.upperBound !== undefined && (
                <p style={{ color: 'grey' }}>
                  <strong>Upper Bound:</strong> {dataPoint.upperBound}
                </p>
              )}
              
              {dataPoint.lowerBound !== undefined && (
                <p style={{ color: 'grey' }}>
                  <strong>Lower Bound:</strong> {dataPoint.lowerBound}
                </p>
              )}
            </>
          )}
          
          {/* Show any annotation for this date */}
          {annotations.filter(a => a.date === label).map((annotation, idx) => (
            <p key={idx} style={{ color: annotation.type === 'anomaly' ? 'red' : 'blue' }}>
              <strong>{annotation.type}:</strong> {annotation.label}
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  // Handle brush change for custom time selection
  const handleBrushChange = (brushData: any) => {
    if (!brushData || !brushData.startIndex || !brushData.endIndex) return;
    
    if (onPeriodChange && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const startDate = new Date(chartData[brushData.startIndex][xAxisKey]);
      const endDate = new Date(chartData[brushData.endIndex][xAxisKey]);
      onPeriodChange(startDate, endDate);
    }
  };
  
  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Main trend line */}
          <Line 
            type="monotone" 
            dataKey={yAxisKey} 
            stroke={mainColor} 
            name="Actual"
            activeDot={{ r: 8 }} 
          />
          
          {/* Forecast line if available */}
          {showForecast && (
            <Line
              type="monotone"
              dataKey="forecastValue"
              stroke={forecastColor}
              strokeDasharray="5 5"
              name="Forecast"
              connectNulls
            />
          )}
          
          {/* Comparative period if available */}
          {comparativePeriod && (
            <Line
              type="monotone"
              data={comparativePeriod}
              dataKey={yAxisKey}
              stroke={comparativeColor}
              name="Previous Period"
              connectNulls
            />
          )}
          
          {/* Brush for time selection */}
          {brushActive && (
            <Brush 
              dataKey={xAxisKey} 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
            />
          )}
        </LineChart>
      );
    } else {
      return (
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Main trend area */}
          <Area 
            type="monotone" 
            dataKey={yAxisKey} 
            stroke={mainColor}
            fill={mainColor + '80'}  // 50% opacity
            name="Actual"
            activeDot={{ r: 8 }} 
          />
          
          {/* Forecast area if available */}
          {showForecast && (
            <Area
              type="monotone"
              dataKey="forecastValue"
              stroke={forecastColor}
              fill={forecastColor + '40'}  // 25% opacity
              strokeDasharray="5 5"
              name="Forecast"
              connectNulls
            />
          )}
          
          {/* Upper and lower bounds if enabled */}
          {showBounds && (
            <>
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill={boundsColor}
                name="Upper Bound"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="transparent"
                fill={boundsColor}
                name="Lower Bound"
                connectNulls
              />
            </>
          )}
          
          {/* Brush for time selection */}
          {brushActive && (
            <Brush 
              dataKey={xAxisKey} 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
            />
          )}
        </AreaChart>
      );
    }
  };
  
  return (
    <div className="trend-analysis-chart" style={{ width: '100%', height: `${height}px` }}>
      <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3>{title}</h3>
        
        <div className="chart-controls">
          {/* Timeframe selector */}
          <div className="timeframe-buttons" style={{ display: 'inline-flex' }}>
            <button 
              onClick={() => handleTimeframeChange('7d')} 
              className={timeframe === '7d' ? 'active' : ''}
              style={{
                padding: '5px 10px',
                margin: '0 5px',
                background: timeframe === '7d' ? '#8884d8' : '#f0f0f0',
                color: timeframe === '7d' ? 'white' : 'black',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              7 Days
            </button>
            <button 
              onClick={() => handleTimeframeChange('30d')} 
              className={timeframe === '30d' ? 'active' : ''}
              style={{
                padding: '5px 10px',
                margin: '0 5px',
                background: timeframe === '30d' ? '#8884d8' : '#f0f0f0',
                color: timeframe === '30d' ? 'white' : 'black',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              30 Days
            </button>
            <button 
              onClick={() => handleTimeframeChange('90d')} 
              className={timeframe === '90d' ? 'active' : ''}
              style={{
                padding: '5px 10px',
                margin: '0 5px',
                background: timeframe === '90d' ? '#8884d8' : '#f0f0f0',
                color: timeframe === '90d' ? 'white' : 'black',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              90 Days
            </button>
            <button 
              onClick={() => handleTimeframeChange('1y')} 
              className={timeframe === '1y' ? 'active' : ''}
              style={{
                padding: '5px 10px',
                margin: '0 5px',
                background: timeframe === '1y' ? '#8884d8' : '#f0f0f0',
                color: timeframe === '1y' ? 'white' : 'black',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              1 Year
            </button>
          </div>
          
          {/* Custom range selector toggle */}
          <button
            onClick={() => setBrushActive(!brushActive)}
            style={{
              padding: '5px 10px',
              marginLeft: '10px',
              background: brushActive ? '#8884d8' : '#f0f0f0',
              color: brushActive ? 'white' : 'black',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            {brushActive ? 'Hide' : 'Show'} Custom Range
          </button>
        </div>
      </div>
      
      {chartData.length === 0 ? (
        <div className="no-data" style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TrendAnalysisChart;
