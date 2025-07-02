import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { VisualizationConfig } from '../../../../types/widget';

interface LineChartComponentProps {
  data: any[];
  config: VisualizationConfig;
}

/**
 * Line Chart Visualization Component
 * 
 * Renders a line chart using the provided data and configuration
 */
const LineChartComponent: React.FC<LineChartComponentProps> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Typography variant="body1" color="textSecondary">
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  // Extract configuration
  const xAxisField = config.xAxis?.field || '';
  const yAxisField = config.yAxis?.field || '';
  const xAxisLabel = config.xAxis?.label || '';
  const yAxisLabel = config.yAxis?.label || '';
  const showGrid = config.xAxis?.showGrid !== false;
  const showDataLabels = config.showDataLabels || false;
  const colors = config.colors || ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8F44AD'];

  // Handle series data
  const series = config.series || [];
  
  // If no series are defined but we have x and y axis, create a default series
  if (series.length === 0 && xAxisField && yAxisField) {
    series.push({
      name: yAxisLabel || yAxisField,
      field: yAxisField,
      color: colors[0]
    });
  }

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <Typography variant="h6" align="center" gutterBottom>
        {config.title}
      </Typography>
      
      {config.subtitle && (
        <Typography variant="subtitle2" align="center" color="textSecondary" gutterBottom>
          {config.subtitle}
        </Typography>
      )}
      
      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          
          <XAxis 
            dataKey={xAxisField} 
            label={{ 
              value: xAxisLabel, 
              position: 'insideBottomRight', 
              offset: -10 
            }}
          />
          
          <YAxis
            label={{ 
              value: yAxisLabel, 
              angle: -90, 
              position: 'insideLeft' 
            }}
          />
          
          <Tooltip />
          
          {config.legend?.show !== false && (
            <Legend 
              verticalAlign={config.legend?.position === 'top' || config.legend?.position === 'bottom' 
                ? config.legend.position 
                : 'bottom'
              }
              align={config.legend?.position === 'left' || config.legend?.position === 'right'
                ? config.legend.position
                : 'center'
              }
            />
          )}
          
          {series.map((s, index) => (
            <Line
              key={s.field}
              type="monotone"
              dataKey={s.field}
              name={s.name}
              stroke={s.color || colors[index % colors.length]}
              activeDot={{ r: 8 }}
              label={showDataLabels ? {
                position: 'top',
                formatter: (value: number) => value
              } : undefined}
              dot={{ strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LineChartComponent;
