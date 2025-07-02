/**
 * Widget Configuration Panel Reducer
 * Manages state for the widget configuration form
 */

import { WidgetFormState, WidgetFormAction, WidgetConfig } from './types';

// Default widget configuration
export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  id: '',
  title: 'New Widget',
  type: 'chart',
  size: 'medium',
  dataSource: {
    type: 'api',
    source: ''
  },
  visualization: {
    type: 'bar',
    options: {}
  }
};

// Initial state for the widget form
export const initialWidgetFormState: WidgetFormState = {
  currentStep: 0,
  config: DEFAULT_WIDGET_CONFIG,
  errors: {},
  previewData: null,
  isLoading: false,
  isSaving: false
};

/**
 * Reducer for widget configuration form state
 * @param state Current state
 * @param action Action to perform
 * @returns New state
 */
export function widgetFormReducer(
  state: WidgetFormState,
  action: WidgetFormAction
): WidgetFormState {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload
        }
      };
      
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload
      };
      
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      };
      
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {}
      };
      
    case 'SET_PREVIEW_DATA':
      return {
        ...state,
        previewData: action.payload
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload
      };
      
    default:
      return state;
  }
}

/**
 * Validate widget configuration
 * @param config Widget configuration to validate
 * @returns Object with validation errors
 */
export function validateWidgetConfig(config: WidgetConfig): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Validate title
  if (!config.title || config.title.trim() === '') {
    errors.title = 'Title is required';
  } else if (config.title.length > 50) {
    errors.title = 'Title must be less than 50 characters';
  }
  
  // Validate data source
  if (!config.dataSource.source) {
    errors.dataSource = 'Data source is required';
  }
  
  // Validate based on widget type
  if (config.type === 'chart') {
    if (!config.visualization.type) {
      errors.visualizationType = 'Visualization type is required';
    }
  }
  
  return errors;
}
