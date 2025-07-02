import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface TaskDistribution {
  category: string;
  count: number;
  percentage: number;
  color?: string;
}

interface TaskDistributionChartProps {
  data: TaskDistribution[];
  title: string;
  chartType?: 'pie' | 'bar';
  height?: number;
  onCategorySelect?: (category: string) => void;
}

/**
 * Component for displaying task distribution analysis as pie or bar chart
 */
const TaskDistributionChart: React.FC<TaskDistributionChartProps> = ({
  data,
  title,
  chartType = 'pie',
  height = 300,
  onCategorySelect
}) => {
  const [chartData, setChartData] = useState<TaskDistribution[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Default colors for chart segments
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
  
  useEffect(() => {
    // Process and prepare data
    const processedData = data.map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length]
    }));
    
    setChartData(processedData);
  }, [data]);
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  // Custom tooltip for data display
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}>
          <p className="label"><strong>{data.category}</strong></p>
          <p className="desc">Count: {data.count}</p>
          <p className="desc">Percentage: {data.percentage.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="task-distribution-chart" style={{ width: '100%', height: `${height}px` }}>
      <h3>{title}</h3>
      
      {chartData.length === 0 ? (
        <div className="no-data">No data available</div>
      ) : chartType === 'pie' ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="category"
              label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
              onClick={(_, index) => handleCategoryClick(chartData[index].category)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke={selectedCategory === entry.category ? '#333' : '#fff'}
                  strokeWidth={selectedCategory === entry.category ? 2 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="count" 
              name="Tasks"
              onClick={(data) => handleCategoryClick(data.category)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={selectedCategory === entry.category ? '#333' : entry.color}
                  strokeWidth={selectedCategory === entry.category ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TaskDistributionChart;
