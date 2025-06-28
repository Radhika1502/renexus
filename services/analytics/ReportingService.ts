import { 
  AnalyticsReport, 
  ReportSection, 
  ReportSchedule,
  ReportExportFormat
} from '../../types/analytics';

/**
 * ReportingService
 * 
 * Service for creating, managing, and scheduling analytics reports
 */
class ReportingService {
  private static instance: ReportingService;
  private reports: Map<string, AnalyticsReport> = new Map();
  
  private constructor() {
    // Private constructor for singleton pattern
    this.loadSampleReports();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }
  
  /**
   * Load sample reports
   */
  private loadSampleReports(): void {
    const sampleReports: AnalyticsReport[] = [
      {
        id: 'report-1',
        name: 'Weekly Project Status',
        description: 'Weekly summary of project progress and status',
        sections: [
          {
            id: 'section-1',
            title: 'Executive Summary',
            content: 'This report provides an overview of the project status for the week ending {endDate}.',
            charts: [
              {
                id: 'chart-1',
                type: 'line',
                title: 'Task Completion Trend',
                dataSource: 'taskCompletionTrend',
                config: {
                  xAxis: 'date',
                  yAxis: 'count',
                  series: ['completed', 'created']
                }
              }
            ],
            tables: []
          },
          {
            id: 'section-2',
            title: 'Task Status Breakdown',
            content: 'Current distribution of tasks by status:',
            charts: [
              {
                id: 'chart-2',
                type: 'pie',
                title: 'Task Status Distribution',
                dataSource: 'taskStatusBreakdown',
                config: {
                  valueField: 'count',
                  labelField: 'status'
                }
              }
            ],
            tables: [
              {
                id: 'table-1',
                title: 'Task Status Summary',
                dataSource: 'taskStatusSummary',
                columns: [
                  { field: 'status', header: 'Status' },
                  { field: 'count', header: 'Count' },
                  { field: 'percentage', header: 'Percentage', format: 'percentage' }
                ]
              }
            ]
          },
          {
            id: 'section-3',
            title: 'Team Performance',
            content: 'Individual team member performance for the reporting period:',
            charts: [],
            tables: [
              {
                id: 'table-2',
                title: 'Team Performance',
                dataSource: 'teamPerformance',
                columns: [
                  { field: 'userName', header: 'Team Member' },
                  { field: 'tasksAssigned', header: 'Tasks Assigned' },
                  { field: 'tasksCompleted', header: 'Tasks Completed' },
                  { field: 'completionRate', header: 'Completion Rate', format: 'percentage' },
                  { field: 'onTimeRate', header: 'On-Time Rate', format: 'percentage' }
                ]
              }
            ]
          }
        ],
        createdBy: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        schedule: {
          frequency: 'weekly',
          day: 5, // Friday
          time: '17:00',
          recipients: ['manager@example.com', 'team@example.com'],
          exportFormat: 'pdf'
        }
      },
      {
        id: 'report-2',
        name: 'Monthly Resource Utilization',
        description: 'Monthly analysis of team resource utilization and efficiency',
        sections: [
          {
            id: 'section-4',
            title: 'Resource Utilization Summary',
            content: 'This report analyzes resource utilization for the month of {month}.',
            charts: [
              {
                id: 'chart-3',
                type: 'bar',
                title: 'Resource Utilization by Team Member',
                dataSource: 'resourceUtilization',
                config: {
                  xAxis: 'userName',
                  yAxis: 'utilizationPercentage',
                  sortBy: 'value',
                  sortDirection: 'desc'
                }
              }
            ],
            tables: []
          },
          {
            id: 'section-5',
            title: 'Project Allocation',
            content: 'Distribution of resources across projects:',
            charts: [
              {
                id: 'chart-4',
                type: 'stacked-bar',
                title: 'Project Allocation',
                dataSource: 'projectAllocation',
                config: {
                  xAxis: 'projectName',
                  yAxis: 'hours',
                  stackBy: 'userName'
                }
              }
            ],
            tables: [
              {
                id: 'table-3',
                title: 'Project Hours Summary',
                dataSource: 'projectHours',
                columns: [
                  { field: 'projectName', header: 'Project' },
                  { field: 'allocatedHours', header: 'Allocated Hours' },
                  { field: 'actualHours', header: 'Actual Hours' },
                  { field: 'variance', header: 'Variance', format: 'number' },
                  { field: 'variancePercentage', header: 'Variance %', format: 'percentage' }
                ]
              }
            ]
          }
        ],
        createdBy: 'user-1',
        createdAt: '2023-01-02T00:00:00Z',
        schedule: {
          frequency: 'monthly',
          day: 1, // First day of month
          time: '09:00',
          recipients: ['director@example.com', 'manager@example.com'],
          exportFormat: 'excel'
        }
      }
    ];
    
    sampleReports.forEach(report => {
      this.reports.set(report.id, report);
    });
  }
  
  /**
   * Get all reports
   */
  public getAllReports(): AnalyticsReport[] {
    return Array.from(this.reports.values());
  }
  
  /**
   * Get reports by user
   */
  public getReportsByUser(userId: string): AnalyticsReport[] {
    return Array.from(this.reports.values()).filter(
      report => report.createdBy === userId
    );
  }
  
  /**
   * Get report by ID
   */
  public getReport(id: string): AnalyticsReport | undefined {
    return this.reports.get(id);
  }
  
  /**
   * Create a new report
   */
  public createReport(report: Omit<AnalyticsReport, 'id'>): AnalyticsReport {
    const id = `report-${Date.now()}`;
    const newReport: AnalyticsReport = {
      ...report,
      id,
      createdAt: new Date().toISOString()
    };
    
    this.reports.set(id, newReport);
    return newReport;
  }
  
