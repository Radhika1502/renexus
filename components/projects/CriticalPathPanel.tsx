import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import { CriticalPathAnalysis, CriticalPathTask } from '../../types/task';

interface CriticalPathPanelProps {
  criticalPath: CriticalPathAnalysis;
}

/**
 * CriticalPathPanel Component
 * 
 * Displays critical path analysis results
 */
const CriticalPathPanel: React.FC<CriticalPathPanelProps> = ({ criticalPath }) => {
  const theme = useTheme();
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate date from project start and days
  const calculateDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
        <Typography variant="subtitle1">Critical Path Analysis</Typography>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" gutterBottom>
          Project Duration: <strong>{criticalPath.projectDuration} days</strong>
        </Typography>
        <Typography variant="body2" gutterBottom>
          Critical Path Duration: <strong>{criticalPath.criticalPathDuration} days</strong>
        </Typography>
        <Typography variant="body2" gutterBottom>
          Critical Tasks: <strong>{criticalPath.criticalTasks.length}</strong>
        </Typography>
        <Typography variant="body2" gutterBottom>
          Tasks with Slack: <strong>{criticalPath.slackTasks.length}</strong>
        </Typography>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Critical Tasks
        </Typography>
        <List dense disablePadding>
          {criticalPath.criticalTasks.map((criticalTask) => (
            <ListItem 
              key={criticalTask.task.id}
              sx={{ 
                mb: 1, 
                backgroundColor: `${theme.palette.error.main}20`,
                border: `1px solid ${theme.palette.error.main}40`,
                borderRadius: 1
              }}
            >
              <ListItemText
                primary={criticalTask.task.title}
                secondary={
                  <React.Fragment>
                    <Typography variant="caption" component="span" display="block">
                      Start: {calculateDate(criticalTask.earliestStart)}
                    </Typography>
                    <Typography variant="caption" component="span" display="block">
                      Finish: {calculateDate(criticalTask.earliestFinish)}
                    </Typography>
                    <Typography variant="caption" component="span" display="block">
                      Duration: {criticalTask.earliestFinish - criticalTask.earliestStart} days
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tasks with Slack
        </Typography>
        <List dense disablePadding>
          {criticalPath.slackTasks.slice(0, 5).map((slackTask) => (
            <ListItem 
              key={slackTask.task.id}
              sx={{ 
                mb: 1, 
                backgroundColor: `${theme.palette.success.main}10`,
                border: `1px solid ${theme.palette.success.main}20`,
                borderRadius: 1
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{slackTask.task.title}</Typography>
                    <Tooltip title="Slack days (can be delayed without affecting project)">
                      <Chip 
                        size="small" 
                        label={`${slackTask.slack} days`} 
                        color="success" 
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Tooltip>
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography variant="caption" component="span" display="block">
                      Earliest: {calculateDate(slackTask.earliestStart)} - {calculateDate(slackTask.earliestFinish)}
                    </Typography>
                    <Typography variant="caption" component="span" display="block">
                      Latest: {calculateDate(slackTask.latestStart)} - {calculateDate(slackTask.latestFinish)}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
          
          {criticalPath.slackTasks.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              +{criticalPath.slackTasks.length - 5} more tasks with slack
            </Typography>
          )}
        </List>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Recommendations
        </Typography>
        <List dense disablePadding>
          <ListItem>
            <ListItemText
              primary="Focus on critical tasks"
              secondary="Prioritize tasks on the critical path to avoid project delays"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Allocate resources strategically"
              secondary="Assign your best resources to critical tasks"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Monitor slack consumption"
              secondary="Watch for tasks consuming their available slack"
            />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default CriticalPathPanel;
