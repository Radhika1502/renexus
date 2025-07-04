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
  ChartOptions,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CumulativeFlowDataPoint {
  date: string;
  backlog: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

interface CumulativeFlowDiagramProps {
  data: CumulativeFlowDataPoint[];
}

export const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ data = [] }) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Done',
        data: data.map(item => item.done),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Review',
        data: data.map(item => item.review + item.done),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'In Progress',
        data: data.map(item => item.inProgress + item.review + item.done),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'To Do',
        data: data.map(item => item.todo + item.inProgress + item.review + item.done),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgba(255, 206, 86, 1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Backlog',
        data: data.map(item => item.backlog + item.todo + item.inProgress + item.review + item.done),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        reverse: true
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tasks'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
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
        No cumulative flow data available
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
};
