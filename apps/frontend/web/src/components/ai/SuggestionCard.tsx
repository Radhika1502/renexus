import React, { useState } from 'react';
import { TaskSuggestion  } from "../../../shared/types/ai";
import './SuggestionCard.css';

interface SuggestionCardProps {
  suggestion: TaskSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onFeedback: (isHelpful: boolean, feedback?: string) => void;
}

/**
 * Card component for displaying individual task suggestions with accept/reject actions
 */
const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  onFeedback
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);

  const handleAccept = () => {
    onAccept();
  };

  const handleReject = () => {
    onReject();
  };

  const toggleFeedbackForm = () => {
    setShowFeedbackForm(!showFeedbackForm);
  };

  const submitFeedback = () => {
    if (isHelpful !== null) {
      onFeedback(isHelpful, feedbackText);
      setShowFeedbackForm(false);
      setFeedbackText('');
      setIsHelpful(null);
    }
  };

  // Format the due date if it exists
  const formattedDueDate = suggestion.suggestedDueDate 
    ? new Date(suggestion.suggestedDueDate).toLocaleDateString() 
    : 'Not specified';

  // Determine priority class for styling
  const priorityClass = 
    suggestion.priority === 'High' ? 'priority-high' :
    suggestion.priority === 'Medium' ? 'priority-medium' : 'priority-low';

  // Determine confidence class for styling
  const confidenceClass = 
    suggestion.confidence >= 0.8 ? 'confidence-high' :
    suggestion.confidence >= 0.5 ? 'confidence-medium' : 'confidence-low';

  // Format confidence as percentage
  const confidencePercentage = Math.round(suggestion.confidence * 100);

  return (
    <div className="suggestion-card">
      <div className="suggestion-card-header">
        <h4 className="suggestion-card-title">{suggestion.title}</h4>
        <span className={`suggestion-card-priority ${priorityClass}`}>
          {suggestion.priority}
        </span>
      </div>
      
      <p className="suggestion-card-description">{suggestion.description}</p>
      
      <div className="suggestion-card-metadata">
        <div className="metadata-item">
          <span className="metadata-label">Type:</span>
          <span className="metadata-value">{suggestion.type}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Due:</span>
          <span className="metadata-value">{formattedDueDate}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Confidence:</span>
          <div className={`confidence-bar ${confidenceClass}`}>
            <div className="confidence-fill" style={{ width: `${confidencePercentage}%` }}></div>
            <span className="confidence-text">{confidencePercentage}%</span>
          </div>
        </div>
      </div>
      
      <div className="suggestion-card-actions">
        <button className="action-button accept-button" onClick={handleAccept}>
          Accept
        </button>
        <button className="action-button reject-button" onClick={handleReject}>
          Reject
        </button>
        <button className="action-button feedback-button" onClick={toggleFeedbackForm}>
          {showFeedbackForm ? 'Cancel' : 'Feedback'}
        </button>
      </div>
      
      {showFeedbackForm && (
        <div className="feedback-form">
          <div className="feedback-options">
            <button 
              className={`feedback-option ${isHelpful === true ? 'selected' : ''}`}
              onClick={() => setIsHelpful(true)}
            >
              Helpful
            </button>
            <button 
              className={`feedback-option ${isHelpful === false ? 'selected' : ''}`}
              onClick={() => setIsHelpful(false)}
            >
              Not Helpful
            </button>
          </div>
          
          <textarea
            className="feedback-textarea"
            placeholder="Additional feedback (optional)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          ></textarea>
          
          <button 
            className="submit-feedback-button"
            disabled={isHelpful === null}
            onClick={submitFeedback}
          >
            Submit Feedback
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestionCard;

