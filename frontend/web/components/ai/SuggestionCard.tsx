import React, { useState } from 'react';
import { TaskSuggestion } from "../../types/ai";
import { Card, CardContent, Typography, Button, Chip, Box } from '@mui/material';

interface SuggestionCardProps {
  suggestion: TaskSuggestion;
  onAccept: (suggestion: TaskSuggestion) => void;
  onReject: (suggestion: TaskSuggestion) => void;
}

/**
 * Card component for displaying individual task suggestions with accept/reject actions
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleAccept = () => {
    onAccept(suggestion);
  };

  const handleReject = () => {
    onReject(suggestion);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {suggestion.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {expanded ? suggestion.description : `${suggestion.description.slice(0, 100)}...`}
          <Button size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
        </Typography>
        <Box sx={{ mt: 2, mb: 2 }}>
          <Chip
            label={`Priority: ${suggestion.priority}`}
            color={
              suggestion.priority === 'high'
                ? 'error'
                : suggestion.priority === 'medium'
                ? 'warning'
                : 'success'
            }
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={`${suggestion.estimatedDuration} mins`}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {suggestion.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
        {expanded && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              AI Reasoning:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {suggestion.aiReasoning}
            </Typography>
          </Box>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAccept}
          >
            Accept
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

