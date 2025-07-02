/**
 * ProjectListWithOfflineSupport Component
 * 
 * A React component that displays a list of projects with full offline support,
 * allowing users to create, update, and delete projects while offline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { 
  offlineProjectService, 
  Project, 
  CreateProjectInput, 
  UpdateProjectInput 
} from '../../../services/projects/offlineProjectService';
import { formatDate } from '@packages/shared/utils';

interface ProjectListWithOfflineSupportProps {
  onProjectSelect?: (projectId: string) => void;
}

const ProjectListWithOfflineSupport: React.FC<ProjectListWithOfflineSupportProps> = ({ 
  onProjectSelect 
}) => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    teamMembers: []
  });
  const [teamMemberInput, setTeamMemberInput] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Get offline sync state
  const { isOnline, isSyncing, syncNow } = useOfflineSync();

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineProjectService.getAllProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on mount and when online status changes
  useEffect(() => {
    loadProjects();
  }, [loadProjects, isOnline]);

  // Handle dialog open for creating a new project
  const handleCreateDialogOpen = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      teamMembers: []
    });
    setDialogOpen(true);
  };

  // Handle dialog open for editing an existing project
  const handleEditDialogOpen = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      teamMembers: [...project.teamMembers]
    });
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  // Handle team member input
  const handleTeamMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamMemberInput(e.target.value);
  };

  // Add team member
  const handleAddTeamMember = () => {
    if (teamMemberInput.trim()) {
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, teamMemberInput.trim()]
      }));
      setTeamMemberInput('');
    }
  };

  // Remove team member
  const handleRemoveTeamMember = (memberToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(member => member !== memberToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editingProject) {
        // Update existing project
        const updateData: UpdateProjectInput = { ...formData };
        await offlineProjectService.updateProject(editingProject.id, updateData);
        showSnackbar('Project updated successfully', 'success');
      } else {
        // Create new project
        await offlineProjectService.createProject(formData);
        showSnackbar('Project created successfully', 'success');
      }
      
      handleDialogClose();
      loadProjects();
    } catch (err) {
      console.error('Error saving project:', err);
      showSnackbar('Failed to save project', 'error');
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await offlineProjectService.deleteProject(projectId);
        showSnackbar('Project deleted successfully', 'success');
        loadProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
        showSnackbar('Failed to delete project', 'error');
      }
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle manual sync
  const handleSync = () => {
    syncNow();
    loadProjects();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Projects
          {!isOnline && (
            <Chip 
              icon={<CloudOffIcon />} 
              label="Offline" 
              color="warning" 
              size="small" 
              sx={{ ml: 2 }} 
            />
          )}
        </Typography>
        <Box>
          {!isOnline && (
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleSync} 
              disabled={isSyncing} 
              startIcon={isSyncing ? <CircularProgress size={20} /> : null}
              sx={{ mr: 2 }}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleCreateDialogOpen}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Project list */}
      {!loading && projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No projects found. Create your first project!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: onProjectSelect ? 'pointer' : 'default',
                  '&:hover': onProjectSelect ? { boxShadow: 3 } : {}
                }}
                onClick={() => onProjectSelect && handleProjectSelect(project.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {project.name}
                      {project.id.startsWith('temp_') && (
                        <Chip 
                          label="Pending Sync" 
                          color="warning" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDialogOpen(project);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {project.description}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Status:</strong> {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Start Date:</strong> {formatDate(project.startDate, 'MM/DD/YYYY')}
                    </Typography>
                    {project.endDate && (
                      <Typography variant="body2">
                        <strong>End Date:</strong> {formatDate(project.endDate, 'MM/DD/YYYY')}
                      </Typography>
                    )}
                  </Box>
                  
                  {project.teamMembers.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Team:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {project.teamMembers.map((member, index) => (
                          <Chip key={index} label={member} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Project form dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Project Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleInputChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="startDate"
            label="Start Date"
            type="date"
            fullWidth
            value={formData.startDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="endDate"
            label="End Date (Optional)"
            type="date"
            fullWidth
            value={formData.endDate || ''}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Team Members
            </Typography>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <TextField
                size="small"
                label="Add team member"
                value={teamMemberInput}
                onChange={handleTeamMemberInputChange}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={handleAddTeamMember}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.teamMembers.map((member, index) => (
                <Chip 
                  key={index} 
                  label={member} 
                  onDelete={() => handleRemoveTeamMember(member)} 
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.name.trim()}
          >
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectListWithOfflineSupport;
