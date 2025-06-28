import React, { useState, useEffect } from 'react';
import { TaskSuggestion } from '../../types/ai';
import SuggestionCard from './SuggestionCard';
import './SuggestionPanel.css';

interface SuggestionPanelProps {
  suggestions: TaskSuggestion[];
  onAccept: (suggestion: TaskSuggestion) => void;
  onReject: (suggestion: TaskSuggestion) => void;
  onFeedback: (suggestionId: string, isHelpful: boolean, feedback?: string) => void;
}

/**
 * Collapsible panel that displays AI task suggestions
 */
const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  suggestions,
  onAccept,
  onReject,
  onFeedback
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [activeSuggestions, setActiveSuggestions] = useState<TaskSuggestion[]>(suggestions);

  useEffect(() => {
    setActiveSuggestions(suggestions);
  }, [suggestions]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAccept = (suggestion: TaskSuggestion) => {
    onAccept(suggestion);
    setActiveSuggestions(activeSuggestions.filter(s => s.id !== suggestion.id));
    onFeedback(suggestion.id, true);
  };

  const handleReject = (suggestion: TaskSuggestion) => {
    onReject(suggestion);
    setActiveSuggestions(activeSuggestions.filter(s => s.id !== suggestion.id));
    onFeedback(suggestion.id, false);
  };

  const handleFeedback = (suggestionId: string, isHelpful: boolean, feedback?: string) => {
    onFeedback(suggestionId, isHelpful, feedback);
  };

  if (!isVisible || activeSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={`suggestion-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="suggestion-panel-header" onClick={toggleExpand}>
        <div className="suggestion-panel-title">
          <i className="icon-lightbulb"></i>
          <h3>AI Task Suggestions ({activeSuggestions.length})</h3>
        </div>
        <div className="suggestion-panel-actions">
          <button className="icon-button" onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}>
            <i className="icon-close"></i>
          </button>
          <button className="icon-button">
            {isExpanded ? <i className="icon-chevron-up"></i> : <i className="icon-chevron-down"></i>}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="suggestion-panel-content">
          <div className="suggestion-list">
            {activeSuggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion)}
                onReject={() => handleReject(suggestion)}
                onFeedback={(isHelpful, feedback) => 
                  handleFeedback(suggestion.id, isHelpful, feedback)
                }
              />
            ))}
          </div>
          
          {activeSuggestions.length === 0 && (
            <div className="no-suggestions">
              <p>No active suggestions at the moment.</p>
            </div>
          )}
          
          <div className="suggestion-panel-footer">
            <button className="text-button">View Suggestion History</button>
            <button className="text-button">Settings</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionPanel;
