# Widget Configuration Panel

A comprehensive React component for creating and editing dashboard widget configurations in the Renexus platform.

## Features

- Multi-step wizard interface for intuitive configuration
- Support for various widget types (chart, metric, table, list, timeline, map, custom)
- Flexible data source configuration with parameters
- Visualization options with type-specific settings
- Filter management with multiple operators and conditions
- Advanced settings including permissions, caching, and custom CSS
- Live widget preview during configuration
- Form validation with error feedback

## Component Structure

The Widget Configuration Panel is composed of the following components:

- **WidgetConfigPanel** (`index.tsx`) - Main component with wizard navigation and state management
- **BasicInfoStep** - Configure widget title, type, size, and refresh interval
- **DataSourceStep** - Select and configure data sources with parameters
- **VisualizationStep** - Choose visualization type and configure display options
- **FiltersStep** - Add, edit, and manage data filters
- **SettingsStep** - Configure advanced settings and permissions
- **WidgetPreview** - Live preview of the widget based on current configuration

## Usage

```tsx
import WidgetConfigPanel from './components/integration/WidgetConfigPanel';
import { WidgetConfig, WidgetDataSourceOption } from './components/integration/WidgetConfigPanel/types';

// Available data sources for the widget
const availableDataSources: WidgetDataSourceOption[] = [
  {
    id: 'sales-data',
    name: 'Sales Data',
    description: 'Monthly sales data for all products',
    type: 'api',
    endpoint: '/api/sales',
    parameters: [
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: true }
    ],
    sampleData: [/* sample data objects */]
  },
  // Additional data sources...
];

// Example component using the WidgetConfigPanel
const DashboardManager: React.FC = () => {
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [currentWidget, setCurrentWidget] = useState<WidgetConfig | null>(null);
  
  const handleSaveWidget = (widgetConfig: WidgetConfig) => {
    // Save the widget configuration to your state or backend
    console.log('Widget saved:', widgetConfig);
    setIsConfigPanelOpen(false);
  };
  
  return (
    <div>
      <button onClick={() => setIsConfigPanelOpen(true)}>
        Add Widget
      </button>
      
      {isConfigPanelOpen && (
        <WidgetConfigPanel
          widget={currentWidget || undefined}
          onSave={handleSaveWidget}
          onCancel={() => setIsConfigPanelOpen(false)}
          availableDataSources={availableDataSources}
          isNew={!currentWidget}
        />
      )}
    </div>
  );
};
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `widget` | `WidgetConfig \| undefined` | Existing widget configuration for editing. If not provided, creates a new widget. |
| `onSave` | `(widget: WidgetConfig) => void` | Callback function called when the widget is saved. |
| `onCancel` | `() => void` | Callback function called when the configuration is cancelled. |
| `availableDataSources` | `WidgetDataSourceOption[]` | Array of available data sources for the widget. |
| `isNew` | `boolean` | Whether this is a new widget (true) or editing an existing one (false). Default: true |
| `className` | `string \| undefined` | Optional CSS class name for styling the panel. |

## Integration Points

### Backend API Integration

The Widget Configuration Panel is designed to work with the following API endpoints:

- `GET /api/data-sources` - Fetch available data sources
- `GET /api/data-sources/:id/preview` - Fetch preview data for a data source
- `POST /api/widgets` - Create a new widget
- `PUT /api/widgets/:id` - Update an existing widget
- `GET /api/widgets/:id` - Fetch a widget configuration

### Dashboard Integration

To integrate with the dashboard system:

1. Import the WidgetConfigPanel component
2. Manage the visibility state of the panel
3. Handle the save callback to update your dashboard state
4. Pass available data sources from your backend

See the `example.tsx` file for a complete integration example.

## Extending the Component

### Adding New Widget Types

1. Update the `WidgetType` enum in `types.ts`
2. Add type-specific configuration options in `VisualizationStep.tsx`
3. Implement rendering for the new type in `WidgetPreview.tsx`

### Adding New Data Source Types

1. Update the data source types in `types.ts`
2. Add source-specific parameter handling in `DataSourceStep.tsx`
3. Implement data fetching logic in your application

## Future Enhancements

- Real-time data preview with actual API calls
- Advanced filter builder with complex conditions
- Template selection for quick widget creation
- Drag-and-drop layout configuration
- Widget dependency management for interactive dashboards
