import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  FormHelperText
} from '@mui/material';
import { DataSource  } from "../../../shared/types/widget";

interface DataSourceSelectorProps {
  selectedDataSourceId?: string;
  dataSources: DataSource[];
  onChange: (dataSourceId: string) => void;
  widgetName: string;
  widgetDescription: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  errors: Record<string, string>;
}

/**
 * Data Source Selector Component
 * 
 * First step in the widget configuration process
 * Allows selection of data source and basic widget metadata
 */
const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  selectedDataSourceId,
  dataSources,
  onChange,
  widgetName,
  widgetDescription,
  onNameChange,
  onDescriptionChange,
  errors
}) => {
  const [selectedSource, setSelectedSource] = useState<DataSource | undefined>(
    dataSources.find(ds => ds.id === selectedDataSourceId)
  );

  const handleDataSourceChange = (dataSourceId: string) => {
    setSelectedSource(dataSources.find(ds => ds.id === dataSourceId));
    onChange(dataSourceId);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Widget Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Widget Name"
            value={widgetName}
            onChange={(e) => onNameChange(e.target.value)}
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" error={!!errors.dataSourceId}>
            <InputLabel>Data Source</InputLabel>
            <Select
              value={selectedDataSourceId || ''}
              onChange={(e) => handleDataSourceChange(e.target.value as string)}
              label="Data Source"
            >
              {dataSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.name}
                </MenuItem>
              ))}
            </Select>
            {errors.dataSourceId && (
              <FormHelperText>{errors.dataSourceId}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Widget Description"
            value={widgetDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      {selectedSource && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Data Source Preview
          </Typography>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {selectedSource.name}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Type: {selectedSource.type}
                {selectedSource.endpoint && ` • Endpoint: ${selectedSource.endpoint}`}
                {selectedSource.refreshInterval && ` • Refresh: ${selectedSource.refreshInterval}s`}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Available Fields:
              </Typography>
              
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {selectedSource.fields.map((field) => (
                  <Grid item key={field.id}>
                    <Card variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2">
                        <strong>{field.name}</strong> ({field.type})
                      </Typography>
                      {field.description && (
                        <Typography variant="caption" color="textSecondary">
                          {field.description}
                        </Typography>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default DataSourceSelector;

