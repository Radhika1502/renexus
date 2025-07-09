import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Button, Typography, Stepper, Step, StepLabel } from '@mui/material';
import { WidgetConfig, DataSource  } from "../../../shared/types/widget";
import DataSourceSelector from './DataSourceSelector';
import VisualizationOptions from './VisualizationOptions';
import FilterConfiguration from './FilterConfiguration';
import WidgetPreview from './WidgetPreview';

interface WidgetConfigurationPanelProps {
  initialConfig?: Partial<WidgetConfig>;
  onSave: (config: WidgetConfig) => void;
  onCancel: () => void;
  availableDataSources: DataSource[];
}

const steps = ['Data Source', 'Visualization', 'Filters', 'Preview & Save'];

/**
 * Widget Configuration Panel Component
 * 
 * Provides a multi-step wizard interface for configuring dashboard widgets
 * Allows users to select data sources, visualization types, and filtering options
 * Includes a live preview of the configured widget
 */
const WidgetConfigurationPanel: React.FC<WidgetConfigurationPanelProps> = ({
  initialConfig,
  onSave,
  onCancel,
  availableDataSources
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<Partial<WidgetConfig>>(initialConfig || {
    name: '',
    description: '',
    filters: [],
    visualization: {
      type: 'bar',
      title: '',
      colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8F44AD']
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle step navigation
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Validate the current step before proceeding
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (activeStep) {
      case 0: // Data Source
        if (!config.dataSourceId) {
          newErrors.dataSourceId = 'Please select a data source';
        }
        if (!config.name || config.name.trim() === '') {
          newErrors.name = 'Widget name is required';
        }
        break;
      case 1: // Visualization
        if (!config.visualization?.type) {
          newErrors.visualizationType = 'Please select a visualization type';
        }
        if (!config.visualization?.title || config.visualization.title.trim() === '') {
          newErrors.visualizationTitle = 'Visualization title is required';
        }
        break;
      case 2: // Filters
        // Filters are optional, no validation needed
        break;
      case 3: // Preview & Save
        // Final validation before saving
        if (!config.name || config.name.trim() === '') {
          newErrors.name = 'Widget name is required';
        }
        if (!config.dataSourceId) {
          newErrors.dataSourceId = 'Data source is required';
        }
        if (!config.visualization?.type) {
          newErrors.visualizationType = 'Visualization type is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle final save action
  const handleSave = () => {
    if (validateCurrentStep()) {
      // Generate an ID if this is a new widget
      const finalConfig = {
        ...config,
        id: config.id || `widget-${Date.now()}`,
        updatedAt: new Date().toISOString()
      } as WidgetConfig;
      
      onSave(finalConfig);
    }
  };

  // Update configuration based on step inputs
  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...updates
    }));
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <DataSourceSelector
            selectedDataSourceId={config.dataSourceId}
            dataSources={availableDataSources}
            onChange={(dataSourceId) => updateConfig({ dataSourceId })}
            widgetName={config.name || ''}
            widgetDescription={config.description || ''}
            onNameChange={(name) => updateConfig({ name })}
            onDescriptionChange={(description) => updateConfig({ description })}
            errors={errors}
          />
        );
      case 1:
        return (
          <VisualizationOptions
            visualization={config.visualization}
            dataSource={availableDataSources.find(ds => ds.id === config.dataSourceId)}
            onChange={(visualization) => updateConfig({ visualization })}
            errors={errors}
          />
        );
      case 2:
        return (
          <FilterConfiguration
            filters={config.filters || []}
            dataSource={availableDataSources.find(ds => ds.id === config.dataSourceId)}
            onChange={(filters) => updateConfig({ filters })}
          />
        );
      case 3:
        return (
          <WidgetPreview
            config={config as WidgetConfig}
            dataSource={availableDataSources.find(ds => ds.id === config.dataSourceId)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {config.id ? 'Edit Widget' : 'Create New Widget'}
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        {renderStepContent()}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? onCancel : handleBack}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={activeStep === steps.length - 1 ? handleSave : handleNext}
        >
          {activeStep === steps.length - 1 ? 'Save Widget' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default WidgetConfigurationPanel;

