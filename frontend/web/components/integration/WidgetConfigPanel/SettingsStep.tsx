import React from 'react';
import { WidgetConfig } from './types';

interface SettingsStepProps {
  config: WidgetConfig;
  onChange: (updates: Partial<WidgetConfig>) => void;
  errors: Record<string, string>;
}

/**
 * Settings Configuration Step
 * Allows configuration of advanced widget settings and permissions
 */
const SettingsStep: React.FC<SettingsStepProps> = ({
  config,
  onChange,
  errors
}) => {
  // Handle settings change
  const handleSettingsChange = (key: string, value: any) => {
    onChange({
      settings: {
        ...(config.settings || {}),
        [key]: value
      }
    });
  };
  
  // Handle permissions change
  const handlePermissionsChange = (type: 'canView' | 'canEdit', value: string) => {
    const permissions = {
      ...(config.permissions || { canView: [], canEdit: [] })
    };
    
    // Split by commas and trim whitespace
    const roles = value.split(',').map(role => role.trim()).filter(Boolean);
    
    permissions[type] = roles;
    
    onChange({ permissions });
  };
  
  return (
    <div className="widget-config-step settings-step">
      <h3 className="step-title">Advanced Settings</h3>
      
      {/* General Settings */}
      <div className="settings-section">
        <h4>General Settings</h4>
        
        <div className="form-group">
          <label htmlFor="widget-id">Widget ID</label>
          <input
            id="widget-id"
            type="text"
            value={config.id}
            readOnly
            className="readonly"
          />
          <div className="input-help">
            Unique identifier for this widget (automatically generated)
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="export-enabled">Export Options</label>
          <div className="checkbox-wrapper">
            <input
              id="export-enabled"
              type="checkbox"
              checked={config.settings?.exportEnabled !== false}
              onChange={(e) => handleSettingsChange('exportEnabled', e.target.checked)}
            />
            <span className="checkbox-label">Enable data export</span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="fullscreen-enabled">Fullscreen Mode</label>
          <div className="checkbox-wrapper">
            <input
              id="fullscreen-enabled"
              type="checkbox"
              checked={config.settings?.fullscreenEnabled !== false}
              onChange={(e) => handleSettingsChange('fullscreenEnabled', e.target.checked)}
            />
            <span className="checkbox-label">Enable fullscreen mode</span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="show-title">Widget Title</label>
          <div className="checkbox-wrapper">
            <input
              id="show-title"
              type="checkbox"
              checked={config.settings?.showTitle !== false}
              onChange={(e) => handleSettingsChange('showTitle', e.target.checked)}
            />
            <span className="checkbox-label">Show widget title</span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="cache-duration">Cache Duration (seconds)</label>
          <input
            id="cache-duration"
            type="number"
            min="0"
            step="60"
            value={config.settings?.cacheDuration || 300}
            onChange={(e) => handleSettingsChange('cacheDuration', parseInt(e.target.value, 10))}
          />
          <div className="input-help">
            Duration to cache data in seconds (0 = no caching)
          </div>
        </div>
      </div>
      
      {/* Layout Settings */}
      <div className="settings-section">
        <h4>Layout Settings</h4>
        
        <div className="form-group">
          <label htmlFor="min-height">Minimum Height (px)</label>
          <input
            id="min-height"
            type="number"
            min="0"
            value={config.settings?.minHeight || 200}
            onChange={(e) => handleSettingsChange('minHeight', parseInt(e.target.value, 10))}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="max-height">Maximum Height (px)</label>
          <input
            id="max-height"
            type="number"
            min="0"
            value={config.settings?.maxHeight || 800}
            onChange={(e) => handleSettingsChange('maxHeight', parseInt(e.target.value, 10))}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="padding">Padding (px)</label>
          <input
            id="padding"
            type="number"
            min="0"
            max="50"
            value={config.settings?.padding || 16}
            onChange={(e) => handleSettingsChange('padding', parseInt(e.target.value, 10))}
          />
        </div>
      </div>
      
      {/* Permissions */}
      <div className="settings-section">
        <h4>Permissions</h4>
        
        <div className="form-group">
          <label htmlFor="can-view">Who can view this widget</label>
          <input
            id="can-view"
            type="text"
            value={(config.permissions?.canView || []).join(', ')}
            onChange={(e) => handlePermissionsChange('canView', e.target.value)}
            placeholder="Enter roles or user IDs (comma separated)"
          />
          <div className="input-help">
            Leave empty to allow all users to view this widget
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="can-edit">Who can edit this widget</label>
          <input
            id="can-edit"
            type="text"
            value={(config.permissions?.canEdit || []).join(', ')}
            onChange={(e) => handlePermissionsChange('canEdit', e.target.value)}
            placeholder="Enter roles or user IDs (comma separated)"
          />
          <div className="input-help">
            Leave empty to allow only administrators to edit this widget
          </div>
        </div>
      </div>
      
      {/* Custom CSS */}
      <div className="settings-section">
        <h4>Custom CSS (Advanced)</h4>
        
        <div className="form-group">
          <label htmlFor="custom-css">Custom CSS</label>
          <textarea
            id="custom-css"
            value={config.settings?.customCss || ''}
            onChange={(e) => handleSettingsChange('customCss', e.target.value)}
            placeholder=".widget-container { /* custom styles */ }"
            rows={5}
          />
          <div className="input-help">
            Add custom CSS styles for this widget (advanced users only)
          </div>
        </div>
      </div>
      
      <style>{`
        .widget-config-step {
          padding: 16px 0;
        }
        
        .step-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .settings-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #eee;
        }
        
        .settings-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        h4 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 16px;
          color: #333;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group input.readonly {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .form-group textarea {
          font-family: monospace;
          min-height: 100px;
        }
        
        .input-help {
          color: #666;
          font-size: 12px;
          margin-top: 4px;
        }
        
        .checkbox-wrapper {
          display: flex;
          align-items: center;
        }
        
        .checkbox-wrapper input {
          width: auto;
          margin-right: 8px;
        }
        
        .checkbox-label {
          font-size: 14px;
        }
        
        .error-message {
          color: #f44336;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default SettingsStep;
