import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { TaskFilterBar } from './TaskFilterBar';
import { TaskDetails } from './TaskDetails';
import { TaskEditDialog } from './TaskEditDialog';
import { Task, TaskFilter, TaskSort, User } from '../../types/task';
import { taskApi } from '../../api/task.api';

interface TaskListProps {
  projectId?: string;
}

export const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [sort, setSort] = useState<TaskSort>({
    field: 'dueDate',
    order: 'asc',
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [filter, sort, projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await taskApi.getTasks(
        { ...filter, projectId },
        sort
      );
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks. Please try again later.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch('/api/users');
      const data = await response.json();
      setAvailableUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await taskApi.updateTask(taskId, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      setError('Failed to update task status. Please try again.');
      console.error('Error updating task status:', err);
    }
  };

  const handleTaskEdit = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskApi.updateTask(taskId, updates);
      await fetchTasks();
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      await fetchTasks();
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', err);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // If the task was dropped in a different status column
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as Task['status'];
      await handleStatusChange(draggableId, newStatus);
    }

    // Update the task order if needed
    const newTasks = Array.from(tasks);
    const [removed] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, removed);
    setTasks(newTasks);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusColumns: Task['status'][] = ['todo', 'in-progress', 'completed', 'blocked'];

  return (
    <Box sx={{ width: '100%' }}>
      <TaskFilterBar
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {statusColumns.map((status) => (
            <Grid item xs={12} sm={6} md={3} key={status}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="h6" gutterBottom>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Typography>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ minHeight: 100 }}
                    >
                      {tasks
                        .filter((task) => task.status === status)
                        .map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{ mb: 2 }}
                              >
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" component="div" noWrap>
                                      {task.title}
                                    </Typography>
                                    <Chip
                                      label={task.priority}
                                      color={getPriorityColor(task.priority)}
                                      size="small"
                                    />
                                  </Box>

                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      mb: 2,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {task.description}
                                  </Typography>

                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                    {task.tags.map((tag) => (
                                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                                    ))}
                                  </Box>

                                  <Typography variant="caption" display="block">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </Typography>
                                </CardContent>

                                <CardActions sx={{ justifyContent: 'flex-end' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleTaskDelete(task.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </CardActions>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>

      <TaskDetails
        open={isDetailsOpen}
        task={selectedTask}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        onEdit={handleTaskEdit}
        onDelete={handleTaskDelete}
        availableUsers={availableUsers}
      />
    </Box>
  );
}; 