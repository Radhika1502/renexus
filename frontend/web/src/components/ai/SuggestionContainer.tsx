import React, { useState, useEffect } from 'react';
import SuggestionNotification from './SuggestionNotification';
import SuggestionPanel from './SuggestionPanel';
import { TaskSuggestion } from '../../types/ai';
import './SuggestionContainer.css';
import { SuggestionCard } from './SuggestionCard';
import { Box, Typography, Paper } from '@mui/material';

interface SuggestionContainerProps {
  userId: string;
  maxNotifications?: number;
}

/**
 * Container component that manages AI task suggestions and their presentation
 * Handles fetching suggestions, displaying notifications, and managing the suggestion panel
 */
const SuggestionContainer: React.FC<SuggestionContainerProps> = ({
  userId,
  maxNotifications = 3
}) => {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<TaskSuggestion[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch suggestions on component mount and when userId changes
  useEffect(() => {
    fetchSuggestions();
    
    // Set up polling for new suggestions every 5 minutes
    const intervalId = setInterval(fetchSuggestions, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Fetch suggestions from API
  const fetchSuggestions = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ai/task-suggestions?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSuggestions(data);
      
      // Update active notifications with high confidence suggestions
      const highConfidenceSuggestions = data
        .filter((suggestion: TaskSuggestion) => suggestion.confidence >= 0.7)
        .slice(0, maxNotifications);
      
      setActiveNotifications(highConfidenceSuggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle accepting a suggestion
  const handleAcceptSuggestion = async (suggestion: TaskSuggestion) => {
    try {
      // Remove from active notifications
      setActiveNotifications(activeNotifications.filter(s => s.id !== suggestion.id));
      
      // Submit feedback
      await submitFeedback(suggestion.id, true);
      
      // Convert suggestion to task
      await createTaskFromSuggestion(suggestion);
      
      // Remove from all suggestions
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept suggestion');
    }
  };

  // Handle rejecting a suggestion
  const handleRejectSuggestion = async (suggestion: TaskSuggestion) => {
    try {
      // Remove from active notifications
      setActiveNotifications(activeNotifications.filter(s => s.id !== suggestion.id));
      
      // Submit feedback
      await submitFeedback(suggestion.id, false);
      
      // Remove from all suggestions
      setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject suggestion');
    }
  };

  // Handle dismissing a notification
  const handleDismissNotification = (suggestion: TaskSuggestion) => {
    setActiveNotifications(activeNotifications.filter(s => s.id !== suggestion.id));
  };

  // Submit feedback for a suggestion
  const submitFeedback = async (suggestionId: string, isHelpful: boolean, feedback?: string) => {
    try {
      const response = await fetch('/api/ai/task-suggestions/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestionId,
          userId,
          isHelpful,
          feedback
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  // Create a task from a suggestion
  const createTaskFromSuggestion = async (suggestion: TaskSuggestion) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority.toLowerCase(),
          dueDate: suggestion.suggestedDueDate,
          suggestedById: 'ai-assistant',
          originalSuggestionId: suggestion.id,
          tags: suggestion.tags
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error creating task from suggestion:', err);
      throw err;
    }
  };

  // Toggle the suggestion panel
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  // View all suggestions
  const handleViewAllSuggestions = () => {
    setShowPanel(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        AI Task Suggestions
      </Typography>
      <Box sx={{ mt: 2 }}>
        {suggestions.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No suggestions available at the moment.
          </Typography>
        ) : (
          suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

export default SuggestionContainer;

