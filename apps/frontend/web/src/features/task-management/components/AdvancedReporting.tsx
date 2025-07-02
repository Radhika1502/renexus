import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  DatePicker,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@renexus/ui-components';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useTaskReports } from '../hooks/useTaskReports';
import { exportToCSV, exportToPDF, exportToExcel } from '../utils/exportUtils';

interface AdvancedReportingProps {
  projectId?: string;
  tasks: Task[];
}

export const AdvancedReporting: React.FC<AdvancedReportingProps> = ({ projectId, tasks }) => {
  const [reportType, setReportType] = useState<'status' | 'priority' | 'timeline' | 'velocity' | 'burndown'>('status');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: reportData, isLoading, refetch } = useTaskReports({
    projectId,
    reportType,
    startDate: dateRange.start,
    endDate: dateRange.end,
    groupBy,
  });

  // Calculate derived metrics from tasks
  const taskMetrics = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    
    // Status distribution
    const statusDistribution = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Priority distribution
    const priorityDistribution = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Time tracking data
    const timeSpentByStatus = Object.entries(statusDistribution).map(([status, count]) => ({
      name: status,
      tasks: count,
    }));
    
    const timeSpentByPriority = Object.entries(priorityDistribution).map(([priority, count]) => ({
      name: priority,
      tasks: count,
    }));
    
    return {
      statusDistribution: timeSpentByStatus,
      priorityDistribution: timeSpentByPriority,
    };
  }, [tasks]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Handle export functions
  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const reportTitle = `Task Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
    const data = reportData || [];
    
    switch (format) {
      case 'csv':
        exportToCSV(data, reportTitle);
        break;
      case 'pdf':
        exportToPDF(data, reportTitle);
        break;
      case 'excel':
        exportToExcel(data, reportTitle);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Advanced Reporting</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Report Type</label>
                <Select
                  value={reportType}
                  onValueChange={(value) => setReportType(value as any)}
                >
                  <option value="status">Status Distribution</option>
                  <option value="priority">Priority Distribution</option>
                  <option value="timeline">Timeline</option>
                  <option value="velocity">Team Velocity</option>
                  <option value="burndown">Burndown Chart</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date Range</label>
                <div className="flex space-x-2">
                  <DatePicker
                    selected={dateRange.start}
                    onChange={(date) => setDateRange({ ...dateRange, start: date as Date })}
                    className="w-full"
                  />
                  <DatePicker
                    selected={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date as Date })}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Group By</label>
                <Select
                  value={groupBy}
                  onValueChange={(value) => setGroupBy(value as any)}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="data">Data Table</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-6">
          {reportType === 'status' && taskMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskMetrics.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="tasks"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskMetrics.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportType === 'priority' && taskMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskMetrics.priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tasks" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportType === 'timeline' && reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completed" stroke="#8884d8" />
                      <Line type="monotone" dataKey="created" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportType === 'velocity' && reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Team Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" fill="#8884d8" />
                      <Bar dataKey="points" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {reportType === 'burndown' && reportData && (
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="remaining" stroke="#ff7300" />
                      <Line type="monotone" dataKey="ideal" stroke="#82ca9d" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Report Data</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {reportData && reportData.length > 0 && 
                        Object.keys(reportData[0]).map((key) => (
                          <th key={key} className="p-2 text-left border">{key}</th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && reportData.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((value, j) => (
                          <td key={j} className="p-2 border">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
