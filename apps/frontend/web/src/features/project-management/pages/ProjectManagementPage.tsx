/**
 * ProjectManagementPage Component
 * 
 * A page component that displays project management features with offline support
 */

import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Divider } from '@mui/material';
import ProjectListWithOfflineSupport from '../components/ProjectListWithOfflineSupport';
import { OfflineStatusNotification } from '../../../components/common/OfflineStatusNotification';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
};

interface ProjectManagementPageProps {
  projectId?: string;
}

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({ projectId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    // If we're not already on the details tab, switch to it
    if (tabValue !== 1) {
      setTabValue(1);
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Project Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your projects with full offline support
        </Typography>
        <OfflineStatusNotification />
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="project management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Projects" {...a11yProps(0)} />
          {selectedProjectId && <Tab label="Project Details" {...a11yProps(1)} />}
          <Tab label="Analytics" {...a11yProps(selectedProjectId ? 2 : 1)} />
        </Tabs>

        {/* All Projects Tab */}
        <TabPanel value={tabValue} index={0}>
          <ProjectListWithOfflineSupport onProjectSelect={handleProjectSelect} />
        </TabPanel>

        {/* Project Details Tab */}
        {selectedProjectId && (
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Project Details
              </Typography>
              <Typography variant="body1">
                Detailed view for project ID: {selectedProjectId}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Project details component will be implemented here with tasks, timeline, and team members.
              </Typography>
            </Box>
          </TabPanel>
        )}

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={selectedProjectId ? 2 : 1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Analytics
            </Typography>
            <Typography variant="body1">
              {selectedProjectId 
                ? `Analytics for project ID: ${selectedProjectId}`
                : 'Overall project analytics'
              }
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Project analytics component will be implemented here with charts and metrics.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProjectManagementPage;
