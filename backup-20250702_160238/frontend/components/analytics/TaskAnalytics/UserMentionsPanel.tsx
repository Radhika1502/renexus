import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useUserMentions } from '../../../hooks/useTaskAnalytics';
import { UserMention  } from "../../../shared/types/task-analytics";

interface UserMentionsPanelProps {
  userId: string;
}

/**
 * User Mentions Panel
 * 
 * Displays mentions of the current user in tasks
 */
const UserMentionsPanel: React.FC<UserMentionsPanelProps> = ({ userId }) => {
  const theme = useTheme();
  const { mentions, loading, error, resolveMention, refreshMentions } = useUserMentions(userId);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle resolve mention
  const handleResolveMention = async (mentionId: string) => {
    await resolveMention(mentionId);
  };

  // Group mentions by resolved status
  const pendingMentions = mentions.filter(mention => !mention.resolved);
  const resolvedMentions = mentions.filter(mention => mention.resolved);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2]
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Your Mentions
        </Typography>
        <Button 
          variant="outlined" 
          size="small"
          onClick={refreshMentions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Loading and Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message || 'An error occurred while fetching mentions.'}
        </Alert>
      )}

      {/* No Mentions */}
      {!loading && !error && mentions.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            You have no mentions
          </Typography>
        </Box>
      )}

      {/* Pending Mentions */}
      {!loading && !error && pendingMentions.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'medium' }}>
            Pending Mentions ({pendingMentions.length})
          </Typography>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {pendingMentions.map((mention) => (
              <React.Fragment key={mention.id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => handleResolveMention(mention.id)}
                      sx={{ mt: 1 }}
                    >
                      Resolve
                    </Button>
                  }
                  sx={{ py: 1.5 }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {mention.mentionedBy}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          mentioned you in
                        </Typography>
                        <Chip
                          label={mention.taskId}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {mention.taskName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(mention.mentionedAt)}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {/* Resolved Mentions */}
      {!loading && !error && resolvedMentions.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'medium' }}>
            Resolved Mentions ({resolvedMentions.length})
          </Typography>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {resolvedMentions.map((mention) => (
              <React.Fragment key={mention.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ py: 1.5, opacity: 0.7 }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {mention.mentionedBy}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          mentioned you in
                        </Typography>
                        <Chip
                          label={mention.taskId}
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {mention.taskName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(mention.mentionedAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <CheckCircleIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main', fontSize: '1rem' }} />
                          <Typography variant="body2" color="success.main">
                            Resolved {mention.resolvedAt ? `on ${formatDate(mention.resolvedAt)}` : ''}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default UserMentionsPanel;

