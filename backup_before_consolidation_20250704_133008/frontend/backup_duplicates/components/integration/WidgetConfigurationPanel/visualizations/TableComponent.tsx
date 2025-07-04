import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper
} from '@mui/material';
import { VisualizationConfig } from '../../../../types/widget';

interface TableComponentProps {
  data: any[];
  config: VisualizationConfig;
}

type Order = 'asc' | 'desc';

/**
 * Table Visualization Component
 * 
 * Renders a data table using the provided data and configuration
 */
const TableComponent: React.FC<TableComponentProps> = ({ data, config }) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Typography variant="body1" color="textSecondary">
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  // Extract table columns from configuration
  const columns = config.tableColumns || [];
  
  // If no columns are defined, use all fields from the first data item
  if (columns.length === 0 && data.length > 0) {
    Object.keys(data[0]).forEach(key => {
      columns.push({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        sortable: true
      });
    });
  }

  // Handle sorting
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort function
  const sortData = (array: any[], field: string, sortOrder: Order) => {
    return [...array].sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];
      
      // Handle different data types
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      if (valueA instanceof Date && valueB instanceof Date) {
        return sortOrder === 'asc' 
          ? valueA.getTime() - valueB.getTime() 
          : valueB.getTime() - valueA.getTime();
      }
      
      // Default string comparison
      const stringA = String(valueA || '').toLowerCase();
      const stringB = String(valueB || '').toLowerCase();
      
      return sortOrder === 'asc'
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });
  };

  // Apply sorting
  const sortedData = orderBy ? sortData(data, orderBy, order) : data;

  // Format cell value based on type
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        {config.title}
      </Typography>
      
      {config.subtitle && (
        <Typography variant="subtitle2" align="center" color="textSecondary" gutterBottom>
          {config.subtitle}
        </Typography>
      )}
      
      <TableContainer component={Paper} sx={{ maxHeight: 350 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  sortDirection={orderBy === column.field ? order : false}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleRequestSort(column.field)}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow key={index} hover>
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {formatCellValue(row[column.field])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TableComponent;
