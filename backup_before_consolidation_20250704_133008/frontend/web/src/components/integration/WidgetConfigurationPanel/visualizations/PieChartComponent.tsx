import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { VisualizationConfig } from '../../../../types/widget';

interface PieChartComponentProps {
  data: any[];
  config: VisualizationConfig;
}

/**
 * Pie Chart Visualization Component
 * 
 * Renders a pie chart using the provided data and configuration
 */
const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, config }) => {
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
  const showDataLabels = config.showDataLabels || false;
  const colors = config.colors || ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8F44AD', '#16A085', '#E74C3C', '#3498DB', '#F39C12', '#9B59B6'];

  // Handle series data
  const series = config.series || [];
  
  if (series.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Typography variant="body1" color="textSecondary">
          No data series configured for pie chart
        </Typography>
      </Box>
    );
  }

  // For pie chart, we need to transform the data
  // We'll use the first series as the value
  const mainSeries = series[0];
  
  // If we have a category field, use it to group data
  const categoryField = config.categoryField || '';
  
  let pieData;
  if (categoryField) {
    // Group by category field
    const groupedData = data.reduce((acc: Record<string, number>, item: any) => {
      const category = item[categoryField] || 'Unknown';
      const value = parseFloat(item[mainSeries.field]) || 0;
      
      if (acc[category]) {
        acc[category] += value;
      } else {
        acc[category] = value;
      }
      
      return acc;
    }, {});
    
    pieData = Object.entries(groupedData).map(([name, value]) => ({
      name,
      value
    }));
  } else {
    // Use each data point as a separate slice
    pieData = data.map(item => ({
      name: item.name || item.label || `Item ${data.indexOf(item) + 1}`,
      value: parseFloat(item[mainSeries.field]) || 0
    }));
  }

  // Custom label renderer for pie slices
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (!showDataLabels) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={showDataLabels}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          
          <Tooltip formatter={(value) => [`${value}`, mainSeries.name || 'Value']} />
          
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
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PieChartComponent;
