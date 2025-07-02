import React, { useState, useEffect, useCallback } from 'react';

interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'text' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface FilterState {
  [key: string]: any;
}

interface AdvancedFilteringProps {
  filters: FilterOption[];
  onFilterChange: (filters: FilterState) => void;
  title?: string;
  showApplyButton?: boolean;
  showResetButton?: boolean;
  collapsible?: boolean;
  initialCollapsed?: boolean;
  presets?: Array<{ name: string; filters: FilterState }>;
  onSavePreset?: (name: string, filters: FilterState) => void;
}

/**
 * Advanced Filtering component for analytics visualizations
 * Supports multiple filter types, presets, and real-time or manual application
 */
const AdvancedFiltering: React.FC<AdvancedFilteringProps> = ({
  filters,
  onFilterChange,
  title = 'Filters',
  showApplyButton = false,
  showResetButton = true,
  collapsible = true,
  initialCollapsed = false,
  presets = [],
  onSavePreset
}) => {
  const [filterState, setFilterState] = useState<FilterState>({});
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  
  // Initialize filter state with default values
  useEffect(() => {
    const initialState: FilterState = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        initialState[filter.id] = filter.defaultValue;
      } else {
        // Set appropriate default values based on filter type
        switch (filter.type) {
          case 'select':
            initialState[filter.id] = filter.options && filter.options.length > 0 ? filter.options[0].value : '';
            break;
          case 'multiselect':
            initialState[filter.id] = [];
            break;
          case 'date':
            initialState[filter.id] = null;
            break;
          case 'daterange':
            initialState[filter.id] = { start: null, end: null };
            break;
          case 'number':
            initialState[filter.id] = filter.min !== undefined ? filter.min : 0;
            break;
          case 'numberrange':
            initialState[filter.id] = { 
              min: filter.min !== undefined ? filter.min : 0, 
              max: filter.max !== undefined ? filter.max : 100 
            };
            break;
          case 'text':
            initialState[filter.id] = '';
            break;
          case 'boolean':
            initialState[filter.id] = false;
            break;
        }
      }
    });
    setFilterState(initialState);
  }, [filters]);
  
  // Apply filters when filter state changes (if not using apply button)
  useEffect(() => {
    if (!showApplyButton) {
      onFilterChange(filterState);
    }
  }, [filterState, onFilterChange, showApplyButton]);
  
  // Handle individual filter change
  const handleFilterChange = (filterId: string, value: any) => {
    setFilterState(prevState => ({
      ...prevState,
      [filterId]: value
    }));
    
    // Clear active preset when filters change
    setActivePreset(null);
  };
  
  // Handle apply button click
  const handleApply = () => {
    onFilterChange(filterState);
  };
  
  // Handle reset button click
  const handleReset = () => {
    const resetState: FilterState = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        resetState[filter.id] = filter.defaultValue;
      } else {
        // Reset to appropriate default values based on filter type
        switch (filter.type) {
          case 'select':
            resetState[filter.id] = filter.options && filter.options.length > 0 ? filter.options[0].value : '';
            break;
          case 'multiselect':
            resetState[filter.id] = [];
            break;
          case 'date':
            resetState[filter.id] = null;
            break;
          case 'daterange':
            resetState[filter.id] = { start: null, end: null };
            break;
          case 'number':
            resetState[filter.id] = filter.min !== undefined ? filter.min : 0;
            break;
          case 'numberrange':
            resetState[filter.id] = { 
              min: filter.min !== undefined ? filter.min : 0, 
              max: filter.max !== undefined ? filter.max : 100 
            };
            break;
          case 'text':
            resetState[filter.id] = '';
            break;
          case 'boolean':
            resetState[filter.id] = false;
            break;
        }
      }
    });
    
    setFilterState(resetState);
    setActivePreset(null);
    
    if (showApplyButton) {
      onFilterChange(resetState);
    }
  };
  
  // Apply preset
  const applyPreset = (presetIndex: number) => {
    const preset = presets[presetIndex];
    setFilterState(preset.filters);
    setActivePreset(preset.name);
    
    if (showApplyButton) {
      onFilterChange(preset.filters);
    }
  };
  
  // Save current filters as preset
  const savePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filterState);
      setPresetName('');
      setShowSavePreset(false);
      setActivePreset(presetName.trim());
    }
  };
  
  // Render filter input based on filter type
  const renderFilterInput = (filter: FilterOption) => {
    const value = filterState[filter.id];
    
    switch (filter.type) {
      case 'select':
        return (
          <select
            id={`filter-${filter.id}`}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="filter-select"
          >
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'multiselect':
        return (
          <div className="multiselect-container">
            {filter.options?.map(option => (
              <label key={option.value} className="multiselect-option">
                <input
                  type="checkbox"
                  checked={value?.includes(option.value)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...(value || []), option.value]
                      : (value || []).filter((v: string) => v !== option.value);
                    handleFilterChange(filter.id, newValue);
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
        
      case 'date':
        return (
          <input
            type="date"
            id={`filter-${filter.id}`}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="filter-date"
          />
        );
        
      case 'daterange':
        return (
          <div className="daterange-container">
            <input
              type="date"
              placeholder="Start date"
              value={value?.start || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, start: e.target.value })}
              className="filter-date"
            />
            <span className="range-separator">to</span>
            <input
              type="date"
              placeholder="End date"
              value={value?.end || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, end: e.target.value })}
              className="filter-date"
            />
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={`filter-${filter.id}`}
            value={value}
            min={filter.min}
            max={filter.max}
            step={filter.step || 1}
            onChange={(e) => handleFilterChange(filter.id, parseFloat(e.target.value))}
            className="filter-number"
          />
        );
        
      case 'numberrange':
        return (
          <div className="numberrange-container">
            <input
              type="number"
              placeholder="Min"
              value={value?.min}
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              onChange={(e) => handleFilterChange(filter.id, { ...value, min: parseFloat(e.target.value) })}
              className="filter-number"
            />
            <span className="range-separator">to</span>
            <input
              type="number"
              placeholder="Max"
              value={value?.max}
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              onChange={(e) => handleFilterChange(filter.id, { ...value, max: parseFloat(e.target.value) })}
              className="filter-number"
            />
          </div>
        );
        
      case 'text':
        return (
          <input
            type="text"
            id={`filter-${filter.id}`}
            value={value || ''}
            placeholder={filter.placeholder}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="filter-text"
          />
        );
        
      case 'boolean':
        return (
          <label className="filter-boolean">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
            />
            <span>{filter.label}</span>
          </label>
        );
        
      default:
        return null;
    }
  };
  
  // Render presets section
  const renderPresets = () => {
    if (presets.length === 0 && !onSavePreset) return null;
    
    return (
      <div className="presets-section">
        <div className="presets-header">
          <h4>Saved Filters</h4>
          {onSavePreset && (
            <button 
              className="preset-button"
              onClick={() => setShowSavePreset(!showSavePreset)}
            >
              {showSavePreset ? 'Cancel' : 'Save Current'}
            </button>
          )}
        </div>
        
        {showSavePreset && (
          <div className="save-preset-form">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name"
              className="preset-name-input"
            />
            <button 
              className="save-preset-button"
              onClick={savePreset}
              disabled={!presetName.trim()}
            >
              Save
            </button>
          </div>
        )}
        
        {presets.length > 0 && (
          <div className="preset-list">
            {presets.map((preset, index) => (
              <button
                key={preset.name}
                className={`preset-item ${activePreset === preset.name ? 'active' : ''}`}
                onClick={() => applyPreset(index)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="advanced-filtering">
      <div className="filter-header" onClick={() => collapsible && setIsCollapsed(!isCollapsed)}>
        <h3>{title}</h3>
        {collapsible && (
          <button className="collapse-button">
            {isCollapsed ? '▼' : '▲'}
          </button>
        )}
      </div>
      
      {!isCollapsed && (
        <>
          {renderPresets()}
          
          <div className="filters-container">
            {filters.map(filter => (
              <div key={filter.id} className="filter-item">
                <label htmlFor={`filter-${filter.id}`} className="filter-label">
                  {filter.label}
                </label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
          
          <div className="filter-actions">
            {showResetButton && (
              <button 
                className="reset-button"
                onClick={handleReset}
              >
                Reset
              </button>
            )}
            
            {showApplyButton && (
              <button 
                className="apply-button"
                onClick={handleApply}
              >
                Apply Filters
              </button>
            )}
          </div>
        </>
      )}
      
      <style jsx>{`
        .advanced-filtering {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: ${collapsible ? 'pointer' : 'default'};
          padding-bottom: ${isCollapsed ? '0' : '10px'};
          border-bottom: ${isCollapsed ? 'none' : '1px solid #eee'};
        }
        
        .filter-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .collapse-button {
          background: none;
          border: none;
          font-size: 14px;
          cursor: pointer;
          color: #666;
        }
        
        .presets-section {
          margin-top: 15px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .presets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .presets-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }
        
        .preset-button {
          background: none;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          color: #333;
        }
        
        .preset-button:hover {
          background-color: #f5f5f5;
        }
        
        .save-preset-form {
          display: flex;
          margin-bottom: 10px;
        }
        
        .preset-name-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px 0 0 4px;
          font-size: 14px;
        }
        
        .save-preset-button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .save-preset-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
        
        .preset-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .preset-item {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .preset-item.active {
          background-color: #4a6cf7;
          color: white;
          border-color: #4a6cf7;
        }
        
        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .filter-item {
          display: flex;
          flex-direction: column;
        }
        
        .filter-label {
          font-size: 14px;
          margin-bottom: 5px;
          color: #555;
        }
        
        .filter-select,
        .filter-text,
        .filter-date,
        .filter-number {
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
        }
        
        .multiselect-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
          max-height: 150px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 5px;
        }
        
        .multiselect-option {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        
        .multiselect-option input {
          margin-right: 8px;
        }
        
        .daterange-container,
        .numberrange-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .range-separator {
          font-size: 12px;
          color: #666;
        }
        
        .filter-boolean {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        
        .filter-boolean input {
          margin-right: 8px;
        }
        
        .filter-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .reset-button {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px 15px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .apply-button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 15px;
          font-size: 14px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AdvancedFiltering;
