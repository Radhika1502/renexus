import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import { Search, FilterList, Sort } from '@mui/icons-material';
import { TaskFilter, TaskSort } from '../../types/task';

interface TaskFilterBarProps {
  filter: TaskFilter;
  sort: TaskSort;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filter,
  sort,
  onFilterChange,
  onSortChange,
}) => {
  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({
      ...filter,
      status: event.target.value as TaskFilter['status'],
    });
  };

  const handlePriorityChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({
      ...filter,
      priority: event.target.value as TaskFilter['priority'],
    });
  };

  const handleSortFieldChange = (event: SelectChangeEvent<string>) => {
    onSortChange({
      ...sort,
      field: event.target.value as TaskSort['field'],
    });
  };

  const handleSortOrderChange = () => {
    onSortChange({
      ...sort,
      order: sort.order === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      alignItems: 'center', 
      p: 2, 
      backgroundColor: 'background.paper',
      borderRadius: 1,
      boxShadow: 1
    }}>
      <TextField
        placeholder="Search tasks..."
        size="small"
        sx={{ minWidth: 200 }}
        InputProps={{
          startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
        }}
      />

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={filter.status || ''}
          label="Status"
          onChange={handleStatusChange}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="todo">To Do</MenuItem>
          <MenuItem value="in-progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          value={filter.priority || ''}
          label="Priority"
          onChange={handlePriorityChange}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sort.field}
          label="Sort By"
          onChange={handleSortFieldChange}
        >
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="dueDate">Due Date</MenuItem>
          <MenuItem value="priority">Priority</MenuItem>
          <MenuItem value="status">Status</MenuItem>
          <MenuItem value="createdAt">Created Date</MenuItem>
        </Select>
      </FormControl>

      <Tooltip title={`Sort ${sort.order === 'asc' ? 'Descending' : 'Ascending'}`}>
        <IconButton onClick={handleSortOrderChange}>
          <Sort sx={{ 
            transform: sort.order === 'desc' ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}; 