import React, { useState, useEffect } from 'react';
import { TaskSuggestion } from '../../types/ai';
import './SuggestionNotification.css';

interface SuggestionNotificationProps {
  suggestion: TaskSuggestion;
  onDismiss: () => void;
  onAccept: (suggestion: TaskSuggestion) => void;
  onReject: (suggestion: TaskSuggestion) => void;
}

/**
 * Component that displays a non-intrusive notification for AI task suggestions
 */
const SuggestionNotification: React.FC<SuggestionNotificationProps> = ({
  suggestion,
  onDismiss,
  onAccept,
  onReject
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Animate in the notification
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss after 30 seconds if not interacted with
    const timer = setTimeout(() => {
      if (!isExpanded) {
        handleDismiss();
      }
    }, 30000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(() => onAccept(suggestion), 300);
  };

  const handleReject = () => {
    setIsVisible(false);
    setTimeout(() => onReject(suggestion), 300);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate confidence class based on suggestion confidence level
  const confidenceClass = 
    suggestion.confidence >= 0.8 ? 'high-confidence' :
    suggestion.confidence >= 0.5 ? 'medium-confidence' : 'low-confidence';

  return (
    <div className={`suggestion-notification ${isVisible ? 'visible' : ''}`}>
      <div className="suggestion-header" onClick={toggleExpand}>
        <div className="suggestion-title">
          <span className={`confidence-indicator ${confidenceClass}`}></span>
          <h4>{suggestion.title}</h4>
        </div>
        <div className="suggestion-actions-compact">
          <button className="icon-button expand-button">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="suggestion-details">
          <p>{suggestion.description}</p>
          <div className="suggestion-metadata">
            <span>Priority: {suggestion.priority}</span>
            <span>Type: {suggestion.type}</span>
            {suggestion.suggestedDueDate && (
              <span>Due: {new Date(suggestion.suggestedDueDate).toLocaleDateString()}</span>
            )}
          </div>
          <div className="suggestion-actions">
            <button className="accept-button" onClick={handleAccept}>Accept</button>
            <button className="reject-button" onClick={handleReject}>Not Helpful</button>
            <button className="dismiss-button" onClick={handleDismiss}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionNotification;
