import React, { useState } from 'react';
import { useTasks, useCreateTask, useDeleteTask } from '../hooks/api/useTask';
import { useRealTimeUpdates } from '../hooks/useWebSocket';
import { RealTimeTask } from './RealTimeTask';
import { LoadingState } from './common/LoadingState';
import { ErrorBoundary } from './common/ErrorBoundary';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Pagination,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { formatErrorMessage } from '../utils/errorHandler';

interface TaskListProps {
  projectId?: string;
  filter?: any;
  sort?: any;
}

export const RealTimeTaskList: React.FC<TaskListProps> = ({
  projectId,
  filter,
  sort,
}) => {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    projectId,
  });

  const pageSize = 10;
  const { data, isLoading, error } = useTasks(filter, sort, page, pageSize);
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  // Enable real-time updates
  useRealTimeUpdates();

  const handleCreateTask = async () => {
    try {
      await createTask.mutateAsync(newTask);
      setCreateDialogOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', projectId });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading tasks..." />;
  }

  if (error) {
    return (
      <Box p={2}>
        <div>{formatErrorMessage(error)}</div>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Task
          </Button>
        </Box>

        {data?.tasks.map((task) => (
          <RealTimeTask
            key={task.id}
            taskId={task.id}
            onDelete={() => handleDeleteTask(task.id)}
          />
        ))}

        {data?.total > pageSize && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={Math.ceil(data.total / pageSize)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
            />
          </Box>
        )}

        <Dialog
          open={isCreateDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Task</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
            />
            <TextField
              select
              margin="dense"
              label="Priority"
              fullWidth
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTask}
              variant="contained"
              disabled={!newTask.title}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
}; 