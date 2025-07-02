import React from 'react';

interface BurndownDataPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface BurndownChartProps {
  data: BurndownDataPoint[];
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No burndown data available</p>
      </div>
    );
  }

  // Find the maximum value for scaling
  const maxRemaining = Math.max(...data.map(d => d.remaining));
  const maxIdeal = Math.max(...data.map(d => d.ideal));
  const maxValue = Math.max(maxRemaining, maxIdeal);
  
  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 250;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = chartWidth - (paddingX * 2);
  const graphHeight = chartHeight - (paddingY * 2);
  
  // Calculate scales
  const xScale = graphWidth / (data.length - 1);
  const yScale = graphHeight / maxValue;
  
  // Generate path for remaining tasks line
  const remainingPath = data.map((point, i) => {
    const x = paddingX + (i * xScale);
    const y = chartHeight - paddingY - (point.remaining * yScale);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Generate path for ideal burndown line
  const idealPath = data.map((point, i) => {
    const x = paddingX + (i * xScale);
    const y = chartHeight - paddingY - (point.ideal * yScale);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="mx-auto">
        {/* X and Y axes */}
        <line 
          x1={paddingX} 
          y1={chartHeight - paddingY} 
          x2={chartWidth - paddingX} 
          y2={chartHeight - paddingY} 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />
        <line 
          x1={paddingX} 
          y1={paddingY} 
          x2={paddingX} 
          y2={chartHeight - paddingY} 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - paddingY - (graphHeight * ratio);
          return (
            <React.Fragment key={ratio}>
              <line 
                x1={paddingX} 
                y1={y} 
                x2={chartWidth - paddingX} 
                y2={y} 
                stroke="#e2e8f0" 
                strokeWidth="1" 
                strokeDasharray="4"
              />
              <text 
                x={paddingX - 10} 
                y={y + 4} 
                textAnchor="end" 
                fontSize="10" 
                fill="#64748b"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </React.Fragment>
          );
        })}
        
        {/* X-axis labels (dates) */}
        {data.map((point, i) => {
          // Only show every nth label to avoid crowding
          const showLabel = i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
          if (!showLabel) return null;
          
          const x = paddingX + (i * xScale);
          return (
            <text 
              key={i} 
              x={x} 
              y={chartHeight - paddingY + 15} 
              textAnchor="middle" 
              fontSize="10" 
              fill="#64748b"
            >
              {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </text>
          );
        })}
        
        {/* Ideal burndown line */}
        <path 
          d={idealPath} 
          fill="none" 
          stroke="#94a3b8" 
          strokeWidth="2" 
          strokeDasharray="4"
        />
        
        {/* Actual remaining tasks line */}
        <path 
          d={remainingPath} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="2"
        />
        
        {/* Data points for remaining tasks */}
        {data.map((point, i) => {
          const x = paddingX + (i * xScale);
          const y = chartHeight - paddingY - (point.remaining * yScale);
          return (
            <circle 
              key={i} 
              cx={x} 
              cy={y} 
              r="4" 
              fill="#3b82f6" 
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center mt-2">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-blue-500 mr-1"></div>
          <span className="text-xs text-gray-600">Remaining Tasks</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0 border border-dashed border-gray-400 mr-1"></div>
          <span className="text-xs text-gray-600">Ideal Burndown</span>
        </div>
      </div>
    </div>
  );
};

export default BurndownChart;
