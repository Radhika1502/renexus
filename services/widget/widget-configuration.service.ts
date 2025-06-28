import { WidgetConfig, WidgetTemplate, DataSource } from '../../types/widget';

/**
 * Widget Configuration Service
 * 
 * Handles saving, loading, and managing widget configurations
 */
export class WidgetConfigurationService {
  private static instance: WidgetConfigurationService;
  private apiBaseUrl: string;
  
  private constructor() {
    // Get API URL from environment or use default
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WidgetConfigurationService {
    if (!WidgetConfigurationService.instance) {
      WidgetConfigurationService.instance = new WidgetConfigurationService();
    }
    return WidgetConfigurationService.instance;
  }

  /**
   * Get available data sources
   */
  public async getDataSources(): Promise<DataSource[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/data-sources`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data sources: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching data sources:', error);
      
      // Return mock data sources for development
      return this.getMockDataSources();
    }
  }

  /**
   * Get widget templates
   */
  public async getWidgetTemplates(): Promise<WidgetTemplate[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/widget-templates`);
      if (!response.ok) {
        throw new Error(`Failed to fetch widget templates: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching widget templates:', error);
      
      // Return mock templates for development
      return this.getMockWidgetTemplates();
    }
  }

  /**
   * Save widget configuration
   */
  public async saveWidgetConfig(config: WidgetConfig): Promise<WidgetConfig> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/widget-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save widget configuration: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving widget configuration:', error);
      
      // Return the same config with a mock ID for development
      return {
        ...config,
        id: config.id || `widget-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get widget configuration by ID
   */
  public async getWidgetConfig(id: string): Promise<WidgetConfig | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/widget-configs/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch widget configuration: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching widget configuration ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all widget configurations
   */
  public async getAllWidgetConfigs(): Promise<WidgetConfig[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/widget-configs`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch widget configurations: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching widget configurations:', error);
      
      // Return mock configurations for development
      return this.getMockWidgetConfigs();
    }
  }

  /**
   * Delete widget configuration
   */
  public async deleteWidgetConfig(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/widget-configs/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting widget configuration ${id}:`, error);
      return false;
    }
  }

  /**
   * Generate mock data sources for development
   */
  private getMockDataSources(): DataSource[] {
    return [
      {
        id: 'ds-1',
        name: 'Task Analytics',
        type: 'api',
        endpoint: '/api/analytics/tasks',
        refreshInterval: 300,
        fields: [
          {
            id: 'task-id',
            name: 'Task ID',
            path: 'taskId',
            type: 'string',
            filterable: true
          },
          {
            id: 'task-name',
            name: 'Task Name',
            path: 'taskName',
            type: 'string',
            filterable: true
          },
          {
            id: 'status',
            name: 'Status',
            path: 'status',
            type: 'string',
            filterable: true
          },
          {
            id: 'assignee',
            name: 'Assignee',
            path: 'assignee',
            type: 'string',
            filterable: true
          },
          {
            id: 'created-date',
            name: 'Created Date',
            path: 'createdDate',
            type: 'date',
            filterable: true
          },
          {
            id: 'due-date',
            name: 'Due Date',
            path: 'dueDate',
            type: 'date',
            filterable: true
          },
          {
            id: 'completion-time',
            name: 'Completion Time (hours)',
            path: 'completionTime',
            type: 'number',
            aggregatable: true,
            aggregation: 'average',
            filterable: true
          },
          {
            id: 'priority',
            name: 'Priority',
            path: 'priority',
            type: 'string',
            filterable: true
          }
        ]
      },
      {
        id: 'ds-2',
        name: 'User Activity',
        type: 'api',
        endpoint: '/api/analytics/user-activity',
        refreshInterval: 60,
        fields: [
          {
            id: 'user-id',
            name: 'User ID',
            path: 'userId',
            type: 'string',
            filterable: true
          },
          {
            id: 'username',
            name: 'Username',
            path: 'username',
            type: 'string',
            filterable: true
          },
          {
            id: 'action',
            name: 'Action',
            path: 'action',
            type: 'string',
            filterable: true
          },
          {
            id: 'timestamp',
            name: 'Timestamp',
            path: 'timestamp',
            type: 'date',
            filterable: true
          },
          {
            id: 'duration',
            name: 'Duration (seconds)',
            path: 'duration',
            type: 'number',
            aggregatable: true,
            aggregation: 'sum',
            filterable: true
          }
        ]
      },
      {
        id: 'ds-3',
        name: 'Project Metrics',
        type: 'api',
        endpoint: '/api/analytics/projects',
        refreshInterval: 3600,
        fields: [
          {
            id: 'project-id',
            name: 'Project ID',
            path: 'projectId',
            type: 'string',
            filterable: true
          },
          {
            id: 'project-name',
            name: 'Project Name',
            path: 'projectName',
            type: 'string',
            filterable: true
          },
          {
            id: 'start-date',
            name: 'Start Date',
            path: 'startDate',
            type: 'date',
            filterable: true
          },
          {
            id: 'end-date',
            name: 'End Date',
            path: 'endDate',
            type: 'date',
            filterable: true
          },
          {
            id: 'completion-percentage',
            name: 'Completion Percentage',
            path: 'completionPercentage',
            type: 'number',
            filterable: true
          },
          {
            id: 'budget',
            name: 'Budget',
            path: 'budget',
            type: 'number',
            aggregatable: true,
            aggregation: 'sum',
            filterable: true
          },
          {
            id: 'actual-cost',
            name: 'Actual Cost',
            path: 'actualCost',
            type: 'number',
            aggregatable: true,
            aggregation: 'sum',
            filterable: true
          },
          {
            id: 'team-size',
            name: 'Team Size',
            path: 'teamSize',
            type: 'number',
            filterable: true
          }
        ]
      }
    ];
  }

  /**
   * Generate mock widget templates for development
   */
  private getMockWidgetTemplates(): WidgetTemplate[] {
    return [
      {
        id: 'template-1',
        name: 'Task Status Distribution',
        description: 'Shows the distribution of tasks by status',
        dataSourceId: 'ds-1',
        config: {
          visualization: {
            type: 'pie',
            title: 'Task Status Distribution',
            series: [
              {
                name: 'Tasks',
                field: 'status',
                aggregation: 'count'
              }
            ],
            legend: {
              show: true,
              position: 'right'
            }
          }
        }
      },
      {
        id: 'template-2',
        name: 'Project Completion Timeline',
        description: 'Shows project completion percentage over time',
        dataSourceId: 'ds-3',
        config: {
          visualization: {
            type: 'line',
            title: 'Project Completion Timeline',
            xAxis: {
              field: 'date',
              label: 'Date'
            },
            yAxis: {
              field: 'completionPercentage',
              label: 'Completion %'
            },
            series: [
              {
                name: 'Completion',
                field: 'completionPercentage'
              }
            ]
          }
        }
      },
      {
        id: 'template-3',
        name: 'User Activity Summary',
        description: 'Shows user activity counts by action type',
        dataSourceId: 'ds-2',
        config: {
          visualization: {
            type: 'bar',
            title: 'User Activity by Type',
            xAxis: {
              field: 'action',
              label: 'Action Type'
            },
            yAxis: {
              field: 'count',
              label: 'Count'
            },
            stacked: true
          }
        }
      }
    ];
  }

  /**
   * Generate mock widget configurations for development
   */
  private getMockWidgetConfigs(): WidgetConfig[] {
    return [
      {
        id: 'widget-1',
        name: 'Task Status Overview',
        description: 'Overview of tasks by status',
        dataSourceId: 'ds-1',
        createdAt: '2023-06-15T10:30:00Z',
        updatedAt: '2023-06-15T10:30:00Z',
        refreshInterval: 300,
        visualization: {
          type: 'pie',
          title: 'Task Status Distribution',
          subtitle: 'Current task status breakdown',
          series: [
            {
              name: 'Tasks',
              field: 'status',
              aggregation: 'count'
            }
          ],
          legend: {
            show: true,
            position: 'right'
          },
          showDataLabels: true
        },
        filters: []
      },
      {
        id: 'widget-2',
        name: 'Project Budget vs. Actual',
        description: 'Comparison of project budgets and actual costs',
        dataSourceId: 'ds-3',
        createdAt: '2023-06-16T14:20:00Z',
        updatedAt: '2023-06-18T09:15:00Z',
        refreshInterval: 3600,
        visualization: {
          type: 'bar',
          title: 'Budget vs. Actual Cost',
          xAxis: {
            field: 'projectName',
            label: 'Project'
          },
          yAxis: {
            field: 'cost',
            label: 'Amount ($)'
          },
          series: [
            {
              name: 'Budget',
              field: 'budget'
            },
            {
              name: 'Actual Cost',
              field: 'actualCost'
            }
          ],
          legend: {
            show: true,
            position: 'bottom'
          }
        },
        filters: [
          {
            id: 'filter-1',
            field: 'completionPercentage',
            operator: 'greaterThan',
            value: 0
          }
        ]
      }
    ];
  }
}

export default WidgetConfigurationService;
