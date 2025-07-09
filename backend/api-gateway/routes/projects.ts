import express from 'express';
import { projectService } from '../../services/projects/project.service';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// Get all projects for the authenticated user's tenant
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await projectService.getProjectsByTenant(req.user.tenantId);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get a specific project
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId, req.user.tenantId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id
    };
    const project = await projectService.createProject(projectData);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
router.patch('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await projectService.updateProject(
      req.params.projectId,
      req.body,
      req.user.tenantId
    );
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
router.delete('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await projectService.deleteProject(req.params.projectId, req.user.tenantId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get AI suggestions for a project
router.get('/:projectId/suggestions', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement AI suggestions service
    const suggestions = [
      {
        id: '1',
        title: 'Optimize Task Assignment',
        description: 'Based on team member workload and expertise, consider reassigning tasks X and Y to team member Z.',
        type: 'ASSIGNMENT'
      },
      {
        id: '2',
        title: 'Sprint Planning Recommendation',
        description: 'Current velocity suggests adding 2-3 more story points to maintain team productivity.',
        type: 'PLANNING'
      }
    ];
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Apply an AI suggestion
router.post('/suggestions/:suggestionId/apply', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement suggestion application logic
    res.json({ message: 'Suggestion applied successfully' });
  } catch (error) {
    console.error('Error applying suggestion:', error);
    res.status(500).json({ error: 'Failed to apply suggestion' });
  }
});

export default router; 