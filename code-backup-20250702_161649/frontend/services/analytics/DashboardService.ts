import { AnalyticsDashboard, DashboardWidget  } from "../../../shared/types/analytics";

/**
 * DashboardService
 * 
 * Service for managing analytics dashboards
 */
class DashboardService {
  private static instance: DashboardService;
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  
  private constructor() {
    // Private constructor for singleton pattern
    this.loadSampleDashboards();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }
  
  /**
   * Load sample dashboards
   */
  private loadSampleDashboards(): void {
    const sampleDashboards: AnalyticsDashboard[] = [
      {
        id: 'dashboard-1',
        name: 'Project Overview',
        description: 'Overview of project status and metrics',
        widgets: [
          {
            id: 'widget-1',
            type: 'chart',
            title: 'Task Status Distribution',
            dataSource: 'taskStatusBreakdown',
            config: {
              chartType: 'pie',
              colorScheme: 'categorical'
            },
            position: { x: 0, y: 0, width: 6, height: 4 }
          },
          {
            id: 'widget-2',
            type: 'chart',
            title: 'Task Completion Trend',
            dataSource: 'taskCompletionTrend',
            config: {
              chartType: 'line',
              showLegend: true,
              xAxis: 'date',
              yAxis: 'count'
            },
            position: { x: 6, y: 0, width: 6, height: 4 }
          },
          {
            id: 'widget-3',
            type: 'metric',
            title: 'Project Metrics',
            dataSource: 'projectMetrics',
            config: {
              metrics: [
                { name: 'Completion', field: 'completionPercentage', format: 'percentage' },
                { name: 'On Schedule', field: 'onSchedule', format: 'boolean' },
                { name: 'Days Remaining', field: 'daysRemaining', format: 'number' }
              ]
            },
            position: { x: 0, y: 4, width: 4, height: 2 }
          },
          {
            id: 'widget-4',
            type: 'table',
            title: 'Overdue Tasks',
            dataSource: 'overdueTasks',
            config: {
              columns: [
                { field: 'title', header: 'Task' },
                { field: 'dueDate', header: 'Due Date', format: 'date' },
                { field: 'assignee.name', header: 'Assignee' },
                { field: 'priority', header: 'Priority' }
              ],
              pagination: true,
              pageSize: 5
            },
            position: { x: 4, y: 4, width: 8, height: 4 }
          }
        ],
        createdBy: 'user-1',
        createdAt: '2023-01-01T00:00:00Z',
        isShared: true
      },
      {
        id: 'dashboard-2',
        name: 'Resource Utilization',
        description: 'Team workload and resource allocation',
        widgets: [
          {
            id: 'widget-5',
            type: 'chart',
            title: 'Team Workload',
            dataSource: 'teamWorkload',
            config: {
              chartType: 'bar',
              orientation: 'horizontal',
              sortBy: 'value',
              sortDirection: 'desc'
            },
            position: { x: 0, y: 0, width: 12, height: 4 }
          },
          {
            id: 'widget-6',
            type: 'chart',
            title: 'Resource Allocation',
            dataSource: 'resourceAllocation',
            config: {
              chartType: 'stacked-bar',
              groupBy: 'userId',
              stackBy: 'projectId',
              showLegend: true
            },
            position: { x: 0, y: 4, width: 6, height: 4 }
          },
          {
            id: 'widget-7',
            type: 'table',
            title: 'User Productivity',
            dataSource: 'userProductivity',
            config: {
              columns: [
                { field: 'userName', header: 'User' },
                { field: 'tasksCompleted', header: 'Tasks Completed' },
                { field: 'averageCompletionTime', header: 'Avg. Time (hrs)', format: 'number' },
                { field: 'onTimePercentage', header: 'On Time %', format: 'percentage' }
              ],
              sortable: true,
              defaultSort: { field: 'tasksCompleted', direction: 'desc' }
            },
            position: { x: 6, y: 4, width: 6, height: 4 }
          }
        ],
        createdBy: 'user-1',
        createdAt: '2023-01-02T00:00:00Z',
        isShared: false
      }
    ];
    
    sampleDashboards.forEach(dashboard => {
      this.dashboards.set(dashboard.id, dashboard);
    });
  }
  
