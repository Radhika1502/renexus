import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useOfflineSync } from '../../task-management/hooks/useOfflineSync';

interface ReportConfig {
  type: 'velocity' | 'burndown' | 'cumulative-flow' | 'task-completion' | 'time-tracking';
  timeframe: 'sprint' | 'month' | 'quarter' | 'year';
  filters?: {
    project?: string;
    team?: string;
    startDate?: string;
    endDate?: string;
  };
  options?: {
    showAverages?: boolean;
    showTrends?: boolean;
    groupBy?: 'team' | 'project' | 'member';
  };
}

interface ReportData {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  data: any;
  config: ReportConfig;
}

export const useReportingApi = () => {
  const { isOnline, getCachedData, recordOfflineOperation } = useOfflineSync();
  const queryClient = useQueryClient();

  const generateReport = useMutation<any, Error, ReportConfig>({
    mutationFn: async (config: ReportConfig) => {
      if (!isOnline) {
        recordOfflineOperation({
          type: 'generate-report',
          data: { config },
          timestamp: new Date().toISOString()
        });
        return { id: 'offline-temp-id', status: 'pending' };
      }
      
      const response = await api.post('/reports/generate', config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  const getReports = useQuery<ReportData[], Error>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!isOnline) {
        return getCachedData('reports') || [];
      }
      const response = await api.get('/reports');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true
  });

  const getReportById = (reportId: string) => {
    return useQuery<ReportData, Error>({
      queryKey: ['reports', reportId],
      queryFn: async () => {
        if (!isOnline) {
          const reports = getCachedData('reports') || [];
          return reports.find((report: ReportData) => report.id === reportId);
        }
        
        const response = await api.get(`/reports/${reportId}`);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!reportId
    });
  };

  const saveReportTemplate = useMutation<any, Error, { name: string; config: ReportConfig }>({
    mutationFn: async (data: { name: string; config: ReportConfig }) => {
      if (!isOnline) {
        recordOfflineOperation({
          type: 'save-report-template',
          data,
          timestamp: new Date().toISOString()
        });
        return { id: 'offline-temp-id', status: 'pending' };
      }
      
      const response = await api.post('/reports/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    }
  });

  const getReportTemplates = useQuery<any[], Error>({
    queryKey: ['report-templates'],
    queryFn: async () => {
      if (!isOnline) {
        return getCachedData('report-templates') || [];
      }
      
      const response = await api.get('/reports/templates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true
  });

  const exportReport = useMutation<any, Error, { reportId: string; format: 'csv' | 'excel' | 'pdf' }>({
    mutationFn: async ({ reportId, format }: { reportId: string; format: 'csv' | 'excel' | 'pdf' }) => {
      if (!isOnline) {
        recordOfflineOperation({
          type: 'export-report',
          data: { reportId, format },
          timestamp: new Date().toISOString()
        });
        return { status: 'pending' };
      }
      
      // For file downloads, we need to use responseType: 'blob'
      const response = await api.get(`/reports/${reportId}/export/${format}`, { responseType: 'blob' });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { status: 'success' };
    },
    onSuccess: () => {
      // No need to invalidate queries here as export doesn't change data
    }
  });

  return {
    generateReport,
    getReports,
    getReportById,
    saveReportTemplate,
    getReportTemplates,
    exportReport
  };
};
