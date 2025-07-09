import React, { useState, useEffect } from 'react';
import './TimeTrackingVisualization.css';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  category: string;
  projectId: string;
  projectName: string;
}

interface TimeTrackingVisualizationProps {
  timeEntries: TimeEntry[];
  startDate: Date;
  endDate: Date;
  userId?: string;
  projectId?: string;
}

/**
 * Component for visualizing time tracking data with interactive filtering
 */
const TimeTrackingVisualization: React.FC<TimeTrackingVisualizationProps> = ({
  timeEntries,
  startDate,
  endDate,
  userId,
  projectId
}) => {
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'project' | 'category'>('day');
  const [view, setView] = useState<'timeline' | 'bar' | 'pie'>('timeline');
  const [dateRange, setDateRange] = useState({ start: startDate, end: endDate });
  const [isLoading, setIsLoading] = useState(false);

  // Filter entries based on props and state
  useEffect(() => {
    setIsLoading(true);
    
    // Apply filters
    let filtered = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return (
        entryDate >= dateRange.start &&
        entryDate <= dateRange.end &&
        (!userId || entry.userId === userId) &&
        (!projectId || entry.projectId === projectId)
      );
    });
    
    setFilteredEntries(filtered);
    setIsLoading(false);
  }, [timeEntries, dateRange, userId, projectId]);

  // Group data based on selected grouping
  const groupedData = React.useMemo(() => {
    const result: Record<string, { totalMinutes: number, entries: TimeEntry[] }> = {};
    
    filteredEntries.forEach(entry => {
      let key = '';
      
      switch (groupBy) {
        case 'day':
          key = new Date(entry.startTime).toISOString().split('T')[0];
          break;
        case 'week':
          const date = new Date(entry.startTime);
          const firstDayOfWeek = new Date(date);
          const day = date.getDay() || 7; // Convert Sunday (0) to 7
          firstDayOfWeek.setDate(date.getDate() - day + 1); // First day is Monday
          key = firstDayOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${new Date(entry.startTime).getFullYear()}-${String(new Date(entry.startTime).getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'project':
          key = entry.projectName;
          break;
        case 'category':
          key = entry.category;
          break;
      }
      
      if (!result[key]) {
        result[key] = { totalMinutes: 0, entries: [] };
      }
      
      result[key].totalMinutes += entry.duration;
      result[key].entries.push(entry);
    });
    
    return result;
  }, [filteredEntries, groupBy]);

  // Format minutes as hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle date range change
  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  // Render timeline view
  const renderTimeline = () => {
    return (
      <div className="timeline-container">
        <div className="timeline-header">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="timeline-hour">{i}:00</div>
          ))}
        </div>
        
        <div className="timeline-entries">
          {Object.entries(groupedData).map(([date, { entries }]) => (
            <div key={date} className="timeline-day">
              <div className="timeline-day-label">{formatDateLabel(date)}</div>
              <div className="timeline-day-entries">
                {entries.map(entry => {
                  const startHour = new Date(entry.startTime).getHours() + (new Date(entry.startTime).getMinutes() / 60);
                  const endHour = entry.endTime 
                    ? new Date(entry.endTime).getHours() + (new Date(entry.endTime).getMinutes() / 60)
                    : startHour + (entry.duration / 60);
                  const width = (endHour - startHour) * (100 / 24); // % of 24 hours
                  const left = startHour * (100 / 24); // % position in 24 hours
                  
                  return (
                    <div 
                      key={entry.id}
                      className="timeline-entry"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: getColorForCategory(entry.category)
                      }}
                      title={`${entry.taskTitle} (${formatDuration(entry.duration)})`}
                    >
                      <span className="timeline-entry-label">{entry.taskTitle}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render bar chart view
  const renderBarChart = () => {
    const sortedData = Object.entries(groupedData).sort((a, b) => {
      if (groupBy === 'day' || groupBy === 'week' || groupBy === 'month') {
        return a[0].localeCompare(b[0]);
      }
      return b[1].totalMinutes - a[1].totalMinutes;
    });
    
    const maxMinutes = Math.max(...sortedData.map(([_, { totalMinutes }]) => totalMinutes));
    
    return (
      <div className="bar-chart-container">
        {sortedData.map(([key, { totalMinutes }]) => (
          <div key={key} className="bar-chart-item">
            <div className="bar-chart-label">{formatDateLabel(key)}</div>
            <div className="bar-chart-bar-container">
              <div 
                className="bar-chart-bar"
                style={{ 
                  width: `${(totalMinutes / maxMinutes) * 100}%`,
                  backgroundColor: getColorForKey(key)
                }}
              ></div>
              <span className="bar-chart-value">{formatDuration(totalMinutes)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render pie chart view
  const renderPieChart = () => {
    const sortedData = Object.entries(groupedData).sort((a, b) => b[1].totalMinutes - a[1].totalMinutes);
    const total = sortedData.reduce((sum, [_, { totalMinutes }]) => sum + totalMinutes, 0);
    
    let currentAngle = 0;
    
    return (
      <div className="pie-chart-container">
        <svg viewBox="0 0 100 100" className="pie-chart">
          <circle cx="50" cy="50" r="45" fill="#f8f9fa" />
          
          {sortedData.map(([key, { totalMinutes }], index) => {
            const percentage = (totalMinutes / total) * 100;
            const angle = (percentage / 100) * 360;
            
            // Calculate the SVG arc path
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            
            const startX = 50 + 45 * Math.cos((startAngle - 90) * (Math.PI / 180));
            const startY = 50 + 45 * Math.sin((startAngle - 90) * (Math.PI / 180));
            const endX = 50 + 45 * Math.cos((endAngle - 90) * (Math.PI / 180));
            const endY = 50 + 45 * Math.sin((endAngle - 90) * (Math.PI / 180));
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${startX} ${startY}`,
              `A 45 45 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`
            ].join(' ');
            
            return (
              <path
                key={key}
                d={pathData}
                fill={getColorForKey(key, index)}
                stroke="#ffffff"
                strokeWidth="0.5"
              >
                <title>{`${formatDateLabel(key)}: ${formatDuration(totalMinutes)} (${percentage.toFixed(1)}%)`}</title>
              </path>
            );
          })}
        </svg>
        
        <div className="pie-chart-legend">
          {sortedData.map(([key, { totalMinutes }], index) => {
            const percentage = (totalMinutes / total) * 100;
            
            return (
              <div key={key} className="pie-chart-legend-item">
                <div 
                  className="pie-chart-legend-color"
                  style={{ backgroundColor: getColorForKey(key, index) }}
                ></div>
                <div className="pie-chart-legend-label">{formatDateLabel(key)}</div>
                <div className="pie-chart-legend-value">
                  {formatDuration(totalMinutes)} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper function to format date labels based on grouping
  const formatDateLabel = (key: string): string => {
    switch (groupBy) {
      case 'day':
        return new Date(key).toLocaleDateString();
      case 'week':
        const weekStart = new Date(key);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      case 'month':
        const [year, month] = key.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      default:
        return key;
    }
  };

  // Helper function to get color for category
  const getColorForCategory = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'Development': '#4285f4',
      'Design': '#ea4335',
      'Meeting': '#fbbc05',
      'Planning': '#34a853',
      'Research': '#9c27b0',
      'Documentation': '#ff9800',
      'Testing': '#795548',
      'Other': '#607d8b'
    };
    
    return categoryColors[category] || '#607d8b';
  };

  // Helper function to get color for key
  const getColorForKey = (key: string, index = 0): string => {
    if (groupBy === 'category') {
      return getColorForCategory(key);
    }
    
    // Color palette for other groupings
    const colors = [
      '#4285f4', '#ea4335', '#fbbc05', '#34a853', '#9c27b0',
      '#ff9800', '#795548', '#607d8b', '#3f51b5', '#e91e63'
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div className="time-tracking-visualization">
      <div className="visualization-controls">
        <div className="control-group">
          <label>Group By:</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="project">Project</option>
            <option value="category">Category</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>View:</label>
          <div className="view-toggle">
            <button 
              className={`view-toggle-button ${view === 'timeline' ? 'active' : ''}`}
              onClick={() => setView('timeline')}
            >
              Timeline
            </button>
            <button 
              className={`view-toggle-button ${view === 'bar' ? 'active' : ''}`}
              onClick={() => setView('bar')}
            >
              Bar Chart
            </button>
            <button 
              className={`view-toggle-button ${view === 'pie' ? 'active' : ''}`}
              onClick={() => setView('pie')}
            >
              Pie Chart
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <label>Date Range:</label>
          <div className="date-range-inputs">
            <input 
              type="date" 
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange(new Date(e.target.value), dateRange.end)}
            />
            <span>to</span>
            <input 
              type="date" 
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange(dateRange.start, new Date(e.target.value))}
            />
          </div>
        </div>
      </div>
      
      <div className="visualization-content">
        {isLoading ? (
          <div className="loading-indicator">Loading data...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="no-data-message">No time entries found for the selected filters.</div>
        ) : (
          <>
            {view === 'timeline' && renderTimeline()}
            {view === 'bar' && renderBarChart()}
            {view === 'pie' && renderPieChart()}
          </>
        )}
      </div>
      
      <div className="visualization-summary">
        <div className="summary-item">
          <span className="summary-label">Total Time:</span>
          <span className="summary-value">
            {formatDuration(
              Object.values(groupedData).reduce((sum, { totalMinutes }) => sum + totalMinutes, 0)
            )}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Entries:</span>
          <span className="summary-value">{filteredEntries.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Period:</span>
          <span className="summary-value">
            {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingVisualization;
