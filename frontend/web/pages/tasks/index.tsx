import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TaskList } from '../../src/components/task/TaskList';
import { CreateTaskInput } from '../../src/types/task';
import { taskApi } from '../../src/api/task.api';

const TasksPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<CreateTaskInput>>({
    priority: 'medium',
  });
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = async () => {
    try {
      if (!newTask.title || !newTask.description || !newTask.dueDate) {
        setError('Please fill in all required fields');
        return;
      }

      await taskApi.createTask(newTask as CreateTaskInput);
      setIsCreateDialogOpen(false);
      setNewTask({ priority: 'medium' });
      setError(null);
      // The TaskList component will automatically refresh due to its useEffect
    } catch (err) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', err);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Typography variant="h4" component="h1">
            Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Task
          </Button>
        </Box>

        <TaskList />

        <Dialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Task</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              <TextField
                label="Title"
                required
                fullWidth
                value={newTask.title || ''}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <TextField
                label="Description"
                required
                fullWidth
                multiline
                rows={4}
                value={newTask.description || ''}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <TextField
                label="Due Date"
                type="date"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTask.dueDate || ''}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTask.priority || 'medium'}
                  label="Priority"
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as CreateTaskInput['priority'] })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Tags"
                fullWidth
                placeholder="Enter tags separated by commas"
                value={newTask.tags?.join(', ') || ''}
                onChange={(e) => setNewTask({ 
                  ...newTask, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TasksPage; 