import React, { useState, useEffect } from 'react';
import ReportTemplateEditor from './ReportTemplateEditor';
import { CustomReport, ReportFilter  } from "../../../shared/types/ai";

interface ReportField {
  id: string;
  name: string;
  type: 'metric' | 'dimension' | 'filter' | 'calculation';
  category: string;
  description: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  isSystem?: boolean;
}

interface ReportSection {
  id: string;
  title: string;
  visualizationType: string;
  fields: string[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface CustomReportBuilderProps {
  userId: string;
  onReportGenerated?: (reportData: any) => void;
}

/**
 * Component for building, managing, and generating custom reports
 */
const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  userId,
  onReportGenerated
}) => {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  
  // Fetch user's saved reports and system templates
  useEffect(() => {
    const fetchReportsAndTemplates = async () => {
      try {
        // In a real implementation, these would be API calls
        // For now, we'll use mock data
        
        // Mock saved reports
        const mockReports: CustomReport[] = [
          {
            id: 'r1',
            name: 'Project Completion Analysis',
            description: 'Analysis of task completion rates across projects',
            metrics: ['taskCompletionRate', 'avgTimeToComplete'],
            filters: {
              dateRange: { start: '2023-01-01', end: '2023-12-31' },
              status: ['completed', 'in-progress']
            },
            groupBy: 'project',
            sortBy: 'taskCompletionRate',
            sortDirection: 'desc',
            visualization: { type: 'bar', options: { stacked: true } },
            createdBy: userId,
            createdAt: '2023-05-15T10:30:00Z',
            updatedAt: '2023-06-22T14:45:00Z'
          },
          {
            id: 'r2',
            name: 'Team Performance Dashboard',
            description: 'Metrics for team productivity and efficiency',
            metrics: ['tasksCompleted', 'avgResponseTime', 'collaborationScore'],
            filters: {
              timeframe: 'last90days'
            },
            groupBy: 'team',
            sortBy: 'tasksCompleted',
            sortDirection: 'desc',
            visualization: { type: 'card', options: {} },
            createdBy: userId,
            createdAt: '2023-07-10T08:15:00Z',
            updatedAt: '2023-07-10T08:15:00Z'
          }
        ];
        
        // Mock report templates
        const mockTemplates: ReportTemplate[] = [
          {
            id: 't1',
            name: 'Task Progress Overview',
            description: 'Overview of task progress across projects and teams',
            isSystem: true,
            sections: [
              {
                id: 's1',
                title: 'Task Completion',
                visualizationType: 'bar',
                fields: ['taskCompletionRate', 'tasksCompleted', 'project']
              }
            ]
          },
          {
            id: 't2',
            name: 'Team Productivity Analysis',
            description: 'Analyze team productivity and efficiency metrics',
            isSystem: true,
            sections: [
              {
                id: 's1',
                title: 'Productivity Overview',
                visualizationType: 'card',
                fields: ['tasksCompleted', 'avgTimeToComplete', 'team']
              },
              {
                id: 's2',
                title: 'Time Tracking',
                visualizationType: 'line',
                fields: ['hoursLogged', 'date', 'team']
              }
            ]
          }
        ];
        
        // Mock available fields
        const mockFields: ReportField[] = [
          {
            id: 'taskCompletionRate',
            name: 'Task Completion Rate',
            type: 'metric',
            category: 'Tasks',
            description: 'Percentage of tasks completed on time'
          },
          {
            id: 'tasksCompleted',
            name: 'Tasks Completed',
            type: 'metric',
            category: 'Tasks',
            description: 'Number of tasks completed'
          },
          {
            id: 'avgTimeToComplete',
            name: 'Avg. Time to Complete',
            type: 'metric',
            category: 'Time',
            description: 'Average time taken to complete tasks'
          },
          {
            id: 'avgResponseTime',
            name: 'Avg. Response Time',
            type: 'metric',
            category: 'Communication',
            description: 'Average time to respond to tasks/comments'
          },
          {
            id: 'collaborationScore',
            name: 'Collaboration Score',
            type: 'metric',
            category: 'Team',
            description: 'Score reflecting team collaboration effectiveness'
          },
          {
            id: 'hoursLogged',
            name: 'Hours Logged',
            type: 'metric',
            category: 'Time',
            description: 'Total hours logged on tasks'
          },
          {
            id: 'project',
            name: 'Project',
            type: 'dimension',
            category: 'Organization',
            description: 'Project name'
          },
          {
            id: 'team',
            name: 'Team',
            type: 'dimension',
            category: 'Organization',
            description: 'Team name'
          },
          {
            id: 'date',
            name: 'Date',
            type: 'dimension',
            category: 'Time',
            description: 'Date of activity'
          },
          {
            id: 'user',
            name: 'User',
            type: 'dimension',
            category: 'People',
            description: 'User name'
          }
        ];
        
        setReports(mockReports);
        setTemplates(mockTemplates);
        setAvailableFields(mockFields);
        
      } catch (error) {
        console.error('Error fetching reports and templates:', error);
      }
    };
    
    fetchReportsAndTemplates();
  }, [userId]);
  
  // Create new report
  const handleCreateReport = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedReport(null);
  };
  
  // Edit existing report
  const handleEditReport = (report: CustomReport) => {
    setSelectedReport(report);
    setIsEditing(true);
    setIsCreating(false);
  };
  
  // Delete report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      // In a real implementation, this would be an API call
      // For now, just remove from local state
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setIsEditing(false);
      }
      
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };
  
  // Save report (create or update)
  const handleSaveReport = async (report: CustomReport) => {
    try {
      // In a real implementation, this would be an API call
      // For now, just update local state
      if (isCreating) {
        // Create new report with generated ID
        const newReport = {
          ...report,
          id: `r${Math.floor(Math.random() * 10000)}`,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setReports(prevReports => [...prevReports, newReport]);
      } else if (isEditing && selectedReport) {
        // Update existing report
        const updatedReport = {
          ...report,
          updatedAt: new Date().toISOString()
        };
        
        setReports(prevReports => 
          prevReports.map(r => r.id === updatedReport.id ? updatedReport : r)
        );
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedReport(null);
      
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };
  
  // Generate report with current settings
  const handleGenerateReport = async (report: CustomReport) => {
    try {
      setIsGenerating(true);
      
      // In a real implementation, this would be an API call
      // For now, we'll just simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockReportData = {
        id: report.id,
        name: report.name,
        generatedAt: new Date().toISOString(),
        data: [
          { category: 'Project A', value: 85, metric: 'Task Completion Rate' },
          { category: 'Project B', value: 62, metric: 'Task Completion Rate' },
          { category: 'Project C', value: 91, metric: 'Task Completion Rate' },
        ],
        summary: {
          average: 79.3,
          trend: 'increasing',
          insight: 'Project C has the highest completion rate at 91%'
        }
      };
      
      if (onReportGenerated) {
        onReportGenerated(mockReportData);
      }
      
      setIsGenerating(false);
      
    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
    }
  };
  
  // Export report to selected format
  const handleExportReport = async (report: CustomReport) => {
    try {
      setIsExporting(true);
      
      // In a real implementation, this would be an API call
      // For now, we'll just simulate a delay and log the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Exporting report "${report.name}" in ${exportFormat} format`);
      
      setIsExporting(false);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      setIsExporting(false);
    }
  };
  
  // Cancel report creation or editing
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedReport(null);
  };
  
  // Render report editor (create/edit mode)
  if (isCreating || isEditing) {
    return (
      <div className="custom-report-builder">
        <div className="builder-header">
          <h2>{isCreating ? 'Create New Report' : 'Edit Report'}</h2>
        </div>
        
        <ReportTemplateEditor
          initialReport={selectedReport || undefined}
          availableFields={availableFields}
          availableTemplates={templates}
          onSave={handleSaveReport}
          onCancel={handleCancel}
        />
      </div>
    );
  }
  
  // Render report list (default view)
  return (
    <div className="custom-report-builder">
      <div className="builder-header">
        <h2>Custom Reports</h2>
        <button 
          className="btn btn-primary"
          onClick={handleCreateReport}
        >
          Create New Report
        </button>
      </div>
      
      <div className="report-list-container">
        {reports.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any reports yet.</p>
            <button 
              className="btn btn-primary"
              onClick={handleCreateReport}
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className="report-list">
            {reports.map(report => (
              <div key={report.id} className="report-card">
                <div className="report-info">
                  <h3>{report.name}</h3>
                  <p className="report-description">{report.description}</p>
                  <div className="report-meta">
                    <span>Last updated: {new Date(report.updatedAt).toLocaleDateString()}</span>
                    <span>{report.metrics.length} metrics</span>
                  </div>
                </div>
                
                <div className="report-actions">
                  <div className="action-group">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleEditReport(report)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="action-group">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleGenerateReport(report)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Report'}
                    </button>
                    
                    <div className="export-dropdown">
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                        className="export-select"
                      >
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                      </select>
                      
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleExportReport(report)}
                        disabled={isExporting}
                      >
                        {isExporting ? 'Exporting...' : 'Export'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .custom-report-builder {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        
        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .builder-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 0;
          color: #666;
        }
        
        .report-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .report-card {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .report-card:hover {
          border-color: #ddd;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .report-info {
          flex: 1;
        }
        
        .report-info h3 {
          margin: 0 0 5px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .report-description {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }
        
        .report-meta {
          display: flex;
          gap: 20px;
          color: #888;
          font-size: 12px;
        }
        
        .report-actions {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
        }
        
        .action-group {
          display: flex;
          gap: 10px;
        }
        
        .export-dropdown {
          display: flex;
          gap: 5px;
        }
        
        .export-select {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .btn {
          padding: 8px 15px;
          border-radius: 4px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          white-space: nowrap;
        }
        
        .btn-primary {
          background-color: #4a6cf7;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #3a5ce5;
        }
        
        .btn-secondary {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .btn-secondary:hover {
          background-color: #e0e0e0;
        }
        
        .btn-danger {
          background-color: #fff;
          color: #dc3545;
          border: 1px solid #dc3545;
        }
        
        .btn-danger:hover {
          background-color: #dc3545;
          color: #fff;
        }
        
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default CustomReportBuilder;

