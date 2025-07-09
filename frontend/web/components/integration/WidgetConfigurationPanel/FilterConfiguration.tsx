import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FilterConfig, FilterOperator, DataSource  } from "../../../shared/types/widget";
import { v4 as uuidv4 } from 'uuid';

interface FilterConfigurationProps {
  filters: FilterConfig[];
  dataSource?: DataSource;
  onChange: (filters: FilterConfig[]) => void;
}

/**
 * Filter Configuration Component
 * 
 * Third step in the widget configuration process
 * Allows creation and configuration of data filters
 */
const FilterConfiguration: React.FC<FilterConfigurationProps> = ({
  filters,
  dataSource,
  onChange
}) => {
  // Add a new filter
  const addFilter = () => {
    onChange([
      ...filters,
      {
        id: uuidv4(),
        field: '',
        operator: 'equals',
        value: '',
        conjunction: filters.length > 0 ? 'and' : undefined
      }
    ]);
  };

  // Remove a filter
  const removeFilter = (id: string) => {
    onChange(filters.filter(filter => filter.id !== id));
  };

  // Update a specific filter
  const updateFilter = (id: string, updates: Partial<FilterConfig>) => {
    onChange(
      filters.map(filter => 
        filter.id === id 
          ? { ...filter, ...updates } 
          : filter
      )
    );
  };

  // Get operator options based on field type
  const getOperatorOptions = (fieldType?: string): Array<{ value: FilterOperator; label: string }> => {
    const commonOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Not Equals' }
    ];
    
    if (!fieldType) return commonOperators;
    
    switch (fieldType) {
      case 'string':
        return [
          ...commonOperators,
          { value: 'contains', label: 'Contains' },
          { value: 'notContains', label: 'Does Not Contain' },
          { value: 'in', label: 'In List' }
        ];
      case 'number':
        return [
          ...commonOperators,
          { value: 'greaterThan', label: 'Greater Than' },
          { value: 'lessThan', label: 'Less Than' },
          { value: 'between', label: 'Between' }
        ];
      case 'boolean':
        return commonOperators;
      case 'date':
        return [
          ...commonOperators,
          { value: 'greaterThan', label: 'After' },
          { value: 'lessThan', label: 'Before' },
          { value: 'between', label: 'Between' }
        ];
      default:
        return commonOperators;
    }
  };

  // Get field type from data source
  const getFieldType = (fieldPath: string): string | undefined => {
    if (!dataSource) return undefined;
    
    const field = dataSource.fields.find(f => f.path === fieldPath);
    return field?.type;
  };

  // Render value input based on operator and field type
  const renderValueInput = (filter: FilterConfig) => {
    const fieldType = getFieldType(filter.field);
    
    if (filter.operator === 'between') {
      return (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="From"
              value={Array.isArray(filter.value) ? filter.value[0] : ''}
              onChange={(e) => {
                const currentValue = Array.isArray(filter.value) ? filter.value : ['', ''];
                updateFilter(filter.id, { 
                  value: [e.target.value, currentValue[1]] 
                });
              }}
              type={fieldType === 'number' ? 'number' : 'text'}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="To"
              value={Array.isArray(filter.value) ? filter.value[1] : ''}
              onChange={(e) => {
                const currentValue = Array.isArray(filter.value) ? filter.value : ['', ''];
                updateFilter(filter.id, { 
                  value: [currentValue[0], e.target.value] 
                });
              }}
              type={fieldType === 'number' ? 'number' : 'text'}
            />
          </Grid>
        </Grid>
      );
    }
    
    if (filter.operator === 'in' || filter.operator === 'notIn') {
      return (
        <TextField
          fullWidth
          label="Values (comma separated)"
          value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value || ''}
          onChange={(e) => {
            const values = e.target.value.split(',').map(v => v.trim());
            updateFilter(filter.id, { value: values });
          }}
          helperText="Enter multiple values separated by commas"
        />
      );
    }
    
    if (fieldType === 'boolean') {
      return (
        <FormControl fullWidth>
          <InputLabel>Value</InputLabel>
          <Select
            value={filter.value === true ? 'true' : filter.value === false ? 'false' : ''}
            onChange={(e) => {
              updateFilter(filter.id, { 
                value: e.target.value === 'true' ? true : e.target.value === 'false' ? false : '' 
              });
            }}
            label="Value"
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </Select>
        </FormControl>
      );
    }
    
    if (fieldType === 'date') {
      return (
        <TextField
          fullWidth
          label="Value"
          type="date"
          value={filter.value || ''}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      );
    }
    
    return (
      <TextField
        fullWidth
        label="Value"
        value={filter.value || ''}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        type={fieldType === 'number' ? 'number' : 'text'}
      />
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Data Filters
        </Typography>
        
        <Button
          startIcon={<AddIcon />}
          onClick={addFilter}
          variant="outlined"
        >
          Add Filter
        </Button>
      </Box>
      
      {filters.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body1" color="textSecondary" align="center">
              No filters applied. All data will be included.
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              Click "Add Filter" to create data filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        filters.map((filter, index) => (
          <Card key={filter.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
            {index > 0 && (
              <Box mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Join with previous filter</InputLabel>
                  <Select
                    value={filter.conjunction || 'and'}
                    onChange={(e) => updateFilter(filter.id, { 
                      conjunction: e.target.value as 'and' | 'or' 
                    })}
                    label="Join with previous filter"
                  >
                    <MenuItem value="and">AND</MenuItem>
                    <MenuItem value="or">OR</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={11}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={filter.field}
                        onChange={(e) => {
                          // Reset operator and value when field changes
                          updateFilter(filter.id, { 
                            field: e.target.value as string,
                            operator: 'equals',
                            value: ''
                          });
                        }}
                        label="Field"
                      >
                        {dataSource?.fields.filter(f => f.filterable !== false).map((field) => (
                          <MenuItem key={field.id} value={field.path}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, { 
                          operator: e.target.value as FilterOperator,
                          // Reset value when operator changes
                          value: ''
                        })}
                        label="Operator"
                      >
                        {getOperatorOptions(getFieldType(filter.field)).map((op) => (
                          <MenuItem key={op.value} value={op.value}>
                            {op.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={5}>
                    {renderValueInput(filter)}
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={1}>
                <IconButton 
                  color="error" 
                  onClick={() => removeFilter(filter.id)}
                  aria-label="delete filter"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Card>
        ))
      )}
      
      {filters.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Filter Summary
            </Typography>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2">
                  {filters.map((filter, index) => {
                    const field = dataSource?.fields.find(f => f.path === filter.field);
                    const fieldName = field?.name || filter.field;
                    
                    const operatorLabel = getOperatorOptions(getFieldType(filter.field))
                      .find(op => op.value === filter.operator)?.label || filter.operator;
                    
                    let valueDisplay = '';
                    if (Array.isArray(filter.value)) {
                      valueDisplay = filter.value.join(' and ');
                    } else if (filter.value === true) {
                      valueDisplay = 'True';
                    } else if (filter.value === false) {
                      valueDisplay = 'False';
                    } else {
                      valueDisplay = filter.value?.toString() || '';
                    }
                    
                    const filterText = `${fieldName} ${operatorLabel.toLowerCase()} ${valueDisplay}`;
                    
                    return (
                      <span key={filter.id}>
                        {index > 0 && (
                          <strong> {filter.conjunction?.toUpperCase()} </strong>
                        )}
                        {filterText}
                      </span>
                    );
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  );
};

export default FilterConfiguration;

