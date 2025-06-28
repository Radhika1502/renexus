import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Grid,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  IconButton,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { VisualizationType, VisualizationConfig, DataSource, DataField } from '../../../types/widget';

interface VisualizationOptionsProps {
  visualization?: Partial<VisualizationConfig>;
  dataSource?: DataSource;
  onChange: (visualization: Partial<VisualizationConfig>) => void;
  errors: Record<string, string>;
}

/**
 * Visualization Options Component
 * 
 * Second step in the widget configuration process
 * Allows selection of visualization type and configuration of visualization options
 */
const VisualizationOptions: React.FC<VisualizationOptionsProps> = ({
  visualization = {},
  dataSource,
  onChange,
  errors
}) => {
  const [selectedType, setSelectedType] = useState<VisualizationType>(
    visualization.type || 'bar'
  );

  // Update the visualization type and default configuration
  const handleTypeChange = (type: VisualizationType) => {
    setSelectedType(type);
    
    // Set default configuration based on visualization type
    const updatedVisualization: Partial<VisualizationConfig> = {
      ...visualization,
      type,
    };
    
    // Reset specific configurations based on the new type
    if (['bar', 'line', 'area'].includes(type)) {
      updatedVisualization.xAxis = updatedVisualization.xAxis || { field: '', label: '' };
      updatedVisualization.yAxis = updatedVisualization.yAxis || { field: '', label: '' };
    } else if (type === 'pie') {
      delete updatedVisualization.xAxis;
      delete updatedVisualization.yAxis;
    } else if (type === 'table') {
      delete updatedVisualization.xAxis;
      delete updatedVisualization.yAxis;
      updatedVisualization.tableColumns = updatedVisualization.tableColumns || [];
    }
    
    onChange(updatedVisualization);
  };

  // Update visualization configuration
  const updateVisualization = (updates: Partial<VisualizationConfig>) => {
    onChange({
      ...visualization,
      ...updates
    });
  };

  // Add a new series
  const addSeries = () => {
    const series = visualization.series || [];
    updateVisualization({
      series: [
        ...series,
        {
          name: `Series ${series.length + 1}`,
          field: '',
          aggregation: 'sum'
        }
      ]
    });
  };

  // Remove a series
  const removeSeries = (index: number) => {
    const series = visualization.series || [];
    updateVisualization({
      series: series.filter((_, i) => i !== index)
    });
  };

  // Add a table column
  const addTableColumn = () => {
    const columns = visualization.tableColumns || [];
    updateVisualization({
      tableColumns: [
        ...columns,
        {
          field: '',
          header: `Column ${columns.length + 1}`,
          sortable: true
        }
      ]
    });
  };

  // Remove a table column
  const removeTableColumn = (index: number) => {
    const columns = visualization.tableColumns || [];
    updateVisualization({
      tableColumns: columns.filter((_, i) => i !== index)
    });
  };

  // Get numeric fields from data source
  const getNumericFields = (): DataField[] => {
    if (!dataSource) return [];
    return dataSource.fields.filter(field => 
      field.type === 'number' || 
      (field.aggregatable && ['sum', 'average', 'count'].includes(field.aggregation || ''))
    );
  };

  // Get all fields from data source
  const getAllFields = (): DataField[] => {
    if (!dataSource) return [];
    return dataSource.fields;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Visualization Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Chart Title"
            value={visualization.title || ''}
            onChange={(e) => updateVisualization({ title: e.target.value })}
            margin="normal"
            error={!!errors.visualizationTitle}
            helperText={errors.visualizationTitle}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" error={!!errors.visualizationType}>
            <InputLabel>Visualization Type</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as VisualizationType)}
              label="Visualization Type"
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="area">Area Chart</MenuItem>
              <MenuItem value="scatter">Scatter Plot</MenuItem>
              <MenuItem value="gauge">Gauge Chart</MenuItem>
              <MenuItem value="table">Data Table</MenuItem>
              <MenuItem value="heatmap">Heat Map</MenuItem>
            </Select>
            {errors.visualizationType && (
              <FormHelperText>{errors.visualizationType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Subtitle (Optional)"
            value={visualization.subtitle || ''}
            onChange={(e) => updateVisualization({ subtitle: e.target.value })}
            margin="normal"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Render specific configuration based on visualization type */}
      {['bar', 'line', 'area', 'scatter'].includes(selectedType) && (
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Axis Configuration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>X-Axis Field</InputLabel>
                <Select
                  value={visualization.xAxis?.field || ''}
                  onChange={(e) => updateVisualization({ 
                    xAxis: { ...visualization.xAxis, field: e.target.value } 
                  })}
                  label="X-Axis Field"
                >
                  {getAllFields().map((field) => (
                    <MenuItem key={field.id} value={field.path}>
                      {field.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="X-Axis Label (Optional)"
                value={visualization.xAxis?.label || ''}
                onChange={(e) => updateVisualization({ 
                  xAxis: { ...visualization.xAxis, label: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Y-Axis Field</InputLabel>
                <Select
                  value={visualization.yAxis?.field || ''}
                  onChange={(e) => updateVisualization({ 
                    yAxis: { ...visualization.yAxis, field: e.target.value } 
                  })}
                  label="Y-Axis Field"
                >
                  {getNumericFields().map((field) => (
                    <MenuItem key={field.id} value={field.path}>
                      {field.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Y-Axis Label (Optional)"
                value={visualization.yAxis?.label || ''}
                onChange={(e) => updateVisualization({ 
                  yAxis: { ...visualization.yAxis, label: e.target.value } 
                })}
                margin="normal"
              />
            </Grid>
          </Grid>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={visualization.stacked || false}
                onChange={(e) => updateVisualization({ stacked: e.target.checked })}
              />
            }
            label="Stacked"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={visualization.showDataLabels || false}
                onChange={(e) => updateVisualization({ showDataLabels: e.target.checked })}
              />
            }
            label="Show Data Labels"
          />
        </Box>
      )}

      {/* Series configuration for charts */}
      {['bar', 'line', 'area', 'pie'].includes(selectedType) && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">
              Data Series
            </Typography>
            
            <Button
              startIcon={<AddIcon />}
              onClick={addSeries}
              variant="outlined"
              size="small"
            >
              Add Series
            </Button>
          </Box>
          
          {(visualization.series || []).map((series, index) => (
            <Card key={index} variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={11}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Series Name"
                        value={series.name}
                        onChange={(e) => {
                          const updatedSeries = [...(visualization.series || [])];
                          updatedSeries[index] = { ...series, name: e.target.value };
                          updateVisualization({ series: updatedSeries });
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Field</InputLabel>
                        <Select
                          value={series.field}
                          onChange={(e) => {
                            const updatedSeries = [...(visualization.series || [])];
                            updatedSeries[index] = { ...series, field: e.target.value as string };
                            updateVisualization({ series: updatedSeries });
                          }}
                          label="Field"
                        >
                          {getNumericFields().map((field) => (
                            <MenuItem key={field.id} value={field.path}>
                              {field.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Aggregation</InputLabel>
                        <Select
                          value={series.aggregation || 'sum'}
                          onChange={(e) => {
                            const updatedSeries = [...(visualization.series || [])];
                            updatedSeries[index] = { 
                              ...series, 
                              aggregation: e.target.value as any 
                            };
                            updateVisualization({ series: updatedSeries });
                          }}
                          label="Aggregation"
                        >
                          <MenuItem value="sum">Sum</MenuItem>
                          <MenuItem value="average">Average</MenuItem>
                          <MenuItem value="count">Count</MenuItem>
                          <MenuItem value="min">Minimum</MenuItem>
                          <MenuItem value="max">Maximum</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={1}>
                  <IconButton 
                    color="error" 
                    onClick={() => removeSeries(index)}
                    aria-label="delete series"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Box>
      )}

      {/* Table columns configuration */}
      {selectedType === 'table' && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">
              Table Columns
            </Typography>
            
            <Button
              startIcon={<AddIcon />}
              onClick={addTableColumn}
              variant="outlined"
              size="small"
            >
              Add Column
            </Button>
          </Box>
          
          {(visualization.tableColumns || []).map((column, index) => (
            <Card key={index} variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={11}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Header"
                        value={column.header}
                        onChange={(e) => {
                          const updatedColumns = [...(visualization.tableColumns || [])];
                          updatedColumns[index] = { ...column, header: e.target.value };
                          updateVisualization({ tableColumns: updatedColumns });
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Field</InputLabel>
                        <Select
                          value={column.field}
                          onChange={(e) => {
                            const updatedColumns = [...(visualization.tableColumns || [])];
                            updatedColumns[index] = { ...column, field: e.target.value as string };
                            updateVisualization({ tableColumns: updatedColumns });
                          }}
                          label="Field"
                        >
                          {getAllFields().map((field) => (
                            <MenuItem key={field.id} value={field.path}>
                              {field.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={column.sortable !== false}
                            onChange={(e) => {
                              const updatedColumns = [...(visualization.tableColumns || [])];
                              updatedColumns[index] = { 
                                ...column, 
                                sortable: e.target.checked 
                              };
                              updateVisualization({ tableColumns: updatedColumns });
                            }}
                          />
                        }
                        label="Sortable"
                      />
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={1}>
                  <IconButton 
                    color="error" 
                    onClick={() => removeTableColumn(index)}
                    aria-label="delete column"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Legend configuration */}
      <Box mt={2}>
        <Typography variant="subtitle1" gutterBottom>
          Display Options
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={visualization.legend?.show !== false}
                  onChange={(e) => updateVisualization({ 
                    legend: { 
                      ...visualization.legend,
                      show: e.target.checked 
                    } 
                  })}
                />
              }
              label="Show Legend"
            />
          </Grid>
          
          {visualization.legend?.show !== false && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Legend Position</InputLabel>
                <Select
                  value={visualization.legend?.position || 'bottom'}
                  onChange={(e) => updateVisualization({ 
                    legend: { 
                      ...visualization.legend,
                      position: e.target.value as 'top' | 'right' | 'bottom' | 'left'
                    } 
                  })}
                  label="Legend Position"
                >
                  <MenuItem value="top">Top</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                  <MenuItem value="bottom">Bottom</MenuItem>
                  <MenuItem value="left">Left</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default VisualizationOptions;
