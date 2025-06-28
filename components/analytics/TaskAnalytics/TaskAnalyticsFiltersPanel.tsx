import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TaskAnalyticsFilters } from '../../../types/task-analytics';

interface TaskAnalyticsFiltersPanelProps {
  filters: TaskAnalyticsFilters;
  onFilterChange: (filters: Partial<TaskAnalyticsFilters>) => void;
  onResetFilters: () => void;
}

// Mock data for dropdowns
const MOCK_ASSIGNEES = [
  { id: 'john-doe', name: 'John Doe' },
  { id: 'jane-smith', name: 'Jane Smith' },
  { id: 'bob-johnson', name: 'Bob Johnson' },
  { id: 'alice-williams', name: 'Alice Williams' }
];

const MOCK_STATUSES = [
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
  { id: 'blocked', name: 'Blocked' }
];

const MOCK_PRIORITIES = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
  { id: 'urgent', name: 'Urgent' }
];

const MOCK_CATEGORIES = [
  { id: 'Frontend', name: 'Frontend' },
  { id: 'Backend', name: 'Backend' },
  { id: 'Design', name: 'Design' },
  { id: 'Documentation', name: 'Documentation' },
  { id: 'Testing', name: 'Testing' }
];

const MOCK_TAGS = [
  { id: 'bug', name: 'Bug' },
  { id: 'feature', name: 'Feature' },
  { id: 'enhancement', name: 'Enhancement' },
  { id: 'documentation', name: 'Documentation' },
  { id: 'ui', name: 'UI' },
  { id: 'api', name: 'API' }
];

/**
 * Task Analytics Filters Panel
 * 
 * Provides filter controls for task analytics data
 */
const TaskAnalyticsFiltersPanel: React.FC<TaskAnalyticsFiltersPanelProps> = ({
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Handle date changes
  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    if (date) {
      onFilterChange({ [field]: date.toISOString().split('T')[0] });
    } else {
      // If date is cleared, remove the filter
      const newFilters = { ...filters };
      delete newFilters[field];
      onFilterChange(newFilters);
    }
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (field: keyof TaskAnalyticsFilters) => (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const value = event.target.value as string[];
    onFilterChange({ [field]: value });
  };

  // Toggle filter panel expansion
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.assignees?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.priorities?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.tags?.length) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        mb: 3,
        p: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="subtitle1">
            Filters
            {activeFilterCount > 0 && (
              <Chip
                size="small"
                label={activeFilterCount}
                color="primary"
                sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Typography>
        </Box>
        <Box>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={onResetFilters}
              sx={{ mr: 1 }}
            >
              Clear
            </Button>
          )}
          <IconButton size="small" onClick={toggleExpand}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            {/* Date Range */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate ? new Date(filters.startDate) : null}
                onChange={handleDateChange('startDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: { shrink: true }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate ? new Date(filters.endDate) : null}
                onChange={handleDateChange('endDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: { shrink: true }
                  }
                }}
              />
            </Grid>

            {/* Assignees */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="assignees-label">Assignees</InputLabel>
                <Select
                  labelId="assignees-label"
                  id="assignees"
                  multiple
                  value={filters.assignees || []}
                  onChange={handleMultiSelectChange('assignees')}
                  input={<OutlinedInput label="Assignees" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const assignee = MOCK_ASSIGNEES.find(a => a.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={assignee?.name || value} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {MOCK_ASSIGNEES.map((assignee) => (
                    <MenuItem key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Statuses */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="statuses-label">Statuses</InputLabel>
                <Select
                  labelId="statuses-label"
                  id="statuses"
                  multiple
                  value={filters.statuses || []}
                  onChange={handleMultiSelectChange('statuses')}
                  input={<OutlinedInput label="Statuses" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const status = MOCK_STATUSES.find(s => s.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={status?.name || value} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {MOCK_STATUSES.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Priorities */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="priorities-label">Priorities</InputLabel>
                <Select
                  labelId="priorities-label"
                  id="priorities"
                  multiple
                  value={filters.priorities || []}
                  onChange={handleMultiSelectChange('priorities')}
                  input={<OutlinedInput label="Priorities" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const priority = MOCK_PRIORITIES.find(p => p.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={priority?.name || value} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {MOCK_PRIORITIES.map((priority) => (
                    <MenuItem key={priority.id} value={priority.id}>
                      {priority.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Categories */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="categories-label">Categories</InputLabel>
                <Select
                  labelId="categories-label"
                  id="categories"
                  multiple
                  value={filters.categories || []}
                  onChange={handleMultiSelectChange('categories')}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {MOCK_CATEGORIES.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Tags */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="tags-label">Tags</InputLabel>
                <Select
                  labelId="tags-label"
                  id="tags"
                  multiple
                  value={filters.tags || []}
                  onChange={handleMultiSelectChange('tags')}
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {MOCK_TAGS.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Collapse>
    </Paper>
  );
};

export default TaskAnalyticsFiltersPanel;