  /**
   * Get all dashboards
   */
  public getAllDashboards(): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values());
  }
  
  /**
   * Get dashboards by user
   */
  public getDashboardsByUser(userId: string): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values()).filter(
      dashboard => dashboard.createdBy === userId || 
                  (dashboard.isShared && dashboard.sharedWith?.includes(userId))
    );
  }
  
  /**
   * Get dashboard by ID
   */
  public getDashboard(id: string): AnalyticsDashboard | undefined {
    return this.dashboards.get(id);
  }
  
  /**
   * Create a new dashboard
   */
  public createDashboard(dashboard: Omit<AnalyticsDashboard, 'id'>): AnalyticsDashboard {
    const id = `dashboard-${Date.now()}`;
    const newDashboard: AnalyticsDashboard = {
      ...dashboard,
      id
    };
    
    this.dashboards.set(id, newDashboard);
    return newDashboard;
  }
  
  /**
   * Update an existing dashboard
   */
  public updateDashboard(id: string, dashboard: Partial<AnalyticsDashboard>): AnalyticsDashboard | undefined {
    const existingDashboard = this.dashboards.get(id);
    
    if (!existingDashboard) {
      return undefined;
    }
    
    const updatedDashboard: AnalyticsDashboard = {
      ...existingDashboard,
      ...dashboard,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.dashboards.set(id, updatedDashboard);
    return updatedDashboard;
  }
  
  /**
   * Delete a dashboard
   */
  public deleteDashboard(id: string): boolean {
    return this.dashboards.delete(id);
  }
  
  /**
   * Add widget to dashboard
   */
  public addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): DashboardWidget | undefined {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      return undefined;
    }
    
    const id = `widget-${Date.now()}`;
    const newWidget: DashboardWidget = {
      ...widget,
      id
    };
    
    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date().toISOString();
    
    this.dashboards.set(dashboardId, dashboard);
    return newWidget;
  }
  
  /**
   * Update widget in dashboard
   */
  public updateWidget(dashboardId: string, widgetId: string, widget: Partial<DashboardWidget>): DashboardWidget | undefined {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      return undefined;
    }
    
    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    
    if (widgetIndex === -1) {
      return undefined;
    }
    
    const updatedWidget: DashboardWidget = {
      ...dashboard.widgets[widgetIndex],
      ...widget,
      id: widgetId
    };
    
    dashboard.widgets[widgetIndex] = updatedWidget;
    dashboard.updatedAt = new Date().toISOString();
    
    this.dashboards.set(dashboardId, dashboard);
    return updatedWidget;
  }
  
  /**
   * Remove widget from dashboard
   */
  public removeWidget(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      return false;
    }
    
    const initialLength = dashboard.widgets.length;
    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    
    if (dashboard.widgets.length === initialLength) {
      return false;
    }
    
    dashboard.updatedAt = new Date().toISOString();
    this.dashboards.set(dashboardId, dashboard);
    
    return true;
  }
  
  /**
   * Share dashboard with users
   */
  public shareDashboard(dashboardId: string, userIds: string[]): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      return false;
    }
    
    dashboard.isShared = true;
    dashboard.sharedWith = [...new Set([...(dashboard.sharedWith || []), ...userIds])];
    dashboard.updatedAt = new Date().toISOString();
    
    this.dashboards.set(dashboardId, dashboard);
    return true;
  }
  
  /**
   * Unshare dashboard with users
   */
  public unshareDashboard(dashboardId: string, userIds: string[]): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard || !dashboard.sharedWith) {
      return false;
    }
    
    dashboard.sharedWith = dashboard.sharedWith.filter(userId => !userIds.includes(userId));
    
    if (dashboard.sharedWith.length === 0) {
      dashboard.isShared = false;
      dashboard.sharedWith = undefined;
    }
    
    dashboard.updatedAt = new Date().toISOString();
    this.dashboards.set(dashboardId, dashboard);
    
    return true;
  }
  
  /**
   * Get available widget types
   */
  public getAvailableWidgetTypes(): { id: string; name: string; description: string; icon: string }[] {
    return [
      {
        id: 'chart',
        name: 'Chart',
        description: 'Visualize data with various chart types',
        icon: 'bar_chart'
      },
      {
        id: 'metric',
        name: 'Metrics',
        description: 'Display key metrics and KPIs',
        icon: 'speed'
      },
      {
        id: 'table',
        name: 'Table',
        description: 'Show data in tabular format',
        icon: 'table_chart'
      },
      {
        id: 'list',
        name: 'List',
        description: 'Display items in a list format',
        icon: 'format_list_bulleted'
      }
    ];
  }
  
  /**
   * Get available data sources for widgets
   */
  public getAvailableDataSources(): { id: string; name: string; description: string; category: string }[] {
    return [
      {
        id: 'taskStatusBreakdown',
        name: 'Task Status Breakdown',
        description: 'Distribution of tasks by status',
        category: 'tasks'
      },
      {
        id: 'taskPriorityBreakdown',
        name: 'Task Priority Breakdown',
        description: 'Distribution of tasks by priority',
        category: 'tasks'
      },
      {
        id: 'taskCompletionTrend',
        name: 'Task Completion Trend',
        description: 'Task completion over time',
        category: 'tasks'
      },
      {
        id: 'projectMetrics',
        name: 'Project Metrics',
        description: 'Key project performance indicators',
        category: 'projects'
      },
      {
        id: 'overdueTasks',
        name: 'Overdue Tasks',
        description: 'Tasks past their due date',
        category: 'tasks'
      },
      {
        id: 'teamWorkload',
        name: 'Team Workload',
        description: 'Task allocation across team members',
        category: 'resources'
      },
      {
        id: 'resourceAllocation',
        name: 'Resource Allocation',
        description: 'How resources are allocated across projects',
        category: 'resources'
      },
      {
        id: 'userProductivity',
        name: 'User Productivity',
        description: 'Productivity metrics for team members',
        category: 'resources'
      }
    ];
  }
}

export default DashboardService;

