import React, { useState, useEffect } from 'react';
import SuggestionNotification from './SuggestionNotification';
import SuggestionPanel from './SuggestionPanel';
import { TaskSuggestion } from '../../types/ai';
import './SuggestionContainer.css';

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
        .filter(suggestion => suggestion.confidence >= 0.7)
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
          type: suggestion.type,
          suggestedById: 'ai-assistant',
          originalSuggestionId: suggestion.id
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
    <div className="suggestion-container">
      {/* Notification area */}
      <div className="suggestion-notifications-container">
        {activeNotifications.map(suggestion => (
          <SuggestionNotification
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => handleAcceptSuggestion(suggestion)}
            onReject={() => handleRejectSuggestion(suggestion)}
            onDismiss={() => handleDismissNotification(suggestion)}
            onFeedback={(isHelpful, feedback) => submitFeedback(suggestion.id, isHelpful, feedback)}
          />
        ))}
      </div>
      
      {/* Suggestion panel for all suggestions */}
      {showPanel && (
        <SuggestionPanel
          suggestions={suggestions}
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
          onFeedback={submitFeedback}
        />
      )}
      
      {/* Floating action button to toggle panel */}
      <button 
        className={`suggestion-fab ${showPanel ? 'active' : ''}`}
        onClick={togglePanel}
        aria-label={showPanel ? 'Hide suggestions' : 'Show suggestions'}
      >
        <i className={`icon-${showPanel ? 'close' : 'lightbulb'}`}></i>
        {!showPanel && suggestions.length > 0 && (
          <span className="suggestion-count">{suggestions.length}</span>
        )}
      </button>
      
      {/* Error message if applicable */}
      {error && (
        <div className="suggestion-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default SuggestionContainer;
