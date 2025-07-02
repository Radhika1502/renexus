import React, { useState, useEffect, useCallback } from 'react';
import aiInsightsService from '../../services/analytics/ai-insights';

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'correlation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  relatedMetrics: string[];
  timestamp: string;
  actions?: InsightAction[];
  metadata?: Record<string, any>;
}

interface InsightAction {
  label: string;
  type: 'link' | 'function' | 'filter';
  value: string;
  description?: string;
}

interface AIAnalyticsInsightsProps {
  dataType: 'performance' | 'tasks' | 'collaboration' | 'time' | 'workload';
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters?: Record<string, any>;
  userId?: string;
  teamId?: string;
  projectId?: string;
  onInsightAction?: (action: InsightAction) => void;
  onInsightDismiss?: (insightId: string) => void;
  maxInsights?: number;
  className?: string;
}

/**
 * AI Analytics Insights component
 * Displays AI-generated insights, recommendations, and anomaly detections
 * for analytics data
 */
const AIAnalyticsInsights: React.FC<AIAnalyticsInsightsProps> = ({
  dataType,
  timeRange,
  filters = {},
  userId,
  teamId,
  projectId,
  onInsightAction,
  onInsightDismiss,
  maxInsights = 5,
  className
}) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  
  // Fetch insights from AI service
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedInsights = await aiInsightsService.getInsights({
        dataType,
        timeRange,
        filters,
        userId,
        teamId,
        projectId,
        limit: maxInsights * 2 // Fetch extra to account for dismissed insights
      });
      
      setInsights(fetchedInsights);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError('Failed to load insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [dataType, timeRange, filters, userId, teamId, projectId, maxInsights]);
  
  // Fetch insights on initial render and when dependencies change
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);
  
  // Handle insight action click
  const handleActionClick = (action: InsightAction) => {
    if (onInsightAction) {
      onInsightAction(action);
    } else {
      // Default handling for common action types
      if (action.type === 'link' && action.value) {
        window.open(action.value, '_blank');
      }
    }
  };
  
  // Handle insight dismiss
  const handleDismiss = (insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
    
    if (onInsightDismiss) {
      onInsightDismiss(insightId);
    }
  };
  
  // Toggle expanded insight
  const toggleExpand = (insightId: string) => {
    setExpandedInsight(prev => prev === insightId ? null : insightId);
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#2196f3';
    }
  };
  
  // Get icon for insight type
  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return '📈';
      case 'anomaly':
        return '⚠️';
      case 'recommendation':
        return '💡';
      case 'prediction':
        return '🔮';
      case 'correlation':
        return '🔗';
      default:
        return 'ℹ️';
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Filter out dismissed insights and limit to maxInsights
  const visibleInsights = insights
    .filter(insight => !dismissedInsights.has(insight.id))
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                          priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by confidence (higher first)
      return b.confidence - a.confidence;
    })
    .slice(0, maxInsights);
  
  return (
    <div className={`ai-analytics-insights ${className || ''}`}>
      <div className="insights-header">
        <h3>AI Insights</h3>
        <button 
          className="refresh-button"
          onClick={fetchInsights}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!loading && visibleInsights.length === 0 && !error && (
        <div className="no-insights">
          <p>No insights available for the current data.</p>
          <p>Try changing filters or time range.</p>
        </div>
      )}
      
      <div className="insights-list">
        {visibleInsights.map(insight => (
          <div 
            key={insight.id} 
            className={`insight-card ${expandedInsight === insight.id ? 'expanded' : ''}`}
          >
            <div className="insight-header" onClick={() => toggleExpand(insight.id)}>
              <div className="insight-type-icon">
                {getInsightTypeIcon(insight.type)}
              </div>
              <div className="insight-title-container">
                <h4 className="insight-title">{insight.title}</h4>
                <div className="insight-meta">
                  <span 
                    className="insight-priority"
                    style={{ backgroundColor: getPriorityColor(insight.priority) }}
                  >
                    {insight.priority}
                  </span>
                  <span className="insight-confidence">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              <div className="insight-actions">
                <button 
                  className="dismiss-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(insight.id);
                  }}
                  title="Dismiss"
                >
                  ×
                </button>
                <button 
                  className="expand-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(insight.id);
                  }}
                  title={expandedInsight === insight.id ? 'Collapse' : 'Expand'}
                >
                  {expandedInsight === insight.id ? '▲' : '▼'}
                </button>
              </div>
            </div>
            
            {expandedInsight === insight.id && (
              <div className="insight-details">
                <p className="insight-description">{insight.description}</p>
                
                {insight.relatedMetrics.length > 0 && (
                  <div className="related-metrics">
                    <strong>Related Metrics:</strong>
                    <div className="metrics-tags">
                      {insight.relatedMetrics.map((metric, index) => (
                        <span key={index} className="metric-tag">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {insight.actions && insight.actions.length > 0 && (
                  <div className="insight-action-buttons">
                    {insight.actions.map((action, index) => (
                      <button 
                        key={index}
                        className={`action-button action-${action.type}`}
                        onClick={() => handleActionClick(action)}
                        title={action.description}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="insight-timestamp">
                  Generated: {formatTimestamp(insight.timestamp)}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading insights...</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .ai-analytics-insights {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .insights-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .insights-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .refresh-button {
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          color: #333;
          transition: all 0.2s ease;
        }
        
        .refresh-button:hover {
          background-color: #f5f5f5;
        }
        
        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .no-insights {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 14px;
        }
        
        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .insight-card {
          border: 1px solid #eee;
          border-radius: 6px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .insight-card.expanded {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .insight-header {
          display: flex;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          background-color: #f9f9f9;
          transition: background-color 0.2s ease;
        }
        
        .insight-header:hover {
          background-color: #f0f0f0;
        }
        
        .insight-type-icon {
          font-size: 20px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .insight-title-container {
          flex: 1;
        }
        
        .insight-title {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .insight-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .insight-priority {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
          color: white;
          text-transform: capitalize;
        }
        
        .insight-confidence {
          font-size: 12px;
          color: #666;
        }
        
        .insight-actions {
          display: flex;
          gap: 8px;
        }
        
        .dismiss-button,
        .expand-button {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #666;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .dismiss-button:hover,
        .expand-button:hover {
          background-color: #e0e0e0;
        }
        
        .insight-details {
          padding: 16px;
          border-top: 1px solid #eee;
        }
        
        .insight-description {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .related-metrics {
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .metrics-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
        
        .metric-tag {
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .insight-action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .action-button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .action-button:hover {
          background-color: #3a5ce5;
        }
        
        .action-link {
          background-color: #4a6cf7;
        }
        
        .action-function {
          background-color: #4caf50;
        }
        
        .action-filter {
          background-color: #ff9800;
        }
        
        .insight-timestamp {
          font-size: 12px;
          color: #999;
          text-align: right;
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }
        
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4a6cf7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIAnalyticsInsights;
