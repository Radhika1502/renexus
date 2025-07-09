import React, { useState, useEffect } from 'react';
import { WidgetConfig } from './types';

interface VisualizationStepProps {
  config: WidgetConfig;
  onChange: (updates: Partial<WidgetConfig>) => void;
  previewData: any;
  errors: Record<string, string>;
}

/**
 * Visualization Configuration Step
 * Allows selection and configuration of visualization options
 */
const VisualizationStep: React.FC<VisualizationStepProps> = ({
  config,
  onChange,
  previewData,
  errors
}) => {
  const [selectedColors, setSelectedColors] = useState<string[]>(
    config.visualization.colors || ['#4a6cf7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
  );
  
  // Get available visualization types based on widget type
  const getVisualizationTypes = () => {
    switch (config.type) {
      case 'chart':
        return [
          { value: 'bar', label: 'Bar Chart' },
          { value: 'line', label: 'Line Chart' },
          { value: 'pie', label: 'Pie Chart' },
          { value: 'area', label: 'Area Chart' },
          { value: 'scatter', label: 'Scatter Plot' }
        ];
      case 'metric':
        return [
          { value: 'number', label: 'Number' },
          { value: 'text', label: 'Text' }
        ];
      case 'table':
        return [
          { value: 'table', label: 'Standard Table' },
          { value: 'custom', label: 'Custom Table' }
        ];
      default:
        return [
          { value: 'custom', label: 'Custom' }
        ];
    }
  };
  
  // Get available subtypes based on visualization type
  const getVisualizationSubtypes = () => {
    switch (config.visualization.type) {
      case 'bar':
        return [
          { value: 'standard', label: 'Standard' },
          { value: 'stacked', label: 'Stacked' },
          { value: 'grouped', label: 'Grouped' },
          { value: 'horizontal', label: 'Horizontal' }
        ];
      case 'line':
        return [
          { value: 'standard', label: 'Standard' },
          { value: 'curved', label: 'Curved' },
          { value: 'stepped', label: 'Stepped' }
        ];
      case 'pie':
        return [
          { value: 'standard', label: 'Standard' },
          { value: 'donut', label: 'Donut' },
          { value: 'semi', label: 'Semi-Circle' }
        ];
      case 'area':
        return [
          { value: 'standard', label: 'Standard' },
          { value: 'stacked', label: 'Stacked' }
        ];
      default:
        return [];
    }
  };
  
  // Update visualization options when type changes
  useEffect(() => {
    const subtypes = getVisualizationSubtypes();
    if (subtypes.length > 0 && !config.visualization.subtype) {
      handleVisualizationOptionChange('subtype', subtypes[0].value);
    }
  }, [config.visualization.type]);
  
  // Handle visualization type change
  const handleVisualizationTypeChange = (type: string) => {
    onChange({
      visualization: {
        ...config.visualization,
        type,
        subtype: undefined, // Reset subtype when type changes
        options: {} // Reset options when type changes
      }
    });
  };
  
  // Handle visualization option change
  const handleVisualizationOptionChange = (option: string, value: any) => {
    onChange({
      visualization: {
        ...config.visualization,
        [option]: value
      }
    });
  };
  
  // Handle visualization options change
  const handleOptionsChange = (option: string, value: any) => {
    onChange({
      visualization: {
        ...config.visualization,
        options: {
          ...config.visualization.options,
          [option]: value
        }
      }
    });
  };
  
  // Handle color selection
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...selectedColors];
    newColors[index] = color;
    setSelectedColors(newColors);
    
    onChange({
      visualization: {
        ...config.visualization,
        colors: newColors
      }
    });
  };
  
  // Add a new color
  const handleAddColor = () => {
    const newColors = [...selectedColors, '#000000'];
    setSelectedColors(newColors);
    
    onChange({
      visualization: {
        ...config.visualization,
        colors: newColors
      }
    });
  };
  
  // Remove a color
  const handleRemoveColor = (index: number) => {
    const newColors = selectedColors.filter((_, i) => i !== index);
    setSelectedColors(newColors);
    
    onChange({
      visualization: {
        ...config.visualization,
        colors: newColors
      }
    });
  };
  
  return (
    <div className="widget-config-step visualization-step">
      <h3 className="step-title">Visualization Options</h3>
      
      <div className="form-group">
        <label htmlFor="visualization-type">Visualization Type</label>
        <select
          id="visualization-type"
          value={config.visualization.type}
          onChange={(e) => handleVisualizationTypeChange(e.target.value)}
          className={errors.visualizationType ? 'error' : ''}
        >
          {getVisualizationTypes().map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.visualizationType && <div className="error-message">{errors.visualizationType}</div>}
      </div>
      
      {getVisualizationSubtypes().length > 0 && (
        <div className="form-group">
          <label htmlFor="visualization-subtype">Chart Style</label>
          <select
            id="visualization-subtype"
            value={config.visualization.subtype || ''}
            onChange={(e) => handleVisualizationOptionChange('subtype', e.target.value)}
          >
            {getVisualizationSubtypes().map((subtype) => (
              <option key={subtype.value} value={subtype.value}>
                {subtype.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Chart-specific options */}
      {(config.visualization.type === 'bar' || 
        config.visualization.type === 'line' || 
        config.visualization.type === 'area') && (
        <>
          <div className="form-group">
            <label htmlFor="show-legend">Legend</label>
            <div className="checkbox-wrapper">
              <input
                id="show-legend"
                type="checkbox"
                checked={config.visualization.options?.showLegend !== false}
                onChange={(e) => handleOptionsChange('showLegend', e.target.checked)}
              />
              <span className="checkbox-label">Show legend</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="show-grid">Grid Lines</label>
            <div className="checkbox-wrapper">
              <input
                id="show-grid"
                type="checkbox"
                checked={config.visualization.options?.showGrid !== false}
                onChange={(e) => handleOptionsChange('showGrid', e.target.checked)}
              />
              <span className="checkbox-label">Show grid lines</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="show-labels">Data Labels</label>
            <div className="checkbox-wrapper">
              <input
                id="show-labels"
                type="checkbox"
                checked={!!config.visualization.options?.showDataLabels}
                onChange={(e) => handleOptionsChange('showDataLabels', e.target.checked)}
              />
              <span className="checkbox-label">Show data labels</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="stacked">Stacking</label>
            <div className="checkbox-wrapper">
              <input
                id="stacked"
                type="checkbox"
                checked={!!config.visualization.options?.stacked}
                onChange={(e) => handleOptionsChange('stacked', e.target.checked)}
                disabled={config.visualization.subtype === 'stacked'}
              />
              <span className="checkbox-label">Stack data series</span>
            </div>
          </div>
        </>
      )}
      
      {/* Color palette selection */}
      <div className="form-group">
        <label>Color Palette</label>
        <div className="color-palette">
          {selectedColors.map((color, index) => (
            <div key={index} className="color-item">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className="color-picker"
              />
              {selectedColors.length > 1 && (
                <button
                  type="button"
                  className="remove-color-btn"
                  onClick={() => handleRemoveColor(index)}
                  title="Remove color"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {selectedColors.length < 10 && (
            <button
              type="button"
              className="add-color-btn"
              onClick={handleAddColor}
              title="Add color"
            >
              +
            </button>
          )}
        </div>
      </div>
      
      {/* Additional options based on visualization type */}
      {config.visualization.type === 'pie' && (
        <div className="form-group">
          <label htmlFor="inner-radius">Inner Radius (Donut)</label>
          <input
            id="inner-radius"
            type="range"
            min="0"
            max="90"
            value={config.visualization.options?.innerRadius || 0}
            onChange={(e) => handleOptionsChange('innerRadius', parseInt(e.target.value, 10))}
            disabled={config.visualization.subtype !== 'donut'}
          />
          <div className="range-value">
            {config.visualization.options?.innerRadius || 0}%
          </div>
        </div>
      )}
      
      {/* Preview note */}
      <div className="preview-note">
        <p>
          Preview will update based on your visualization settings and sample data.
          You can adjust these settings at any time.
        </p>
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
        
        .form-group select,
        .form-group input[type="text"],
        .form-group input[type="number"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-group select.error {
          border-color: #f44336;
        }
        
        .error-message {
          color: #f44336;
          font-size: 12px;
          margin-top: 4px;
        }
        
        .checkbox-wrapper {
          display: flex;
          align-items: center;
        }
        
        .checkbox-wrapper input {
          margin-right: 8px;
        }
        
        .checkbox-label {
          font-size: 14px;
        }
        
        .color-palette {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .color-item {
          position: relative;
        }
        
        .color-picker {
          width: 36px;
          height: 36px;
          padding: 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .remove-color-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 18px;
          height: 18px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .add-color-btn {
          width: 36px;
          height: 36px;
          background-color: #f5f5f5;
          border: 1px dashed #aaa;
          border-radius: 4px;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .add-color-btn:hover {
          background-color: #e0e0e0;
        }
        
        input[type="range"] {
          width: 100%;
          margin-top: 8px;
        }
        
        .range-value {
          text-align: center;
          font-size: 14px;
          margin-top: 4px;
          color: #666;
        }
        
        .preview-note {
          margin-top: 24px;
          padding: 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 14px;
          color: #666;
        }
        
        .preview-note p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default VisualizationStep;
