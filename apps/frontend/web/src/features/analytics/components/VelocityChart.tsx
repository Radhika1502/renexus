import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VelocityDataPoint {
  sprint: string;
  completed: number;
  committed: number;
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data = [] }) => {
  const chartData = {
    labels: data.map(item => item.sprint),
    datasets: [
      {
        label: 'Completed',
        data: data.map(item => item.completed),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Committed',
        data: data.map(item => item.committed),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Story Points'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Sprint'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No velocity data available
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
};
