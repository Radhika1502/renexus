import React, { useReducer, useEffect, useState } from 'react';
import { randomUUID } from 'crypto';
import { WidgetConfigPanelProps, WidgetConfig } from './types';
import { widgetFormReducer, initialWidgetFormState, validateWidgetConfig } from './reducer';
import BasicInfoStep from './BasicInfoStep';
import DataSourceStep from './DataSourceStep';
import VisualizationStep from './VisualizationStep';
import FiltersStep from './FiltersStep';
import SettingsStep from './SettingsStep';
import WidgetPreview from './WidgetPreview';

/**
 * Widget Configuration Panel Component
 * Allows users to create and edit dashboard widget configurations
 */
const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({
  widget,
  onSave,
  onCancel,
  availableDataSources,
  isNew = true,
  className
}) => {
  // Initialize state with existing widget config or default
  const [state, dispatch] = useReducer(
    widgetFormReducer,
    {
      ...initialWidgetFormState,
      config: widget || {
        ...initialWidgetFormState.config,
        id: isNew ? randomUUID() : ''
      }
    }
  );
  
  const { currentStep, config, errors, previewData, isLoading, isSaving } = state;
  
  // Steps for the configuration wizard
  const steps = [
    { id: 'basic', title: 'Basic Information', component: BasicInfoStep },
    { id: 'datasource', title: 'Data Source', component: DataSourceStep },
    { id: 'visualization', title: 'Visualization', component: VisualizationStep },
    { id: 'filters', title: 'Filters', component: FiltersStep },
    { id: 'settings', title: 'Settings', component: SettingsStep }
  ];
  
  // Load preview data when data source changes
  useEffect(() => {
    const loadPreviewData = async () => {
      if (!config.dataSource.source) return;
      
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // In a real implementation, this would fetch data from the API
        // For now, we'll use a timeout to simulate an API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data for preview
        const mockData = generateMockData(config);
        
        dispatch({ type: 'SET_PREVIEW_DATA', payload: mockData });
      } catch (error) {
        console.error('Error loading preview data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadPreviewData();
  }, [config.dataSource]);
  
  // Generate mock data for preview
  const generateMockData = (config: WidgetConfig) => {
    // This would be replaced with actual data in a real implementation
    if (config.visualization.type === 'bar' || config.visualization.type === 'line') {
      return Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 100)
      }));
    } else if (config.visualization.type === 'pie') {
      return Array.from({ length: 5 }, (_, i) => ({
        label: `Category ${i + 1}`,
        value: Math.floor(Math.random() * 100)
      }));
    } else if (config.visualization.type === 'table') {
      return Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 100),
        status: ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)]
      }));
    }
    
    return null;
  };
  
  // Handle next step
  const handleNext = () => {
    const stepValidation = validateStepData(currentStep);
    
    if (Object.keys(stepValidation).length === 0) {
      dispatch({ type: 'SET_STEP', payload: currentStep + 1 });
      dispatch({ type: 'CLEAR_ERRORS' });
    } else {
      dispatch({ type: 'SET_ERRORS', payload: stepValidation });
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    dispatch({ type: 'SET_STEP', payload: Math.max(0, currentStep - 1) });
    dispatch({ type: 'CLEAR_ERRORS' });
  };
  
  // Validate current step data
  const validateStepData = (step: number) => {
    const stepErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Basic Info
        if (!config.title || config.title.trim() === '') {
          stepErrors.title = 'Title is required';
        }
        break;
        
      case 1: // Data Source
        if (!config.dataSource.source) {
          stepErrors.dataSource = 'Data source is required';
        }
        break;
        
      case 2: // Visualization
        if (!config.visualization.type) {
          stepErrors.visualizationType = 'Visualization type is required';
        }
        break;
    }
    
    return stepErrors;
  };
  
  // Handle save
  const handleSave = async () => {
    const validationErrors = validateWidgetConfig(config);
    
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', payload: validationErrors });
      return;
    }
    
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      // Update timestamps
      const updatedConfig: WidgetConfig = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      
      if (isNew) {
        updatedConfig.createdAt = updatedConfig.updatedAt;
      }
      
      // In a real implementation, this would save to an API or database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSave(updatedConfig);
    } catch (error) {
      console.error('Error saving widget configuration:', error);
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };
  
  // Render current step component
  const renderStepComponent = () => {
    const StepComponent = steps[currentStep].component;
    
    // Create props based on the component type
    const commonProps = {
      config,
      onChange: (updates: Partial<WidgetConfig>) => dispatch({ type: 'SET_CONFIG', payload: updates }),
      errors,
      previewData
    };
    
    // Add availableDataSources prop for DataSourceStep
    if (currentStep === 1) { // DataSource step
      return (
        <StepComponent
          {...commonProps}
          availableDataSources={availableDataSources || []}
        />
      );
    }
    
    return <StepComponent {...commonProps} />;
  };
  
  return (
    <div className={`widget-config-panel ${className || ''}`}>
      <div className="widget-config-container">
        <div className="widget-config-header">
          <h2 className="widget-config-title">
            {isNew ? 'Create New Widget' : 'Edit Widget'}
          </h2>
          <button
            type="button"
            className="close-button"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="widget-config-content">
          <div className="widget-config-sidebar">
            <div className="steps-container">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`step-item ${index === currentStep ? 'active' : ''} ${
                    index < currentStep ? 'completed' : ''
                  }`}
                  onClick={() => {
                    if (index < currentStep) {
                      dispatch({ type: 'SET_STEP', payload: index });
                    }
                  }}
                >
                  <div className="step-number">
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <div className="step-title">{step.title}</div>
                </div>
              ))}
            </div>
            
            <div className="preview-container">
              <h3 className="preview-title">Widget Preview</h3>
              <WidgetPreview config={config} />
              {isLoading && <div className="preview-loading">Loading preview...</div>}
            </div>
          </div>
          
          <div className="widget-config-form">
            {renderStepComponent()}
            
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={currentStep === 0 ? onCancel : handlePrevious}
              >
                {currentStep === 0 ? 'Cancel' : 'Previous'}
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleNext}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Widget'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .widget-config-panel {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .widget-config-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .widget-config-header {
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .widget-config-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .close-button:hover {
          color: #333;
        }
        
        .widget-config-content {
          display: flex;
          height: calc(90vh - 70px);
          overflow: hidden;
        }
        
        .widget-config-sidebar {
          width: 300px;
          border-right: 1px solid #eee;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .steps-container {
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .step-item {
          display: flex;
          align-items: center;
          padding: 12px 8px;
          margin-bottom: 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .step-item:last-child {
          margin-bottom: 0;
        }
        
        .step-item.active {
          background-color: #f0f4ff;
        }
        
        .step-item.completed {
          color: #4a6cf7;
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #e0e0e0;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          margin-right: 12px;
        }
        
        .step-item.active .step-number {
          background-color: #4a6cf7;
          color: white;
        }
        
        .step-item.completed .step-number {
          background-color: #4a6cf7;
          color: white;
        }
        
        .step-title {
          font-size: 14px;
          font-weight: 500;
        }
        
        .preview-container {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }
        
        .preview-title {
          font-size: 16px;
          font-weight: 500;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .preview-loading {
          text-align: center;
          padding: 16px;
          color: #666;
          font-size: 14px;
        }
        
        .widget-config-form {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        .secondary-button,
        .primary-button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .secondary-button {
          background-color: white;
          border: 1px solid #ddd;
          color: #666;
        }
        
        .secondary-button:hover {
          background-color: #f5f5f5;
        }
        
        .primary-button {
          background-color: #4a6cf7;
          border: 1px solid #4a6cf7;
          color: white;
        }
        
        .primary-button:hover {
          background-color: #3a5ce5;
        }
        
        .primary-button:disabled {
          background-color: #a0b0f8;
          border-color: #a0b0f8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default WidgetConfigPanel;
