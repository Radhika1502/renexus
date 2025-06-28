import React, { useState, useEffect } from 'react';
import { CustomReport } from '../../types/ai';

interface ReportField {
  id: string;
  name: string;
  type: 'metric' | 'dimension' | 'filter' | 'calculation';
  category: string;
  description: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  isSystem?: boolean;
}

interface ReportSection {
  id: string;
  title: string;
  visualizationType: string;
  fields: string[]; // IDs of fields
  filters?: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface ReportTemplateEditorProps {
  initialReport?: CustomReport;
  availableFields: ReportField[];
  availableTemplates: ReportTemplate[];
  onSave: (report: CustomReport) => void;
  onCancel: () => void;
}

/**
 * Component for creating and editing custom report templates
 */
const ReportTemplateEditor: React.FC<ReportTemplateEditorProps> = ({
  initialReport,
  availableFields,
  availableTemplates,
  onSave,
  onCancel
}) => {
  const [report, setReport] = useState<CustomReport>(initialReport || {
    id: '',
    name: 'New Report',
    description: '',
    metrics: [],
    filters: {},
    groupBy: '',
    sortBy: '',
    visualization: { type: 'bar', options: {} },
    createdBy: '',
    createdAt: '',
    updatedAt: ''
  });
  
  const [activeTab, setActiveTab] = useState<'data' | 'visualization' | 'template' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // List of available visualization types
  const visualizationTypes = [
    { id: 'bar', name: 'Bar Chart' },
    { id: 'line', name: 'Line Chart' },
    { id: 'pie', name: 'Pie Chart' },
    { id: 'table', name: 'Table' },
    { id: 'gauge', name: 'Gauge' },
    { id: 'card', name: 'Metric Card' }
  ];
  
  // Group fields by category
  const fieldsByCategory = React.useMemo(() => {
    const grouped: Record<string, ReportField[]> = {};
    
    availableFields.forEach(field => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    
    return grouped;
  }, [availableFields]);
  
  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = availableTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        // Create sections based on template
        const templateMetrics: string[] = [];
        let templateGroupBy = '';
        let templateSortBy = '';
        let templateVisualization = { type: 'bar', options: {} };
        
        // Extract template configuration into report format
        if (template.sections.length > 0) {
          const mainSection = template.sections[0];
          templateMetrics.push(...mainSection.fields.filter(f => {
            const field = availableFields.find(af => af.id === f);
            return field && field.type === 'metric';
          }));
          
          // Find a dimension for groupBy
          const dimensions = mainSection.fields.filter(f => {
            const field = availableFields.find(af => af.id === f);
            return field && field.type === 'dimension';
          });
          
          if (dimensions.length > 0) {
            templateGroupBy = dimensions[0];
          }
          
          // Set sort field if defined
          if (mainSection.sortBy) {
            templateSortBy = mainSection.sortBy;
          }
          
          // Set visualization
          templateVisualization = {
            type: mainSection.visualizationType || 'bar',
            options: {}
          };
        }
        
        // Update report with template values
        setReport(prev => ({
          ...prev,
          name: `${template.name} Copy`,
          description: template.description,
          metrics: templateMetrics,
          groupBy: templateGroupBy,
          sortBy: templateSortBy,
          visualization: templateVisualization
        }));
        
        // Move to data tab after template selection
        setActiveTab('data');
      }
    }
  }, [selectedTemplate, availableTemplates, availableFields]);
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!report.name.trim()) {
      errors.name = 'Report name is required';
    }
    
    if (report.metrics.length === 0) {
      errors.metrics = 'At least one metric is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Add timestamps
      const now = new Date().toISOString();
      const updatedReport = {
        ...report,
        updatedAt: now,
        createdAt: report.createdAt || now
      };
      
      onSave(updatedReport);
    }
  };
  
  // Handle field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReport(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle metric selection
  const handleMetricToggle = (metricId: string) => {
    setReport(prev => {
      const metrics = [...prev.metrics];
      const index = metrics.indexOf(metricId);
      
      if (index >= 0) {
        metrics.splice(index, 1);
      } else {
        metrics.push(metricId);
      }
      
      return { ...prev, metrics };
    });
  };
  
  // Handle visualization type change
  const handleVisualizationChange = (type: string) => {
    setReport(prev => ({
      ...prev,
      visualization: {
        ...prev.visualization,
        type
      }
    }));
  };
  
  // Render metric selection section
  const renderMetricSelection = () => {
    return (
      <div className="metric-selection">
        <h3>Select Metrics</h3>
        {formErrors.metrics && <div className="error-message">{formErrors.metrics}</div>}
        
        {Object.entries(fieldsByCategory).map(([category, fields]) => (
          <div key={category} className="field-category">
            <h4>{category}</h4>
            <div className="field-list">
              {fields
                .filter(field => field.type === 'metric')
                .map(field => (
                  <div 
                    key={field.id} 
                    className={`field-item ${report.metrics.includes(field.id) ? 'selected' : ''}`}
                    onClick={() => handleMetricToggle(field.id)}
                  >
                    <div className="field-name">{field.name}</div>
                    <div className="field-description">{field.description}</div>
                  </div>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render dimension selection (for groupBy)
  const renderDimensionSelection = () => {
    const dimensions = availableFields.filter(field => field.type === 'dimension');
    
    return (
      <div className="dimension-selection">
        <h3>Group By Dimension</h3>
        <div className="field-control">
          <select 
            name="groupBy" 
            value={report.groupBy} 
            onChange={handleInputChange}
            className="form-control"
          >
            <option value="">-- No Grouping --</option>
            {dimensions.map(dimension => (
              <option key={dimension.id} value={dimension.id}>
                {dimension.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };
  
  // Render sort options
  const renderSortOptions = () => {
    const sortableFields = [
      ...availableFields.filter(field => field.type === 'metric'),
      ...availableFields.filter(field => field.type === 'dimension')
    ];
    
    return (
      <div className="sort-options">
        <h3>Sort Options</h3>
        <div className="field-group">
          <div className="field-control">
            <label>Sort By</label>
            <select 
              name="sortBy" 
              value={report.sortBy} 
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="">-- Default Sort --</option>
              {sortableFields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="field-control">
            <label>Sort Direction</label>
            <select 
              name="sortDirection" 
              value={report.sortDirection || 'desc'} 
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>
    );
  };
  
  // Render visualization options
  const renderVisualizationOptions = () => {
    return (
      <div className="visualization-options">
        <h3>Visualization Type</h3>
        
        <div className="visualization-types">
          {visualizationTypes.map(visType => (
            <div 
              key={visType.id}
              className={`vis-type-card ${report.visualization.type === visType.id ? 'selected' : ''}`}
              onClick={() => handleVisualizationChange(visType.id)}
            >
              <div className="vis-icon">{/* Icon would go here */}</div>
              <div className="vis-name">{visType.name}</div>
            </div>
          ))}
        </div>
        
        {/* Visualization specific options would be rendered here based on selected type */}
        {report.visualization.type === 'bar' && (
          <div className="vis-options">
            <div className="field-control">
              <label>
                <input
                  type="checkbox"
                  name="stackedBar"
                  checked={report.visualization.options?.stacked || false}
                  onChange={(e) => {
                    setReport(prev => ({
                      ...prev,
                      visualization: {
                        ...prev.visualization,
                        options: {
                          ...prev.visualization.options,
                          stacked: e.target.checked
                        }
                      }
                    }));
                  }}
                />
                Stacked Bar Chart
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render template selection
  const renderTemplateSelection = () => {
    return (
      <div className="template-selection">
        <h3>Select a Template</h3>
        <p>Start with a pre-configured template or create a custom report from scratch.</p>
        
        <div className="template-grid">
          {/* Custom template card */}
          <div 
            className={`template-card ${!selectedTemplate ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate(null)}
          >
            <div className="template-icon">+</div>
            <div className="template-details">
              <h4>Custom Report</h4>
              <p>Start from scratch with a blank template</p>
            </div>
          </div>
          
          {/* Available templates */}
          {availableTemplates.map(template => (
            <div 
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="template-details">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                {template.isSystem && <div className="system-badge">System</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="report-template-editor">
      <form onSubmit={handleSubmit}>
        <div className="editor-header">
          <div className="title-section">
            <div className="field-group">
              <div className="field-control">
                <label htmlFor="reportName">Report Name</label>
                <input 
                  type="text"
                  id="reportName"
                  name="name"
                  value={report.name}
                  onChange={handleInputChange}
                  className={`form-control ${formErrors.name ? 'error' : ''}`}
                  placeholder="Enter report name"
                />
                {formErrors.name && <div className="error-message">{formErrors.name}</div>}
              </div>
              
              <div className="field-control">
                <label htmlFor="reportDescription">Description (Optional)</label>
                <textarea
                  id="reportDescription"
                  name="description"
                  value={report.description}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Describe the purpose of this report"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="editor-tabs">
          <div 
            className={`tab ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            Templates
          </div>
          <div 
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </div>
          <div 
            className={`tab ${activeTab === 'visualization' ? 'active' : ''}`}
            onClick={() => setActiveTab('visualization')}
          >
            Visualization
          </div>
          <div 
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </div>
        </div>
        
        <div className="editor-content">
          {activeTab === 'template' && renderTemplateSelection()}
          
          {activeTab === 'data' && (
            <div className="data-configuration">
              {renderMetricSelection()}
              {renderDimensionSelection()}
              {renderSortOptions()}
            </div>
          )}
          
          {activeTab === 'visualization' && renderVisualizationOptions()}
          
          {activeTab === 'preview' && (
            <div className="report-preview">
              <h3>Report Preview</h3>
              <p>This is a placeholder for the report preview.</p>
              {/* In a real implementation, this would render a preview of the report */}
              <div className="preview-placeholder">
                <p>Preview would be generated here based on selected configuration</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="editor-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Report
          </button>
        </div>
      </form>
      
      <style jsx>{`
        .report-template-editor {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .editor-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        
        .editor-tabs {
          display: flex;
          background-color: #f5f7fa;
          border-bottom: 1px solid #ddd;
        }
        
        .tab {
          padding: 12px 20px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .tab.active {
          background-color: #fff;
          border-bottom: 2px solid #4a6cf7;
          color: #4a6cf7;
        }
        
        .editor-content {
          padding: 20px;
          min-height: 400px;
        }
        
        .editor-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        .field-group {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .field-control {
          flex: 1;
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-control {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .form-control.error {
          border-color: #dc3545;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
        }
        
        .field-category {
          margin-bottom: 20px;
        }
        
        .field-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .field-item {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .field-item:hover {
          background-color: #f5f7fa;
        }
        
        .field-item.selected {
          border-color: #4a6cf7;
          background-color: rgba(74, 108, 247, 0.05);
        }
        
        .field-name {
          font-weight: 500;
        }
        
        .field-description {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        
        .visualization-types {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .vis-type-card {
          padding: 15px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .vis-type-card:hover {
          background-color: #f5f7fa;
        }
        
        .vis-type-card.selected {
          border-color: #4a6cf7;
          background-color: rgba(74, 108, 247, 0.05);
        }
        
        .vis-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .template-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        
        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .template-card.selected {
          border-color: #4a6cf7;
          background-color: rgba(74, 108, 247, 0.05);
        }
        
        .template-icon {
          font-size: 24px;
          color: #4a6cf7;
          margin-bottom: 10px;
        }
        
        .system-badge {
          display: inline-block;
          padding: 2px 8px;
          background-color: #e0e7ff;
          color: #4a6cf7;
          border-radius: 12px;
          font-size: 11px;
          margin-top: 5px;
        }
        
        .preview-placeholder {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #888;
          background-color: #f9f9f9;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer;
        }
        
        .btn-primary {
          background-color: #4a6cf7;
          color: white;
        }
        
        .btn-secondary {
          background-color: #f5f7fa;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default ReportTemplateEditor;
