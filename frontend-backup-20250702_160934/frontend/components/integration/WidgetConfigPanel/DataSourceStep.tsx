import React, { useState, useEffect } from 'react';
import { WidgetConfig, WidgetDataSourceOption } from './types';

interface DataSourceStepProps {
  config: WidgetConfig;
  onChange: (updates: Partial<WidgetConfig>) => void;
  availableDataSources?: WidgetDataSourceOption[];
  errors: Record<string, string>;
  previewData?: any;
}

/**
 * Data Source Configuration Step
 * Allows selection and configuration of widget data sources
 */
const DataSourceStep: React.FC<DataSourceStepProps> = ({
  config,
  onChange,
  availableDataSources = [],
  errors,
  previewData
}) => {
  const [selectedSource, setSelectedSource] = useState<WidgetDataSourceOption | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  
  // Find and set the selected data source when config changes
  useEffect(() => {
    if (config.dataSource.source) {
      const source = availableDataSources.find(ds => ds.id === config.dataSource.source);
      if (source) {
        setSelectedSource(source);
      }
    }
    
    // Initialize parameters from config
    if (config.dataSource.parameters) {
      setParameters(config.dataSource.parameters);
    }
  }, [config.dataSource.source, availableDataSources]);
  
  // Handle data source selection
  const handleSourceChange = (sourceId: string) => {
    const source = availableDataSources.find(ds => ds.id === sourceId);
    setSelectedSource(source || null);
    
    // Reset parameters when source changes
    const newParameters: Record<string, any> = {};
    
    // Set default values for parameters
    if (source?.parameters) {
      source.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
          newParameters[param.name] = param.defaultValue;
        }
      });
    }
    
    setParameters(newParameters);
    
    onChange({
      dataSource: {
        ...config.dataSource,
        type: source?.type || 'api',
        source: sourceId,
        parameters: newParameters
      }
    });
  };
  
  // Handle parameter value change
  const handleParameterChange = (paramName: string, value: any) => {
    const updatedParameters = {
      ...parameters,
      [paramName]: value
    };
    
    setParameters(updatedParameters);
    
    onChange({
      dataSource: {
        ...config.dataSource,
        parameters: updatedParameters
      }
    });
  };
  
  return (
    <div className="widget-config-step data-source-step">
      <h3 className="step-title">Select Data Source</h3>
      
      <div className="form-group">
        <label htmlFor="dataSource">Data Source</label>
        <select
          id="dataSource"
          value={config.dataSource.source}
          onChange={(e) => handleSourceChange(e.target.value)}
          className={errors.dataSource ? 'error' : ''}
        >
          <option value="">Select a data source</option>
          {availableDataSources.map(source => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        {errors.dataSource && <div className="error-message">{errors.dataSource}</div>}
      </div>
      
      {selectedSource && (
        <>
          <div className="source-description">
            <p>{selectedSource.description}</p>
            <div className="source-type-badge">{selectedSource.type}</div>
          </div>
          
          {selectedSource.parameters && selectedSource.parameters.length > 0 && (
            <div className="parameters-section">
              <h4>Parameters</h4>
              
              {selectedSource.parameters.map(param => (
                <div key={param.name} className="form-group">
                  <label htmlFor={`param-${param.name}`}>
                    {param.name} {param.required && <span className="required">*</span>}
                  </label>
                  
                  {param.type === 'string' && (
                    <input
                      id={`param-${param.name}`}
                      type="text"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={param.description}
                    />
                  )}
                  
                  {param.type === 'number' && (
                    <input
                      id={`param-${param.name}`}
                      type="number"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                      placeholder={param.description}
                    />
                  )}
                  
                  {param.type === 'boolean' && (
                    <div className="checkbox-wrapper">
                      <input
                        id={`param-${param.name}`}
                        type="checkbox"
                        checked={!!parameters[param.name]}
                        onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                      />
                      <span className="checkbox-label">{param.description}</span>
                    </div>
                  )}
                  
                  {param.type === 'date' && (
                    <input
                      id={`param-${param.name}`}
                      type="date"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    />
                  )}
                  
                  {/* Add more input types as needed */}
                  
                  {errors[`param-${param.name}`] && (
                    <div className="error-message">{errors[`param-${param.name}`]}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {selectedSource.sampleData && (
            <div className="sample-data-section">
              <h4>Sample Data</h4>
              <pre className="sample-data-preview">
                {JSON.stringify(selectedSource.sampleData, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
      
      <style>{`
        .widget-config-step {
          padding: 16px 0;
        }
        
        .step-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
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
        
        .source-description {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .source-description p {
          margin: 0;
          font-size: 14px;
        }
        
        .source-type-badge {
          background-color: #4a6cf7;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .parameters-section {
          margin-top: 16px;
        }
        
        .parameters-section h4 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 12px;
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
        
        .required {
          color: #f44336;
        }
        
        .sample-data-section {
          margin-top: 16px;
        }
        
        .sample-data-section h4 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        
        .sample-data-preview {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          overflow: auto;
          max-height: 200px;
        }
      `}</style>
    </div>
  );
};

export default DataSourceStep;
