import React from 'react';
import { WidgetConfig, WidgetType, WidgetSize } from './types';

interface BasicInfoStepProps {
  config: WidgetConfig;
  onChange: (updates: Partial<WidgetConfig>) => void;
  errors: Record<string, string>;
}

/**
 * Basic Information Configuration Step
 * Allows setting of widget title, type, and size
 */
const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  config,
  onChange,
  errors
}) => {
  // Available widget types
  const widgetTypes: Array<{ value: WidgetType; label: string }> = [
    { value: 'chart', label: 'Chart' },
    { value: 'metric', label: 'Metric' },
    { value: 'table', label: 'Table' },
    { value: 'list', label: 'List' },
    { value: 'timeline', label: 'Timeline' },
    { value: 'map', label: 'Map' },
    { value: 'custom', label: 'Custom' }
  ];
  
  // Available widget sizes
  const widgetSizes: Array<{ value: WidgetSize; label: string; description: string }> = [
    { value: 'small', label: 'Small', description: '1x1' },
    { value: 'medium', label: 'Medium', description: '2x1' },
    { value: 'large', label: 'Large', description: '2x2' },
    { value: 'wide', label: 'Wide', description: '3x1' },
    { value: 'tall', label: 'Tall', description: '1x2' },
    { value: 'full', label: 'Full', description: '3x2' }
  ];
  
  return (
    <div className="widget-config-step basic-info-step">
      <h3 className="step-title">Basic Information</h3>
      
      <div className="form-group">
        <label htmlFor="widget-title">Widget Title</label>
        <input
          id="widget-title"
          type="text"
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Enter widget title"
          className={errors.title ? 'error' : ''}
          maxLength={50}
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
        <div className="input-help">
          {config.title.length}/50 characters
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="widget-type">Widget Type</label>
        <select
          id="widget-type"
          value={config.type}
          onChange={(e) => onChange({ type: e.target.value as WidgetType })}
          className={errors.type ? 'error' : ''}
        >
          {widgetTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.type && <div className="error-message">{errors.type}</div>}
        <div className="input-help">
          {getWidgetTypeDescription(config.type)}
        </div>
      </div>
      
      <div className="form-group">
        <label>Widget Size</label>
        <div className="size-options">
          {widgetSizes.map((size) => (
            <div
              key={size.value}
              className={`size-option ${config.size === size.value ? 'selected' : ''}`}
              onClick={() => onChange({ size: size.value })}
            >
              <div className={`size-preview size-${size.value}`}></div>
              <div className="size-label">
                <span>{size.label}</span>
                <span className="size-description">{size.description}</span>
              </div>
            </div>
          ))}
        </div>
        {errors.size && <div className="error-message">{errors.size}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="refresh-interval">Auto-Refresh Interval (seconds)</label>
        <select
          id="refresh-interval"
          value={config.refreshInterval?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value;
            onChange({ refreshInterval: value ? parseInt(value, 10) : undefined });
          }}
        >
          <option value="">No auto-refresh</option>
          <option value="30">30 seconds</option>
          <option value="60">1 minute</option>
          <option value="300">5 minutes</option>
          <option value="600">10 minutes</option>
          <option value="1800">30 minutes</option>
          <option value="3600">1 hour</option>
        </select>
      </div>
      
      <style jsx>{`
        .widget-config-step {
          padding: 16px 0;
        }
        
        .step-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group input.error,
        .form-group select.error {
          border-color: #f44336;
        }
        
        .error-message {
          color: #f44336;
          font-size: 12px;
          margin-top: 4px;
        }
        
        .input-help {
          color: #666;
          font-size: 12px;
          margin-top: 4px;
        }
        
        .size-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 8px;
        }
        
        .size-option {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .size-option:hover {
          border-color: #aaa;
        }
        
        .size-option.selected {
          border-color: #4a6cf7;
          background-color: rgba(74, 108, 247, 0.05);
        }
        
        .size-preview {
          background-color: #e0e0e0;
          margin-bottom: 8px;
        }
        
        .size-small {
          width: 40px;
          height: 40px;
        }
        
        .size-medium {
          width: 80px;
          height: 40px;
        }
        
        .size-large {
          width: 80px;
          height: 80px;
        }
        
        .size-wide {
          width: 120px;
          height: 40px;
        }
        
        .size-tall {
          width: 40px;
          height: 80px;
        }
        
        .size-full {
          width: 120px;
          height: 80px;
        }
        
        .size-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 14px;
        }
        
        .size-description {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};

/**
 * Get description for widget type
 * @param type Widget type
 * @returns Description text
 */
function getWidgetTypeDescription(type: WidgetType): string {
  switch (type) {
    case 'chart':
      return 'Visualize data using various chart types like bar, line, or pie charts';
    case 'metric':
      return 'Display a single key metric with optional comparison to previous period';
    case 'table':
      return 'Show data in a tabular format with sorting and pagination';
    case 'list':
      return 'Display data in a simple list format';
    case 'timeline':
      return 'Show events or data points along a time axis';
    case 'map':
      return 'Visualize geographical data on a map';
    case 'custom':
      return 'Create a custom widget with specialized functionality';
    default:
      return '';
  }
}

export default BasicInfoStep;
