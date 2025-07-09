import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { Button, Card, Select, DatePicker } from '../src/components/ui';
import { ArrowPathIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data, isLoading, error, refreshAnalytics } = useAnalytics(
    selectedProjectId,
    dateRange.startDate,
    dateRange.endDate
  );

  const renderMetricCard = (metric: any) => (
    <Card key={metric.id} className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{metric.name}</h3>
          <p className="mt-2 text-3xl font-semibold">
            {metric.value}
            <span className="text-sm font-normal text-gray-500 ml-1">
              {metric.unit}
            </span>
          </p>
        </div>
        <div className={`flex items-center ${
          metric.trend > 0 ? 'text-green-500' : metric.trend < 0 ? 'text-red-500' : 'text-gray-500'
        }`}>
          {metric.trend > 0 ? (
            <ArrowTrendingUpIcon className="w-5 h-5" />
          ) : (
            <ArrowTrendingDownIcon className="w-5 h-5" />
          )}
          <span className="ml-1">{Math.abs(metric.trend)}%</span>
        </div>
      </div>
    </Card>
  );

  const renderInsightCard = (insight: any) => (
    <Card key={insight.id} className={`p-6 border-l-4 ${
      insight.severity === 'critical' ? 'border-red-500' :
      insight.severity === 'warning' ? 'border-yellow-500' :
      'border-blue-500'
    }`}>
      <h3 className="text-lg font-medium">{insight.title}</h3>
      <p className="mt-2 text-gray-600">{insight.description}</p>
      {insight.recommendations && insight.recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900">Recommendations:</h4>
          <ul className="mt-2 space-y-2">
            {insight.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-gray-600">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <Head>
        <title>Analytics | Renexus</title>
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <div className="flex items-center gap-4">
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-64"
              >
                <option value="">All Projects</option>
                {/* Project options will be populated from API */}
              </Select>
              <div className="flex items-center gap-2">
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
              <Button
                onClick={refreshAnalytics}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div>Loading analytics...</div>
          ) : data ? (
            <div className="space-y-8">
              {/* Key Metrics */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.metrics.map(renderMetricCard)}
                </div>
              </section>

              {/* Charts */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Task Completion Trend */}
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Task Completion Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.taskCompletionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#0088FE"
                          name="Completed Tasks"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Team Velocity Trend */}
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Team Velocity Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.teamVelocityTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#00C49F"
                          name="Story Points"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Task Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Task Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.taskDistribution}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {data.taskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </section>

              {/* AI Insights */}
              <section>
                <h2 className="text-xl font-semibold mb-4">AI-Powered Insights</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.insights.map(renderInsightCard)}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </Layout>
    </>
  );
} 