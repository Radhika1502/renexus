import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { WidgetConfig, DataSource  } from "../../../shared/types/widget";
import BarChartComponent from './visualizations/BarChartComponent';
import LineChartComponent from './visualizations/LineChartComponent';
import PieChartComponent from './visualizations/PieChartComponent';
import TableComponent from './visualizations/TableComponent';

interface WidgetPreviewProps {
  config: WidgetConfig;
  dataSource?: DataSource;
}

/**
 * Widget Preview Component
 * 
 * Final step in the widget configuration process
 * Shows a live preview of the configured widget with sample or real data
 */
const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  config,
  dataSource
}) => {
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'sample' | 'real'>('sample');

  // Fetch data for preview
  useEffect(() => {
    const fetchData = async () => {
      if (!dataSource) {
        setError('No data source selected');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // In a real implementation, this would call an API
        // For now, we'll generate sample data based on the configuration
        const data = await generatePreviewData(dataSource, config, dataMode);
        setPreviewData(data);
      } catch (err) {
        console.error('Failed to fetch preview data:', err);
        setError('Failed to load preview data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config, dataSource, dataMode]);

  // Generate sample data based on configuration
  const generatePreviewData = async (
    dataSource: DataSource,
    config: WidgetConfig,
    mode: 'sample' | 'real'
  ): Promise<any[]> => {
    // In a real implementation, this would fetch real data for 'real' mode
    // For now, we'll generate sample data for both modes
    
    const sampleSize = 10;
    const result = [];
    
    // Generate sample data based on data source fields
    for (let i = 0; i < sampleSize; i++) {
      const item: Record<string, any> = {};
      
      dataSource.fields.forEach(field => {
        switch (field.type) {
          case 'string':
            item[field.path] = `Sample ${field.name} ${i + 1}`;
            break;
          case 'number':
            item[field.path] = Math.floor(Math.random() * 100);
            break;
          case 'boolean':
            item[field.path] = Math.random() > 0.5;
            break;
          case 'date':
            const date = new Date();
            date.setDate(date.getDate() - i);
            item[field.path] = date.toISOString().split('T')[0];
            break;
          default:
            item[field.path] = `Sample ${field.name} ${i + 1}`;
        }
      });
      
      result.push(item);
    }
    
    // Apply filters if any
    const filteredData = config.filters.length > 0
      ? applyFilters(result, config.filters)
      : result;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return filteredData;
  };

  // Apply filters to data
  const applyFilters = (data: any[], filters: any[]): any[] => {
    // This is a simplified implementation
    // In a real application, this would be more sophisticated
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'notEquals':
            return value !== filter.value;
          case 'contains':
            return String(value).includes(String(filter.value));
          case 'notContains':
            return !String(value).includes(String(filter.value));
          case 'greaterThan':
            return value > filter.value;
          case 'lessThan':
            return value < filter.value;
          default:
            return true;
        }
      });
    });
  };

  // Render the appropriate visualization based on type
  const renderVisualization = () => {
    if (!previewData) return null;
    
    switch (config.visualization.type) {
      case 'bar':
        return (
          <BarChartComponent
            data={previewData}
            config={config.visualization}
          />
        );
      case 'line':
        return (
          <LineChartComponent
            data={previewData}
            config={config.visualization}
          />
        );
      case 'pie':
        return (
          <PieChartComponent
            data={previewData}
            config={config.visualization}
          />
        );
      case 'table':
        return (
          <TableComponent
            data={previewData}
            config={config.visualization}
          />
        );
      default:
        return (
          <Alert severity="info">
            Preview for {config.visualization.type} visualization is not available yet.
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Widget Preview
      </Typography>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">
          {config.name}
        </Typography>
        
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Data Mode</InputLabel>
          <Select
            value={dataMode}
            onChange={(e) => setDataMode(e.target.value as 'sample' | 'real')}
            label="Data Mode"
          >
            <MenuItem value="sample">Sample Data</MenuItem>
            <MenuItem value="real">Real Data</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ minHeight: 400 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={300}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : !previewData ? (
              <Alert severity="info">No data available for preview</Alert>
            ) : (
              renderVisualization()
            )}
          </Box>
        </CardContent>
      </Card>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Configuration Summary
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Widget Details
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {config.name}
            </Typography>
            {config.description && (
              <Typography variant="body2">
                <strong>Description:</strong> {config.description}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Data Source:</strong> {dataSource?.name || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Refresh Interval:</strong> {config.refreshInterval ? `${config.refreshInterval}s` : 'None'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Visualization Details
            </Typography>
            <Typography variant="body2">
              <strong>Type:</strong> {config.visualization.type}
            </Typography>
            <Typography variant="body2">
              <strong>Title:</strong> {config.visualization.title}
            </Typography>
            {config.visualization.subtitle && (
              <Typography variant="body2">
                <strong>Subtitle:</strong> {config.visualization.subtitle}
              </Typography>
            )}
            {config.filters.length > 0 && (
              <Typography variant="body2">
                <strong>Filters:</strong> {config.filters.length} applied
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WidgetPreview;

