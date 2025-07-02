import React, { useState } from 'react';
import { WidgetConfig, WidgetFilter } from './types';

interface FiltersStepProps {
  config: WidgetConfig;
  onChange: (updates: Partial<WidgetConfig>) => void;
  errors: Record<string, string>;
}

/**
 * Filters Configuration Step
 * Allows adding, editing, and removing filters for the widget
 */
const FiltersStep: React.FC<FiltersStepProps> = ({
  config,
  onChange,
  errors
}) => {
  const [newFilter, setNewFilter] = useState<Partial<WidgetFilter>>({
    field: '',
    operator: 'eq',
    value: '',
    editable: true
  });
  
  // Available filter operators
  const filterOperators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater Than or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less Than or Equal' },
    { value: 'in', label: 'In (comma separated)' },
    { value: 'contains', label: 'Contains' },
    { value: 'between', label: 'Between (comma separated)' }
  ];
  
  // Add a new filter
  const handleAddFilter = () => {
    if (!newFilter.field || newFilter.value === undefined || newFilter.value === '') {
      return;
    }
    
    const filters = [...(config.filters || [])];
    filters.push(newFilter as WidgetFilter);
    
    onChange({ filters });
    
    // Reset new filter form
    setNewFilter({
      field: '',
      operator: 'eq',
      value: '',
      editable: true
    });
  };
  
  // Update an existing filter
  const handleUpdateFilter = (index: number, field: string, value: any) => {
    const filters = [...(config.filters || [])];
    filters[index] = {
      ...filters[index],
      [field]: value
    };
    
    onChange({ filters });
  };
  
  // Remove a filter
  const handleRemoveFilter = (index: number) => {
    const filters = (config.filters || []).filter((_, i) => i !== index);
    onChange({ filters });
  };
  
  // Move a filter up or down
  const handleMoveFilter = (index: number, direction: 'up' | 'down') => {
    if (!config.filters || config.filters.length < 2) return;
    
    const filters = [...config.filters];
    
    if (direction === 'up' && index > 0) {
      const temp = filters[index];
      filters[index] = filters[index - 1];
      filters[index - 1] = temp;
    } else if (direction === 'down' && index < filters.length - 1) {
      const temp = filters[index];
      filters[index] = filters[index + 1];
      filters[index + 1] = temp;
    }
    
    onChange({ filters });
  };
  
  return (
    <div className="widget-config-step filters-step">
      <h3 className="step-title">Configure Filters</h3>
      
      <div className="filters-description">
        <p>
          Add filters to limit the data displayed in this widget. Users will be able to
          modify editable filters at runtime.
        </p>
      </div>
      
      {/* Current filters */}
      {config.filters && config.filters.length > 0 ? (
        <div className="current-filters">
          <h4>Current Filters</h4>
          
          <div className="filters-list">
            {config.filters.map((filter, index) => (
              <div key={index} className="filter-item">
                <div className="filter-header">
                  <div className="filter-name">
                    <strong>{filter.field}</strong>
                    {filter.label && <span className="filter-label"> ({filter.label})</span>}
                  </div>
                  <div className="filter-actions">
                    <button
                      type="button"
                      className="move-btn"
                      onClick={() => handleMoveFilter(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="move-btn"
                      onClick={() => handleMoveFilter(index, 'down')}
                      disabled={index === (config.filters?.length || 0) - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveFilter(index)}
                      title="Remove filter"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="filter-content">
                  <div className="filter-row">
                    <div className="filter-field">
                      <label>Field</label>
                      <input
                        type="text"
                        value={filter.field}
                        onChange={(e) => handleUpdateFilter(index, 'field', e.target.value)}
                      />
                    </div>
                    
                    <div className="filter-operator">
                      <label>Operator</label>
                      <select
                        value={filter.operator}
                        onChange={(e) => handleUpdateFilter(index, 'operator', e.target.value)}
                      >
                        {filterOperators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="filter-row">
                    <div className="filter-value">
                      <label>Value</label>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(index, 'value', e.target.value)}
                      />
                    </div>
                    
                    <div className="filter-label-field">
                      <label>Display Label (Optional)</label>
                      <input
                        type="text"
                        value={filter.label || ''}
                        onChange={(e) => handleUpdateFilter(index, 'label', e.target.value)}
                        placeholder="Display name for this filter"
                      />
                    </div>
                  </div>
                  
                  <div className="filter-editable">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={filter.editable !== false}
                        onChange={(e) => handleUpdateFilter(index, 'editable', e.target.checked)}
                      />
                      <span className="checkbox-label">
                        Allow users to modify this filter
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-filters">
          <p>No filters have been added yet.</p>
        </div>
      )}
      
      {/* Add new filter */}
      <div className="add-filter-section">
        <h4>Add New Filter</h4>
        
        <div className="filter-row">
          <div className="filter-field">
            <label htmlFor="new-filter-field">Field</label>
            <input
              id="new-filter-field"
              type="text"
              value={newFilter.field}
              onChange={(e) => setNewFilter({ ...newFilter, field: e.target.value })}
              placeholder="Field name"
            />
          </div>
          
          <div className="filter-operator">
            <label htmlFor="new-filter-operator">Operator</label>
            <select
              id="new-filter-operator"
              value={newFilter.operator}
              onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value as any })}
            >
              {filterOperators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-value">
            <label htmlFor="new-filter-value">Value</label>
            <input
              id="new-filter-value"
              type="text"
              value={newFilter.value || ''}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              placeholder="Filter value"
            />
          </div>
          
          <div className="filter-label-field">
            <label htmlFor="new-filter-label">Display Label (Optional)</label>
            <input
              id="new-filter-label"
              type="text"
              value={newFilter.label || ''}
              onChange={(e) => setNewFilter({ ...newFilter, label: e.target.value })}
              placeholder="Display name for this filter"
            />
          </div>
        </div>
        
        <div className="filter-editable">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={newFilter.editable !== false}
              onChange={(e) => setNewFilter({ ...newFilter, editable: e.target.checked })}
            />
            <span className="checkbox-label">
              Allow users to modify this filter
            </span>
          </label>
        </div>
        
        <div className="add-filter-actions">
          <button
            type="button"
            className="add-filter-btn"
            onClick={handleAddFilter}
            disabled={!newFilter.field || newFilter.value === undefined || newFilter.value === ''}
          >
            Add Filter
          </button>
        </div>
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
        
        .filters-description {
          margin-bottom: 20px;
          padding: 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .filters-description p {
          margin: 0;
          color: #666;
        }
        
        h4 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 12px;
          margin-top: 24px;
        }
        
        .no-filters {
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 4px;
          text-align: center;
          color: #666;
        }
        
        .filters-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .filter-item {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }
        
        .filter-name {
          font-size: 14px;
        }
        
        .filter-label {
          color: #666;
        }
        
        .filter-actions {
          display: flex;
          gap: 4px;
        }
        
        .move-btn,
        .remove-btn {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          background-color: #e0e0e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        
        .move-btn:hover {
          background-color: #d0d0d0;
        }
        
        .move-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .remove-btn {
          background-color: #ffebee;
          color: #f44336;
        }
        
        .remove-btn:hover {
          background-color: #ffcdd2;
        }
        
        .filter-content {
          padding: 12px;
        }
        
        .filter-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .filter-field,
        .filter-operator,
        .filter-value,
        .filter-label-field {
          flex: 1;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        
        input,
        select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .filter-editable {
          margin-top: 8px;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          font-weight: normal;
        }
        
        .checkbox-container input {
          width: auto;
          margin-right: 8px;
        }
        
        .checkbox-label {
          font-size: 14px;
          color: #666;
        }
        
        .add-filter-actions {
          margin-top: 16px;
        }
        
        .add-filter-btn {
          padding: 8px 16px;
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .add-filter-btn:hover {
          background-color: #3a5ce5;
        }
        
        .add-filter-btn:disabled {
          background-color: #a0b0f8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default FiltersStep;
