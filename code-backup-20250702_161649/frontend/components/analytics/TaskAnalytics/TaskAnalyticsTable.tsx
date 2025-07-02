import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  CheckCircleOutline,
  PendingOutlined,
  ErrorOutline,
  AccessTimeOutlined,
  LowPriority,
  MediumPriority,
  HighPriority,
  PriorityHigh
} from '@mui/icons-material';
import { TaskMetrics  } from "../../../shared/types/task-analytics";

interface TaskAnalyticsTableProps {
  tasks: TaskMetrics[];
  userId?: string;
  onRefresh: () => void;
}

type Order = 'asc' | 'desc';
type OrderBy = keyof TaskMetrics | 'completionTimeFormatted';

/**
 * Task Analytics Table
 * 
 * Displays detailed task data in a sortable, paginated table
 */
const TaskAnalyticsTable: React.FC<TaskAnalyticsTableProps> = ({
  tasks,
  userId,
  onRefresh
}) => {
  const theme = useTheme();
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('createdDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handle sort request
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format completion time
  const formatCompletionTime = (hours: number | null) => {
    if (hours === null) return '-';
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return theme.palette.info.light;
      case 'in_progress':
        return theme.palette.warning.main;
      case 'review':
        return theme.palette.secondary.main;
      case 'done':
        return theme.palette.success.main;
      case 'blocked':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low':
        return <LowPriority fontSize="small" />;
      case 'medium':
        return <MediumPriority fontSize="small" />;
      case 'high':
        return <HighPriority fontSize="small" />;
      case 'urgent':
        return <PriorityHigh fontSize="small" />;
      default:
        return null;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return theme.palette.success.main;
      case 'medium':
        return theme.palette.info.main;
      case 'high':
        return theme.palette.warning.main;
      case 'urgent':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Sort function
  const descendingComparator = <T extends Record<string, any>>(a: T, b: T, orderBy: keyof T) => {
    if (orderBy === 'completionTimeFormatted') {
      const valA = a.completionTime === null ? -Infinity : a.completionTime;
      const valB = b.completionTime === null ? -Infinity : b.completionTime;
      
      if (valB < valA) {
        return -1;
      }
      if (valB > valA) {
        return 1;
      }
      return 0;
    }
    
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const getComparator = <T extends Record<string, any>>(
    order: Order,
    orderBy: keyof T
  ): ((a: T, b: T) => number) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  // Create sorted, paginated data
  const sortedData = React.useMemo(() => {
    return [...tasks].sort(getComparator(order, orderBy as keyof TaskMetrics))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [tasks, order, orderBy, page, rowsPerPage]);

  return (
    <Box>
      <Paper elevation={0} sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'taskId'}
                    direction={orderBy === 'taskId' ? order : 'asc'}
                    onClick={() => handleRequestSort('taskId')}
                  >
                    Task ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'taskName'}
                    direction={orderBy === 'taskName' ? order : 'asc'}
                    onClick={() => handleRequestSort('taskName')}
                  >
                    Task Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'priority'}
                    direction={orderBy === 'priority' ? order : 'asc'}
                    onClick={() => handleRequestSort('priority')}
                  >
                    Priority
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'assignee'}
                    direction={orderBy === 'assignee' ? order : 'asc'}
                    onClick={() => handleRequestSort('assignee')}
                  >
                    Assignee
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdDate'}
                    direction={orderBy === 'createdDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('createdDate')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'dueDate'}
                    direction={orderBy === 'dueDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('dueDate')}
                  >
                    Due Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'completionTimeFormatted'}
                    direction={orderBy === 'completionTimeFormatted' ? order : 'asc'}
                    onClick={() => handleRequestSort('completionTimeFormatted')}
                  >
                    Completion Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((task) => {
                const isOverdue = task.status !== 'done' && 
                  task.dueDate && 
                  new Date(task.dueDate) < new Date();
                  
                const isMentioned = task.mentions?.includes(userId || '');
                
                return (
                  <TableRow
                    hover
                    key={task.id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor: isOverdue ? 'rgba(244, 67, 54, 0.08)' : 'inherit'
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {task.taskId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {task.taskName}
                        {isMentioned && (
                          <Chip 
                            label="Mentioned" 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                          />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(task.status),
                          color: '#fff',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 0.5, color: getPriorityColor(task.priority) }}>
                          {getPriorityIcon(task.priority)}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {task.priority}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell>{formatDate(task.createdDate)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={isOverdue ? 'error' : 'inherit'}
                        fontWeight={isOverdue ? 'medium' : 'regular'}
                      >
                        {formatDate(task.dueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCompletionTime(task.completionTime)}</TableCell>
                    <TableCell>{task.category}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {task.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Task Details">
                        <IconButton size="small">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No tasks found matching the current filters
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default TaskAnalyticsTable;