  /**
   * Update an existing report
   */
  public updateReport(id: string, report: Partial<AnalyticsReport>): AnalyticsReport | undefined {
    const existingReport = this.reports.get(id);
    
    if (!existingReport) {
      return undefined;
    }
    
    const updatedReport: AnalyticsReport = {
      ...existingReport,
      ...report,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.reports.set(id, updatedReport);
    return updatedReport;
  }
  
  /**
   * Delete a report
   */
  public deleteReport(id: string): boolean {
    return this.reports.delete(id);
  }
  
  /**
   * Add section to report
   */
  public addSection(reportId: string, section: Omit<ReportSection, 'id'>): ReportSection | undefined {
    const report = this.reports.get(reportId);
    
    if (!report) {
      return undefined;
    }
    
    const id = `section-${Date.now()}`;
    const newSection: ReportSection = {
      ...section,
      id
    };
    
    report.sections.push(newSection);
    report.updatedAt = new Date().toISOString();
    
    this.reports.set(reportId, report);
    return newSection;
  }
  
  /**
   * Update section in report
   */
  public updateSection(reportId: string, sectionId: string, section: Partial<ReportSection>): ReportSection | undefined {
    const report = this.reports.get(reportId);
    
    if (!report) {
      return undefined;
    }
    
    const sectionIndex = report.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex === -1) {
      return undefined;
    }
    
    const updatedSection: ReportSection = {
      ...report.sections[sectionIndex],
      ...section,
      id: sectionId
    };
    
    report.sections[sectionIndex] = updatedSection;
    report.updatedAt = new Date().toISOString();
    
    this.reports.set(reportId, report);
    return updatedSection;
  }
  
  /**
   * Remove section from report
   */
  public removeSection(reportId: string, sectionId: string): boolean {
    const report = this.reports.get(reportId);
    
    if (!report) {
      return false;
    }
    
    const initialLength = report.sections.length;
    report.sections = report.sections.filter(s => s.id !== sectionId);
    
    if (report.sections.length === initialLength) {
      return false;
    }
    
    report.updatedAt = new Date().toISOString();
    this.reports.set(reportId, report);
    
    return true;
  }
  
  /**
   * Schedule a report
   */
  public scheduleReport(reportId: string, schedule: ReportSchedule): boolean {
    const report = this.reports.get(reportId);
    
    if (!report) {
      return false;
    }
    
    report.schedule = schedule;
    report.updatedAt = new Date().toISOString();
    
    this.reports.set(reportId, report);
    return true;
  }
  
  /**
   * Cancel report schedule
   */
  public cancelReportSchedule(reportId: string): boolean {
    const report = this.reports.get(reportId);
    
    if (!report || !report.schedule) {
      return false;
    }
    
    report.schedule = undefined;
    report.updatedAt = new Date().toISOString();
    
    this.reports.set(reportId, report);
    return true;
  }
  
  /**
   * Generate report (mock implementation)
   * In a real implementation, this would generate the report content based on actual data
   */
  public generateReport(reportId: string, startDate: string, endDate: string): { content: string; success: boolean } {
    const report = this.reports.get(reportId);
    
    if (!report) {
      return { content: '', success: false };
    }
    
    // In a real implementation, this would generate actual report content
    // For now, we'll just return a placeholder
    
    return {
      content: `Report: ${report.name}\nPeriod: ${startDate} to ${endDate}\n\nThis is a placeholder for the generated report content.`,
      success: true
    };
  }
  
  /**
   * Export report to specified format
   */
  public exportReport(reportId: string, format: ReportExportFormat): { url: string; success: boolean } {
    const report = this.reports.get(reportId);
    
    if (!report) {
      return { url: '', success: false };
    }
    
    // In a real implementation, this would generate and export the report
    // For now, we'll just return a placeholder URL
    
    return {
      url: `/api/reports/${reportId}/export?format=${format}`,
      success: true
    };
  }
  
  /**
   * Get available report templates
   */
  public getReportTemplates(): { id: string; name: string; description: string; previewImage: string }[] {
    return [
      {
        id: 'template-1',
        name: 'Project Status Report',
        description: 'Weekly or monthly project status summary',
        previewImage: '/assets/images/report-templates/project-status.png'
      },
      {
        id: 'template-2',
        name: 'Resource Utilization Report',
        description: 'Team resource allocation and utilization',
        previewImage: '/assets/images/report-templates/resource-utilization.png'
      },
      {
        id: 'template-3',
        name: 'Performance Dashboard',
        description: 'Key performance indicators and metrics',
        previewImage: '/assets/images/report-templates/performance-dashboard.png'
      },
      {
        id: 'template-4',
        name: 'Executive Summary',
        description: 'High-level overview for executives',
        previewImage: '/assets/images/report-templates/executive-summary.png'
      }
    ];
  }
  
  /**
   * Get available export formats
   */
  public getAvailableExportFormats(): { id: ReportExportFormat; name: string; icon: string }[] {
    return [
      {
        id: 'pdf',
        name: 'PDF Document',
        icon: 'picture_as_pdf'
      },
      {
        id: 'excel',
        name: 'Excel Spreadsheet',
        icon: 'table_chart'
      },
      {
        id: 'csv',
        name: 'CSV File',
        icon: 'format_align_justify'
      },
      {
        id: 'image',
        name: 'Image (PNG)',
        icon: 'image'
      }
    ];
  }
}

export default ReportingService;
